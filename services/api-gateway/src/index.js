import express from "express";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const app = express();

app.use(express.json());

// Request logging middleware
app.use(
  pinoHttp({
    logger
  })
);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Orkiva API Gateway",
    status: "running"
  });
});

// Liveness check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: env.serviceName,
    status: "healthy"
  });
});

// Readiness check
app.get("/ready", (req, res) => {
  res.status(200).json({
    success: true,
    service: env.serviceName,
    status: "ready"
  });
});

// Test error route
app.get("/test-error", (req, res, next) => {
  const error = new Error("Something went wrong");
  next(error);
});

// Centralized error handler
app.use((err, req, res, next) => {
  req.log.error({ err }, "Unhandled request error");

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// Start server
app.listen(env.port, () => {
  logger.info(
    `${env.serviceName} running on port ${env.port}`
  );
});