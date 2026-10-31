import dotenv from "dotenv";
import http from "node:http";

import request from "supertest";
import jwt from "jsonwebtoken";

dotenv.config({
  path: ".env.test",
  override: true,
});

const FAILURE_PORT = 4995;

const createJwt = () => {
  return jwt.sign(
    {
      sub: "FAILURE-USER",
      employeeId: "EMPFAIL",
      role: "USER",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

let app;

beforeAll(async () => {





  process.env.USER_SERVICE_URL =
    `http://127.0.0.1:${FAILURE_PORT}`;

  const appModule = await import(
    "../src/app.js"
  );

  app = appModule.default;
});

describe("API Gateway - Service Failure", () => {
  test(
    "should return 502 without leaking internal connection details",
    async () => {
      const token = createJwt();

      const requestId =
        "failure-test-request";

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

      expect(response.status)
        .toBe(502);

      expect(response.body)
        .toEqual({
          success: false,
          message:
            "User Service service unavailable",
          requestId,
        });

      const responseText =
        JSON.stringify(response.body);

      expect(responseText)
        .not.toContain("ECONNREFUSED");

      expect(responseText)
        .not.toContain("127.0.0.1");

      expect(responseText)
        .not.toContain("4995");
    });
});