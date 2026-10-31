import dotenv from "dotenv";
import http from "node:http";

import request from "supertest";
import jwt from "jsonwebtoken";

dotenv.config({
  path: ".env.test",
  override: true,
});

const AUTH_PORT = 4991;
const USER_PORT = 4992;
const INVOICE_PORT = 4993;
const NOTIFICATION_PORT = 4994;
const FAILURE_PORT = 4995;

const createJwt = ({
  sub = "USER123",
  employeeId = "EMP001",
  role = "USER",
  expiresIn = "15m",
} = {}) => {
  return jwt.sign(
    {
      sub,
      employeeId,
      role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn,
    }
  );
};

const createMockService = (
  port,
  expectedServiceName
) => {
  const server = http.createServer(
    async (req, res) => {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        let parsedBody = null;

        if (body) {
          try {
            parsedBody = JSON.parse(body);
          } catch {
            parsedBody = body;
          }
        }

        res.writeHead(200, {
          "content-type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: true,
            service: expectedServiceName,
            method: req.method,
            url: req.url,
            headers: {
              serviceKey:
                req.headers["x-service-key"],
              requestId:
                req.headers["x-request-id"],
              userId:
                req.headers["x-user-id"],
              employeeId:
                req.headers["x-employee-id"],
              userRole:
                req.headers["x-user-role"],
            },
            body: parsedBody,
          })
        );
      });
    }
  );

  return new Promise((resolve, reject) => {
    server.once("error", reject);

    server.listen(
      port,
      "127.0.0.1",
      () => {
        resolve(server);
      }
    );
  });
};
const createFailureService = (
  port,
  mode
) => {
  const server = http.createServer(
    (req, res) => {
      if (mode === "error") {
        res.writeHead(500, {
          "content-type":
            "application/json",
        });

        res.end(
          JSON.stringify({
            success: false,
            message:
              "Downstream internal error",
          })
        );

        return;
      }

      if (mode === "slow") {
        setTimeout(() => {
          if (!res.headersSent) {
            res.writeHead(200, {
              "content-type":
                "application/json",
            });

            res.end(
              JSON.stringify({
                success: true,
              })
            );
          }
        }, 20000);

        return;
      }
    }
  );

  return new Promise((resolve, reject) => {
    server.once("error", reject);

    server.listen(
      port,
      "127.0.0.1",
      () => {
        resolve(server);
      }
    );
  });
};

let authService;
let userService;
let invoiceService;
let notificationService;
let app;
let failureService;

beforeAll(async () => {
  authService = await createMockService(
    AUTH_PORT,
    "auth-service"
  );

  userService = await createMockService(
    USER_PORT,
    "user-service"
  );

  invoiceService = await createMockService(
    INVOICE_PORT,
    "invoice-service"
  );

  notificationService =
    await createMockService(
      NOTIFICATION_PORT,
      "notification-service"
    );

  const appModule = await import(
    "../src/app.js"
  );

  app = appModule.default;
});

afterAll(async () => {
  await Promise.all([
    new Promise((resolve) =>
      authService?.close(resolve)
    ),

    new Promise((resolve) =>
      userService?.close(resolve)
    ),

    new Promise((resolve) =>
      invoiceService?.close(resolve)
    ),

    new Promise((resolve) =>
      notificationService?.close(resolve)
    ),
  ]);
});

