import "dotenv/config";

import express from "express";
import helmet from "helmet";
import cors from "cors";

import requestIdMiddleware from "./middleware/request-id.middleware.js";
import authenticateRequest from "./middleware/auth.middleware.js";
import {
  apiRateLimiter,
  authRateLimiter,
} from "./middleware/rate-limit.middleware.js";
import proxyRoutes from "./routes/proxy.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import validateEnvironment from "./config/env.js";

const app = express();
validateEnvironment();

const frontendUrl = process.env.FRONTEND_URL;

if (
  process.env.NODE_ENV === "production" &&
  !frontendUrl
) {
  throw new Error(
    "FRONTEND_URL is required in production."
  );
}

app.use(helmet());

app.use(
  cors({
    origin: frontendUrl || "http://localhost:4200",
    credentials: true,
    exposedHeaders: ["RateLimit-Reset", "Retry-After"],
  })
);











app.use(requestIdMiddleware);

app.use(requestIdMiddleware);

app.use(apiRateLimiter);
app.post("/api/v1/auth/login", authRateLimiter);

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "api-gateway",
    status: "UP",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

app.use(authenticateRequest);

app.use(proxyRoutes);

app.use(errorMiddleware);

export default app;