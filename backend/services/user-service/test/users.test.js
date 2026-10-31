import {
  describe,
  test,
  expect,
} from "@jest/globals";

import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../src/app.js";

const JWT_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-jwt-secret-for-user-service";

function createToken({
  id = "test-user-id",
  employeeId = "TEST001",
  role = "USER",
} = {}) {
  return jwt.sign(
    {
      sub: id,
      employeeId,
      role,
    },
    JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
}

describe("User Service API", () => {
  test("rejects request without authentication", async () => {
    const response = await request(app)
      .get("/api/v1/users/me");

    expect(response.status).toBe(401);
  });

  test("rejects request with invalid JWT", async () => {
    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });
});