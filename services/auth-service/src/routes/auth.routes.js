import express from "express";
import argon2 from "argon2";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128)
});


router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found"
      });
    }

    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    // Validate input
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration data",
        errors: result.error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    const { name, password } = result.data;
    const email = result.data.email.toLowerCase();

    // Check whether email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    // Hash password
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id
    });

    // Save user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user
    });

  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    next(error);
  }
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
});

router.post("/login", async (req, res, next) => {
  try {
    // Validate input
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login data"
      });
    }

    const email = result.data.email.toLowerCase();
    const { password } = result.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Verify password
    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT
    const accessToken = jwt.sign(
      {
        sub: user.id
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn,
        issuer: "orkiva-auth"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;