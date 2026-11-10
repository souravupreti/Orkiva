import express from "express";

import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import organizationRoutes from "./routes/organization.routes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "Orkiva Auth Service",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "auth-service",
    status: "healthy"
  });
});

app.use("/auth", authRoutes);
app.use("/organizations", organizationRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

const server = app.listen(env.port, () => {
  console.log(`Auth Service running on port ${env.port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);