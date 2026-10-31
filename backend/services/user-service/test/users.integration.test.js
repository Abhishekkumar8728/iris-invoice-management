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

const INTERNAL_SERVICE_KEY =
  process.env.INTERNAL_SERVICE_KEY ||
  "test-internal-service-key";

const createToken = ({
  id,
  employeeId,
  role,
}) => {
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
};

describe("User Service Integration", () => {
  test("health endpoint returns UP", async () => {
    const response =
      await request(app)
        .get("/health");

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(
      true,
    );

    expect(response.body.service).toBe(
      "user-service",
    );

    expect(response.body.status).toBe(
      "UP",
    );
  });

  test("internal API creates a user with valid service key", async () => {
    const response =
      await request(app)
        .post("/api/v1/internal/users")
        .set(
          "x-service-key",
          INTERNAL_SERVICE_KEY,
        )
        .send({
          employeeId: "TEST001",
          name: "Integration Test User",
          email: "test001@example.com",
          mobile: "9876543210",
          role: "USER",
          department: "Testing",
          designation: "Test Engineer",
          isActive: true,
        });

    expect(
      [200, 201],
    ).toContain(response.status);

    expect(
      response.body.success,
    ).toBe(true);
  });

  test("internal API creates an ADMIN user", async () => {
    const response =
      await request(app)
        .post("/api/v1/internal/users")
        .set(
          "x-service-key",
          INTERNAL_SERVICE_KEY,
        )
        .send({
          employeeId: "ADMIN_TEST",
          name: "Integration Admin",
          email: "admin-test@example.com",
          role: "ADMIN",
          department: "IT",
          designation: "Administrator",
          isActive: true,
        });

    expect(
      [200, 201],
    ).toContain(response.status);

    expect(
      response.body.success,
    ).toBe(true);
  });

  test("USER can access their own profile", async () => {
    const createResponse =
      await request(app)
        .post("/api/v1/internal/users")
        .set(
          "x-service-key",
          INTERNAL_SERVICE_KEY,
        )
        .send({
          employeeId: "ME_TEST_001",
          name: "My Profile Test",
          email: "me-test@example.com",
          role: "USER",
          department: "Finance",
        });

    expect(
      [200, 201],
    ).toContain(
      createResponse.status,
    );

    const user =
      createResponse.body.data;

    const token = createToken({
      id: user.id || user._id,
      employeeId: "ME_TEST_001",
      role: "USER",
    });

    const response =
      await request(app)
        .get("/api/v1/users/me")
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

    expect(response.status).toBe(200);

    expect(
      response.body.success,
    ).toBe(true);

    expect(
      response.body.data.employeeId,
    ).toBe("ME_TEST_001");
  });

  test("ADMIN can list users", async () => {
    await request(app)
      .post("/api/v1/internal/users")
      .set(
        "x-service-key",
        INTERNAL_SERVICE_KEY,
      )
      .send({
        employeeId: "LIST_TEST_001",
        name: "List Test User",
        email: "list-test@example.com",
        role: "USER",
      });

    const token = createToken({
      id: "admin-test-id",
      employeeId: "ADMIN_TEST",
      role: "ADMIN",
    });

    const response =
      await request(app)
        .get("/api/v1/users")
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

    expect(response.status).toBe(200);

    expect(
      response.body.success,
    ).toBe(true);

    expect(
      response.body.data,
    ).toBeDefined();
  });

  test("ADMIN can filter users by role", async () => {
    await request(app)
      .post("/api/v1/internal/users")
      .set(
        "x-service-key",
        INTERNAL_SERVICE_KEY,
      )
      .send({
        employeeId: "FIN_TEST_001",
        name: "Finance Test User",
        email: "finance-test@example.com",
        role: "FINANCE",
      });

    const token = createToken({
      id: "admin-test-id",
      employeeId: "ADMIN_TEST",
      role: "ADMIN",
    });

    const response =
      await request(app)
        .get("/api/v1/users")
        .query({
          role: "FINANCE",
        })
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

    expect(response.status).toBe(200);

    expect(
      response.body.success,
    ).toBe(true);

    expect(
      response.body.data.users,
    ).toBeDefined();

    expect(
      response.body.data.users.every(
        (user) =>
          user.role === "FINANCE",
      ),
    ).toBe(true);
  });

  test("ADMIN can filter active users", async () => {
    await request(app)
      .post("/api/v1/internal/users")
      .set(
        "x-service-key",
        INTERNAL_SERVICE_KEY,
      )
      .send({
        employeeId: "ACTIVE_TEST",
        name: "Active User",
        email: "active-test@example.com",
        role: "USER",
        isActive: true,
      });

    const token = createToken({
      id: "admin-test-id",
      employeeId: "ADMIN_TEST",
      role: "ADMIN",
    });

    const response =
      await request(app)
        .get("/api/v1/users")
        .query({
          status: "active",
        })
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

    expect(response.status).toBe(200);

    expect(
      response.body.data.users.every(
        (user) =>
          user.isActive === true,
      ),
    ).toBe(true);
  });

  test("user can be retrieved by employee ID through internal API", async () => {
    await request(app)
      .post("/api/v1/internal/users")
      .set(
        "x-service-key",
        INTERNAL_SERVICE_KEY,
      )
      .send({
        employeeId: "LOOKUP_TEST",
        name: "Lookup User",
        email: "lookup-test@example.com",
        role: "USER",
      });

    const response =
      await request(app)
        .get(
          "/api/v1/internal/users/employee/lookup_test",
        )
        .set(
          "x-service-key",
          INTERNAL_SERVICE_KEY,
        );

    expect(response.status).toBe(200);

    expect(
      response.body.success,
    ).toBe(true);

    expect(
      response.body.data.employeeId,
    ).toBe("LOOKUP_TEST");
  });

 test("existing employee ID is synchronized successfully", async () => {
  const firstResponse =
    await request(app)
      .post("/api/v1/internal/users")
      .set(
        "x-service-key",
        INTERNAL_SERVICE_KEY,
      )
      .send({
        employeeId: "DUPLICATE001",
        name: "First User",
        email: "first@example.com",
        role: "USER",
      });

  expect(firstResponse.status).toBe(201);

  const secondResponse =
    await request(app)
      .post("/api/v1/internal/users")
      .set(
        "x-service-key",
        INTERNAL_SERVICE_KEY,
      )
      .send({
        employeeId: "DUPLICATE001",
        name: "Updated User",
        email: "updated@example.com",
        role: "FINANCE",
        department: "Finance",
      });

  expect(secondResponse.status).toBe(200);

  expect(
    secondResponse.body.success,
  ).toBe(true);

  expect(
    secondResponse.body.message,
  ).toBe("User profile synchronized");

  expect(
    secondResponse.body.data.employeeId,
  ).toBe("DUPLICATE001");

  expect(
    secondResponse.body.data.name,
  ).toBe("Updated User");

  expect(
    secondResponse.body.data.email,
  ).toBe("updated@example.com");

  expect(
    secondResponse.body.data.role,
  ).toBe("FINANCE");

  expect(
    secondResponse.body.data.department,
  ).toBe("Finance");
});

  test("duplicate email is rejected", async () => {
    await request(app)
      .post("/api/v1/internal/users")
      .set(
        "x-service-key",
        INTERNAL_SERVICE_KEY,
      )
      .send({
        employeeId: "EMAIL001",
        name: "First Email User",
        email: "duplicate@example.com",
        role: "USER",
      });

    const response =
      await request(app)
        .post("/api/v1/internal/users")
        .set(
          "x-service-key",
          INTERNAL_SERVICE_KEY,
        )
        .send({
          employeeId: "EMAIL002",
          name: "Second Email User",
          email: "DUPLICATE@EXAMPLE.COM",
          role: "USER",
        });

    expect(
      [400, 409],
    ).toContain(response.status);
  });
});