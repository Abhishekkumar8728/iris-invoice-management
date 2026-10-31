import "dotenv/config";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import { authenticate, authorize } from "./middleware/auth.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";




const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/v1", apiLimiter);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "auth-service",
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRoutes);

app.get("/api/v1/auth/me", authenticate, (req, res) => {
  res.json({
    success: true,
    message: "Authenticated user",
    data: req.user,
  });
});

app.get("/api/v1/auth/admin-test", authenticate, authorize("ADMIN"), (req, res) => {
  res.json({
    success: true,
    message: "Admin authorization successful",
    data: req.user,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use(errorMiddleware);

export default app;