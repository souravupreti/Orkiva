
import express from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeOrganization } from "../middleware/authorize-organization.js";

const router = express.Router();

const organizationSchema = z.object({
  name: z.string().trim().min(2).max(100)
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const result = organizationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization name"
      });
    }

    const { name } = result.data;

    const slug = `${name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${Date.now()}`;

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: req.user.id,
            role: "OWNER"
          }
        }
      },
      include: {
        members: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:organizationId",
  authenticate,
  authorizeOrganization("OWNER", "ADMIN", "MEMBER", "VIEWER"),
  async (req, res, next) => {
    try {
      const organization = await prisma.organization.findUnique({
        where: {
          id: req.params.organizationId
        },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true
        }
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: "Organization not found"
        });
      }

      return res.status(200).json({
        success: true,
        organization
      });
    } catch (error) {
      next(error);
    }
  }
);


//member routes
router.get(
  "/:organizationId/members",
  authenticate,
  authorizeOrganization("OWNER", "ADMIN", "MEMBER", "VIEWER"),
  async (req, res, next) => {
    try {
      const members = await prisma.organizationMember.findMany({
        where: {
          organizationId: req.params.organizationId
        },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        count: members.length,
        members
      });
    } catch (error) {
      next(error);
    }
  }
);
export default router;
