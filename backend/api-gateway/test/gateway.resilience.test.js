import dotenv from "dotenv";
import http from "node:http";

import request from "supertest";
import jwt from "jsonwebtoken";

dotenv.config({
  path: ".env.test",
  override: true,
});

const TEST_PORT = 4996;

const createJwt = () => {
  return jwt.sign(
    {
      sub: "RESILIENCE-USER",
      employeeId: "EMP-RES",
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

  const appModule = await import(
    "../src/app.js"
  );

  app = appModule.default;
});

describe("API Gateway - Resilience", () => {
  test(
    "should safely handle downstream 500 response",
    async () => {
      const server = await createServer(
        (req, res) => {
          res.writeHead(500, {
            "content-type":
              "application/json",
          });

          res.end(
            JSON.stringify({
              success: false,
              message:
                "Internal database failure",
              stack:
                "SECRET_INTERNAL_STACK",
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






        expect(response.status)
  .toBe(500);

expect(response.body)
  .toEqual({
    success: false,
    message:
      "Downstream service encountered an internal error.",
  });

const responseText =
  JSON.stringify(response.body);

expect(responseText)
  .not.toContain(
    "SECRET_INTERNAL_STACK"
  );

expect(responseText)
  .not.toContain(
    "Internal database failure"
  );

expect(responseText)
  .not.toContain(
    "stack"
  );
      } finally {
        await new Promise((resolve) =>
          server.close(resolve)
        );
      }
    }
  );
});