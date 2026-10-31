import dotenv from "dotenv";
import request from "supertest";
import jwt from "jsonwebtoken";

dotenv.config({
  path: ".env.test",
  override: true,
});



process.env.RATE_LIMIT_MAX = "100";
process.env.AUTH_RATE_LIMIT_MAX = "2";

const createJwt = () => {
  return jwt.sign(
    {
      sub: "RATE-USER",
      employeeId: "EMP-RATE",
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
  const appModule = await import(
    "../src/app.js"
  );

  app = appModule.default;
});

describe("API Gateway - Rate Limiting", () => {
  test(
    "should block authentication requests after the configured limit",
    async () => {
      const firstResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "RATE-USER",
          password: "WrongPassword123",
        });

      const secondResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "RATE-USER",
          password: "WrongPassword123",
        });

      const thirdResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          identifier: "RATE-USER",
          password: "WrongPassword123",
        });

      expect(firstResponse.status)
        .not.toBe(429);

      expect(secondResponse.status)
        .not.toBe(429);

      expect(thirdResponse.status)
        .toBe(429);

      expect(thirdResponse.body)
        .toEqual({
          success: false,
          message:
            "Too many authentication requests. Please try again later.",
        });
    }
  );

  test(
    "should not rate limit protected non-auth routes using the auth limit",
    async () => {
      const token = createJwt();

      const response = await request(app)
        .get("/api/v1/users/me")
        .set(
          "Authorization",
          `Bearer ${token}`
        );

      expect(response.status)
        .not.toBe(429);
    }
  );
});