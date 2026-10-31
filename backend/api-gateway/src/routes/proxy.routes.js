import express from "express";
import { createProxyMiddleware,responseInterceptor } from "http-proxy-middleware";

import services from "../config/services.js";

const router = express.Router();
const sanitizeProxyResponse = (
  responseBuffer,
  proxyRes
) => {
  if (
    proxyRes.statusCode < 500 ||
    proxyRes.statusCode >= 600
  ) {
    return responseBuffer;
  }

  return JSON.stringify({
    success: false,
    message:
      "Downstream service encountered an internal error.",
  });
};

const createServiceProxy = ({
  target,
  serviceName,
  pathRewrite,
  basePath,
}) => {
  const proxyTimeout = Number(
  process.env.PROXY_TIMEOUT_MS || 15000
);
  if (!target) {
    throw new Error(
      `${serviceName} target URL is not configured`
    );
  }

  return createProxyMiddleware({
  target,

  changeOrigin: true,

  pathRewrite:
    pathRewrite || {
      "^/": `${basePath}/`,
    },

  timeout: undefined,

proxyTimeout,

  selfHandleResponse: true,

  on: {
    proxyReq: (proxyReq, req) => {
      proxyReq.setHeader(
        "x-service-key",
        process.env.INTERNAL_SERVICE_KEY
      );

      proxyReq.setHeader(
        "x-request-id",
        req.requestId
      );

      if (req.user) {
        proxyReq.setHeader(
          "x-user-id",
          req.user.sub
        );

        proxyReq.setHeader(
          "x-user-role",
          req.user.role
        );

        proxyReq.setHeader(
          "x-employee-id",
          req.user.employeeId
        );
      }

      console.log(
        `[Gateway] ${serviceName} ${req.method} ${req.originalUrl}`
      );
    },

    proxyRes: responseInterceptor(
      sanitizeProxyResponse
    ),

    error: (error, req, res) => {
  console.error(
    `[Gateway] ${serviceName} error:`,
    error.message
  );

  if (res.headersSent || res.destroyed) {
    return;
  }

  const isTimeout =
    error.code === "ETIMEDOUT" ||
    error.code === "ESOCKETTIMEDOUT" ||
    error.code === "ECONNRESET" ||
    error.message?.toLowerCase().includes("timeout");

  return res.status(
    isTimeout ? 504 : 502
  ).json({
    success: false,
    message: isTimeout
      ? `${serviceName} service timeout`
      : `${serviceName} service unavailable`,
    requestId: req.requestId,
  });
},
  },
});
};




router.use(
  "/api/v1/auth",
  createServiceProxy({
    target: services.auth.url,
    serviceName: "Auth Service",
    basePath: "/api/v1/auth",
  })
);




router.use(
  "/api/v1/users",
  createServiceProxy({
    target: services.user.url,
    serviceName: "User Service",
    basePath: "/api/v1/users",
  })
);




router.use(
  "/api/v1/invoices",
  createServiceProxy({
    target: services.invoice.url,
    serviceName: "Invoice Service",
    basePath: "/api/v1/invoices",
  })
);




router.use(
  "/api/v1/vendors",
  createServiceProxy({
    target: services.invoice.url,
    serviceName: "Invoice Service",
    basePath: "/api/v1/vendors",
  })
);

router.use(
  "/api/v1/reports",
  createServiceProxy({
    target: services.invoice.url,
    serviceName: "Invoice Service",
    basePath: "/api/v1/reports",
  })
);











router.use(
  "/api/v1/notifications",
  createServiceProxy({
    target: services.notification.url,
    serviceName: "Notification Service",
    basePath: "/api/v1/notifications",
  })
);

export default router;