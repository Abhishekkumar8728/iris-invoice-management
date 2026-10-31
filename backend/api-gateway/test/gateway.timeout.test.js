import dotenv from "dotenv";
import http from "node:http";

import request from "supertest";
import jwt from "jsonwebtoken";

dotenv.config({
  path: ".env.test",
  override: true,
});

const TEST_PORT = 4997;

const createJwt = () => {
  return jwt.sign(
    {
      sub: "TIMEOUT-USER",
      employeeId: "EMP-TIMEOUT",
      role: "USER",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

const createServer = (handler) => {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);

    server.once("error", reject);

    server.listen(
      TEST_PORT,
      "127.0.0.1",
      () => {
        resolve(server);
      }
    );
  });
};

let app;

beforeAll(async () => {
  process.env.USER_SERVICE_URL =
    `http://127.0.0.1:${TEST_PORT}`;

  process.env.PROXY_TIMEOUT_MS = "100";

  const appModule = await import(
    "../src/app.js"
  );

  app = appModule.default;
});

describe("API Gateway - Timeout", () => {
  test(
    "should return 504 when downstream service times out",
    async () => {
      const server = await createServer(
        async (req, res) => {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000)
          );

          res.writeHead(200, {
            "content-type":
              "application/json",
          });

          res.end(
            JSON.stringify({
              success: true,
              message: "Too late",
            })
          );
        }
      );

      try {
        const token = createJwt();

        const response = await request(app)
          .get("/api/v1/users/me")
          .set(
            "Authorization",
            `Bearer ${token}`
          );

        expect(response.status).toBe(504);

        expect(response.body.success)
          .toBe(false);

        expect(response.body.message)
          .toBe(
            "User Service service timeout"
          );

        expect(response.body.requestId)
          .toBeDefined();

        const responseText =
          JSON.stringify(response.body);

        expect(responseText)
          .not.toContain("127.0.0.1");

        expect(responseText)
          .not.toContain("4997");
      } finally {
        await new Promise((resolve) =>
          server.close(resolve)
        );
      }
    }
  );
});