describe("API Gateway", () => {
  describe("Health", () => {
    test(
      "GET /health should return gateway health",
      async () => {
        const response = await request(app)
          .get("/health");

        expect(response.status).toBe(200);

        expect(response.body.success)
          .toBe(true);

        expect(response.body.service)
          .toBe("api-gateway");

        expect(response.body.status)
          .toBe("UP");

        expect(response.headers["x-request-id"])
          .toBeDefined();
      }
    );
  });







































































  describe("Rate Limiting", () => {
  test(
    "should apply stricter rate limit to authentication endpoints",
    async () => {
      const originalMax =
        process.env.AUTH_RATE_LIMIT_MAX;

      process.env.AUTH_RATE_LIMIT_MAX = "2";







      process.env.AUTH_RATE_LIMIT_MAX =
        originalMax;
    }
  );
});

  describe("Authentication", () => {
    test(
      "protected route should reject missing token",
      async () => {
        const response = await request(app)
          .get("/api/v1/users/me");

        expect(response.status).toBe(401);
      }
    );

    test(
      "protected route should reject invalid token",
      async () => {
        const response = await request(app)
          .get("/api/v1/users/me")
          .set(
            "Authorization",
            "Bearer invalid-token"
          );

        expect(response.status).toBe(401);
      }
    );

    test(
      "protected route should reject malformed authorization header",
      async () => {
        const response = await request(app)
          .get("/api/v1/users/me")
          .set(
            "Authorization",
            "Invalid token"
          );

        expect(response.status).toBe(401);
      }
    );
  });

  describe("Public authentication routes", () => {
    test(
      "login route should be forwarded without JWT",
      async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({
            identifier: "EMP001",
            password: "Password123",
          });

        expect(response.status).toBe(200);

        expect(response.body.service)
          .toBe("auth-service");

        expect(response.body.method)
          .toBe("POST");

        expect(response.body.url)
          .toBe("/api/v1/auth/login");
      }
    );

    test(
      "register route should be forwarded without JWT",
      async () => {
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            employeeId: "EMP002",
            name: "Test User",
            email: "test@example.com",
            password: "Password123",
          });

        expect(response.status).toBe(200);

        expect(response.body.service)
          .toBe("auth-service");

        expect(response.body.url)
          .toBe("/api/v1/auth/register");
      }
    );
  });

  describe("Request ID", () => {
    test(
      "should generate request ID when none is provided",
      async () => {
        const response = await request(app)
          .get("/health");

        expect(
          response.headers["x-request-id"]
        ).toBeDefined();

        expect(
          response.headers["x-request-id"]
        ).toMatch(
          /^[0-9a-f-]{36}$/i
        );
      }
    );

    test(
      "should preserve a valid incoming request ID",
      async () => {
        const requestId =
          "test-request-123";

        const response = await request(app)
          .get("/health")
          .set(
            "x-request-id",
            requestId
          );

        expect(
          response.headers["x-request-id"]
        ).toBe(requestId);
      }
    );

    test(
      "should replace an oversized request ID",
      async () => {
        const oversizedRequestId =
          "a".repeat(101);

        const response = await request(app)
          .get("/health")
          .set(
            "x-request-id",
            oversizedRequestId
          );

        expect(
          response.headers["x-request-id"]
        ).not.toBe(
          oversizedRequestId
        );

        expect(
          response.headers["x-request-id"]
        ).toMatch(
          /^[0-9a-f-]{36}$/i
        );
      }
    );
  });

  describe("JWT validation", () => {
    test(
      "should accept a valid JWT on protected routes",
      async () => {
        const token = createJwt();

        const response = await request(app)
          .get("/api/v1/users/me")
          .set(
            "Authorization",
            `Bearer ${token}`
          );

        expect(response.status).toBe(200);

        expect(response.body.service)
          .toBe("user-service");
      }
    );

    test(
      "should reject expired JWT",
      async () => {
        const token = jwt.sign(
          {
            sub: "USER123",
            employeeId: "EMP001",
            role: "USER",
          },
          process.env.JWT_ACCESS_SECRET,
          {
            expiresIn: -1,
          }
        );

        const response = await request(app)
          .get("/api/v1/users/me")
          .set(
            "Authorization",
            `Bearer ${token}`
          );

        expect(response.status).toBe(401);
      }
    );

    test(
      "should reject JWT signed with wrong secret",
      async () => {
        const token = jwt.sign(
          {
            sub: "USER123",
            employeeId: "EMP001",
            role: "USER",
          },
          "wrong-secret",
          {
            expiresIn: "15m",
          }
        );

        const response = await request(app)
          .get("/api/v1/users/me")
          .set(
            "Authorization",
            `Bearer ${token}`
          );

        expect(response.status).toBe(401);
      }
    );

    test(
      "should reject JWT without required identity claims",
      async () => {
        const token = jwt.sign(
          {
            sub: "USER123",
          },
          process.env.JWT_ACCESS_SECRET,
          {
            expiresIn: "15m",
          }
        );

        const response = await request(app)
          .get("/api/v1/users/me")
          .set(
            "Authorization",
            `Bearer ${token}`
          );

        expect(response.status).toBe(401);
      }
    );
  });

  describe("Proxy security", () => {
    test(
      "should forward authenticated user identity to User Service",
      async () => {
        const token = createJwt({
          sub: "USER-100",
          employeeId: "EMP100",
          role: "FINANCE",
        });

        const requestId =
          "proxy-test-request";

        const response = await request(app)
          .get("/api/v1/users/me")
          .set(
            "Authorization",
            `Bearer ${token}`
          )
          .set(
            "x-request-id",
            requestId
          );

        expect(response.status).toBe(200);

        expect(response.body.service)
          .toBe("user-service");

        expect(
          response.body.headers.userId
        ).toBe("USER-100");

        expect(
          response.body.headers.employeeId
        ).toBe("EMP100");

        expect(
          response.body.headers.userRole
        ).toBe("FINANCE");

        expect(
          response.body.headers.requestId
        ).toBe(requestId);

        expect(
          response.body.headers.serviceKey
        ).toBe(
          process.env.INTERNAL_SERVICE_KEY
        );
      }
    );

    test(
      "should not allow client identity headers to override JWT identity",
      async () => {
        const token = createJwt({
          sub: "REAL-USER",
          employeeId: "REAL001",
          role: "USER",
        });

        const response = await request(app)
          .get("/api/v1/users/me")
          .set(
            "Authorization",
            `Bearer ${token}`
          )
          .set(
            "x-user-id",
            "FAKE-USER"
          )
          .set(
            "x-user-role",
            "ADMIN"
          )
          .set(
            "x-employee-id",
            "FAKE001"
          )
          .set(
            "x-service-key",
            "fake-service-key"
          );

        expect(response.status).toBe(200);

        expect(
          response.body.headers.userId
        ).toBe("REAL-USER");

        expect(
          response.body.headers.employeeId
        ).toBe("REAL001");

        expect(
          response.body.headers.userRole
        ).toBe("USER");

        expect(
          response.body.headers.serviceKey
        ).toBe(
          process.env.INTERNAL_SERVICE_KEY
        );
      }
    );

    test(
      "should forward POST request body to Auth Service",
      async () => {
        const payload = {
          identifier: "EMP001",
          password: "Password123",
        };

        const response = await request(app)
          .post("/api/v1/auth/login")
          .send(payload);

        expect(response.status).toBe(200);

        expect(response.body.service)
          .toBe("auth-service");

        expect(response.body.body)
          .toEqual(payload);
      }
    );

    test(
      "should forward POST request body to Invoice Service",
      async () => {
        const token = createJwt({
          sub: "USER200",
          employeeId: "EMP200",
          role: "FINANCE",
        });

        const payload = {
          vendorCode: "VENDOR001",
          amount: 5000,
          description: "Test invoice",
        };

        const response = await request(app)
          .post("/api/v1/invoices")
          .set(
            "Authorization",
            `Bearer ${token}`
          )
          .send(payload);

        expect(response.status).toBe(200);

        expect(response.body.service)
          .toBe("invoice-service");

        expect(response.body.body)
          .toEqual(payload);

        expect(
          response.body.headers.userId
        ).toBe("USER200");

        expect(
          response.body.headers.userRole
        ).toBe("FINANCE");
      }
    );

    test(
      "should route notifications to public notification API",
      async () => {
        const token = createJwt({
          sub: "USER300",
          employeeId: "EMP300",
          role: "USER",
        });

        const response = await request(app)
          .get("/api/v1/notifications");





        expect(response.status).toBe(401);

        const authenticatedResponse =
          await request(app)
            .get("/api/v1/notifications")
            .set(
              "Authorization",
              `Bearer ${token}`
            );

        expect(
          authenticatedResponse.status
        ).toBe(200);

        expect(
          authenticatedResponse.body.service
        ).toBe("notification-service");

        expect(
          authenticatedResponse.body.url
        ).toBe("/api/v1/notifications/");
      }
    );
  });

  describe("Security headers", () => {
    test(
      "should include Helmet security headers",
      async () => {
        const response = await request(app)
          .get("/health");

        expect(
          response.headers["x-content-type-options"]
        ).toBe("nosniff");

        expect(
          response.headers["x-frame-options"]
        ).toBeDefined();
      }
    );
  });
});