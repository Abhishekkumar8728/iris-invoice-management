import {
  describe,
  test,
  expect,
} from "@jest/globals";

import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../src/app.js";

const JWT_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "test-jwt-secret-for-user-service";

const INTERNAL_KEY =
  process.env.INTERNAL_SERVICE_KEY ||
  "test-internal-service-key";

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

describe("User Service Security", () => {
  describe("Role-Based Access Control", () => {
    test("USER cannot list all users", async () => {
      const token = createToken({
        id: "user-001",
        employeeId: "EMP001",
        role: "USER",
      });

      const response = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test("FINANCE cannot list all users", async () => {
      const token = createToken({
        id: "finance-001",
        employeeId: "FIN001",
        role: "FINANCE",
      });

      const response = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test("APPROVER cannot list all users", async () => {
      const token = createToken({
        id: "approver-001",
        employeeId: "APP001",
        role: "APPROVER",
      });

      const response = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test("USER cannot access another user's profile", async () => {
      const token = createToken({
        id: "user-001",
        employeeId: "EMP001",
        role: "USER",
      });

      const response = await request(app)
        .get("/api/v1/users/another-user-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test("FINANCE cannot access another user's profile", async () => {
      const token = createToken({
        id: "finance-001",
        employeeId: "FIN001",
        role: "FINANCE",
      });

      const response = await request(app)
        .get("/api/v1/users/another-user-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test("APPROVER cannot access another user's profile", async () => {
      const token = createToken({
        id: "approver-001",
        employeeId: "APP001",
        role: "APPROVER",
      });

      const response = await request(app)
        .get("/api/v1/users/another-user-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test("ADMIN can access the user listing endpoint", async () => {
      const token = createToken({
        id: "admin-001",
        employeeId: "ADMIN001",
        role: "ADMIN",
      });

      const response = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).not.toBe(403);
    });

    test("ADMIN can access another user's profile endpoint", async () => {
      const token = createToken({
        id: "admin-001",
        employeeId: "ADMIN001",
        role: "ADMIN",
      });

      const response = await request(app)
        .get("/api/v1/users/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).not.toBe(403);
    });
  });

  describe("Own Profile Access", () => {
    test.each([
      ["ADMIN", "ADMIN001"],
      ["FINANCE", "FIN001"],
      ["APPROVER", "APP001"],
      ["USER", "USER001"],
    ])(
      "%s can access own profile endpoint",
      async (role, employeeId) => {
        const token = createToken({
          id: `${role.toLowerCase()}-001`,
          employeeId,
          role,
        });

        const response = await request(app)
          .get("/api/v1/users/me")
          .set("Authorization", `Bearer ${token}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      },
    );
  });

  describe("Internal Endpoint Security", () => {
    test("internal endpoint rejects missing service key", async () => {
      const response = await request(app)
        .post("/api/v1/internal/users")
        .send({
          employeeId: "SEC_TEST_001",
          name: "Security Test User",
          email: "security-test@example.com",
        });

      expect([401, 403]).toContain(response.status);
    });

    test("internal endpoint rejects invalid service key", async () => {
      const response = await request(app)
        .post("/api/v1/internal/users")
        .set("x-service-key", "wrong-service-key")
        .send({
          employeeId: "SEC_TEST_002",
          name: "Security Test User",
          email: "security-test-2@example.com",
        });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe("JWT Security", () => {
    test("invalid JWT is rejected", async () => {
      const response = await request(app)
        .get("/api/v1/users/me")
        .set(
          "Authorization",
          "Bearer totally-invalid-token",
        );

      expect(response.status).toBe(401);
    });

    test("expired JWT is rejected", async () => {
      const token = jwt.sign(
        {
          sub: "expired-user",
          employeeId: "EXP001",
          role: "USER",
        },
        JWT_SECRET,
        {
          expiresIn: -1,
        },
      );

      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
    });
  });
});