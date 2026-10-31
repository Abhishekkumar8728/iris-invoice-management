import "dotenv/config";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import notificationRoutes from "./routes/notification.routes.js";
import userNotificationRoutes from "./routes/user-notification.routes.js";

import errorMiddleware from "./middleware/error.middleware.js";

const app =
  express();




app.use(
  helmet()
);




app.use(
  cors({
    origin:
      process.env.FRONTEND_URL,
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
    limit: "1mb",
  })
);




const apiLimiter =
  rateLimit({
    windowMs:
      Number(
        process.env.RATE_LIMIT_WINDOW_MS ||
        15 * 60 * 1000
      ),

    max:
      Number(
        process.env.RATE_LIMIT_MAX ||
        100
      ),

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many requests. Please try again later.",
    },
  });

app.use(
  "/api/v1",
  apiLimiter
);




app.get(
  "/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      service:
        "notification-service",
      status: "UP",
      timestamp:
        new Date().toISOString(),
    });
  }
);




app.use(
  "/api/v1/internal/notifications",
  notificationRoutes
);

app.use(
  "/api/v1/notifications",
  userNotificationRoutes
);




app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "Route not found",
      path:
        req.originalUrl,
    });
  }
);




app.use(
  errorMiddleware
);

export default app;