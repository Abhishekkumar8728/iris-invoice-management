import "dotenv/config";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import invoiceRoutes from "./routes/invoice.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import reportRoutes from "./routes/report.routes.js";

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
    limit: "2mb",
  })
);




app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
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
        200
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
        "invoice-service",
      status: "UP",
      timestamp:
        new Date().toISOString(),
    });
  }
);




app.use(
  "/api/v1/invoices",
  invoiceRoutes
);

app.use(
  "/api/v1/vendors",
  vendorRoutes
);

app.use(
  "/api/v1/reports",
  reportRoutes
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