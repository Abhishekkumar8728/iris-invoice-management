import test, {
  before,
  after,
  beforeEach,
} from "node:test";

import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nock from "nock";
import request from "supertest";

import app from "../src/app.js";

import User from "../src/models/user.model.js";

import {
  connectTestDatabase,
  clearTestDatabase,
  disconnectTestDatabase,
} from "./setup.js";

const USER_SERVICE_URL =
  "http://user-service.test";

before(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();

  nock.disableNetConnect();






  nock.enableNetConnect((host) => {
    return (
      host.startsWith("127.0.0.1:") ||
      host.startsWith("localhost:")
    );
  });
});

after(async () => {
  nock.cleanAll();
  nock.enableNetConnect();

  await disconnectTestDatabase();
});

const createAuthUser = async ({
  employeeId = "ADMIN001",
  email = "admin@example.com",
  role = "ADMIN",
  isActive = true,
} = {}) => {
  const password = await bcrypt.hash(
    "Password123",
    4
  );

  return User.create({
    employeeId,
    name:
      role === "ADMIN"
        ? "Test Administrator"
        : "Test User",
    email,
    password,
    role,
    department: "IT",
    isActive,
  });
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      employeeId: user.employeeId,
      role: user.role,
      jti: `test-${Date.now()}-${Math.random()}`,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

const mockProfileCreation = ({
  employeeId,
  email,
  role,
}) => {
  return nock(USER_SERVICE_URL)
    .post(
      "/api/v1/internal/users",
      (body) => {
        return (
          body.employeeId ===
            employeeId.toUpperCase() &&
          body.email ===
            email.toLowerCase() &&
          body.role === role
        );
      }
    )
    .matchHeader(
      "x-service-key",
      process.env.INTERNAL_SERVICE_KEY
    )
    .reply(201, {
      success: true,
      message: "User profile created",
      data: {
        id: "profile-test-id",
        employeeId:
          employeeId.toUpperCase(),
        email:
          email.toLowerCase(),
      },
    });
};






test("ADMIN can create a USER", async () => {
  const admin = await createAuthUser();

  mockProfileCreation({
    employeeId: "USER001",
    email: "user001@example.com",
    role: "USER",
  });

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "USER001",
      name: "Normal User",
      email: "user001@example.com",
      mobile: "9876543210",
      password: "Password123",
      role: "USER",
      department: "Finance",
      designation: "Executive",
    });

  assert.equal(
    response.status,
    201
  );

  assert.equal(
    response.body.success,
    true
  );

  assert.equal(
    response.body.data.employeeId,
    "USER001"
  );

  assert.equal(
    response.body.data.role,
    "USER"
  );

  assert.equal(
    response.body.data.isActive,
    true
  );

  const user = await User.findOne({
    employeeId: "USER001",
  }).select("+password");

  assert.ok(user);

  assert.equal(
    user.role,
    "USER"
  );

  assert.equal(
    await bcrypt.compare(
      "Password123",
      user.password
    ),
    true
  );

  assert.ok(nock.isDone());
});


test("ADMIN can create a FINANCE user", async () => {
  const admin = await createAuthUser();

  mockProfileCreation({
    employeeId: "FIN001",
    email: "finance@example.com",
    role: "FINANCE",
  });

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "FIN001",
      name: "Finance User",
      email: "finance@example.com",
      password: "Password123",
      role: "FINANCE",
      department: "Finance",
    });

  assert.equal(
    response.status,
    201
  );

  assert.equal(
    response.body.data.role,
    "FINANCE"
  );

  const user = await User.findOne({
    employeeId: "FIN001",
  });

  assert.ok(user);
  assert.equal(
    user.role,
    "FINANCE"
  );

  assert.ok(nock.isDone());
});


test("ADMIN can create an APPROVER user", async () => {
  const admin = await createAuthUser();

  mockProfileCreation({
    employeeId: "APP001",
    email: "approver@example.com",
    role: "APPROVER",
  });

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "APP001",
      name: "Approver User",
      email: "approver@example.com",
      password: "Password123",
      role: "APPROVER",
      department: "Finance",
    });

  assert.equal(
    response.status,
    201
  );

  assert.equal(
    response.body.data.role,
    "APPROVER"
  );

  assert.ok(nock.isDone());
});


test("ADMIN can create another ADMIN", async () => {
  const admin = await createAuthUser();

  mockProfileCreation({
    employeeId: "ADMIN002",
    email: "admin002@example.com",
    role: "ADMIN",
  });

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "ADMIN002",
      name: "Second Administrator",
      email: "admin002@example.com",
      password: "Password123",
      role: "ADMIN",
    });

  assert.equal(
    response.status,
    201
  );

  assert.equal(
    response.body.data.role,
    "ADMIN"
  );

  assert.ok(nock.isDone());
});






test("USER cannot create another user", async () => {
  const user = await createAuthUser({
    employeeId: "USERAUTH001",
    email: "userauth@example.com",
    role: "USER",
  });

  const token =
    generateAccessToken(user);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "USER002",
      name: "Another User",
      email: "another@example.com",
      password: "Password123",
      role: "USER",
    });

  assert.equal(
    response.status,
    403
  );

  assert.equal(
    response.body.message,
    "Access denied"
  );

  const createdUser =
    await User.findOne({
      employeeId: "USER002",
    });

  assert.equal(
    createdUser,
    null
  );
});


test("request without authentication is rejected", async () => {
  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .send({
      employeeId: "USER003",
      name: "No Auth User",
      email: "noauth@example.com",
      password: "Password123",
      role: "USER",
    });

  assert.equal(
    response.status,
    401
  );

  assert.equal(
    response.body.message,
    "Authorization header is required"
  );
});





test(
  "only ADMIN can access the admin authorization endpoint",
  async () => {
    const roles = [
      "ADMIN",
      "FINANCE",
      "APPROVER",
      "USER",
    ];

    for (const role of roles) {
      const user = await createAuthUser({
        employeeId: `${role}RBAC001`,
        email: `${role.toLowerCase()}rbac@example.com`,
        role,
      });

      const token =
        generateAccessToken(user);

      const response = await request(app)
        .get("/api/v1/auth/admin-test")
        .set(
          "Authorization",
          `Bearer ${token}`
        );

      if (role === "ADMIN") {
        assert.equal(
          response.status,
          200
        );

        assert.equal(
          response.body.success,
          true
        );

        assert.equal(
          response.body.message,
          "Admin authorization successful"
        );
      } else {
        assert.equal(
          response.status,
          403
        );

        assert.equal(
          response.body.success,
          false
        );

        assert.equal(
          response.body.message,
          "Access denied"
        );
      }
    }
  }
);

test("invalid access token is rejected", async () => {
  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      "Bearer invalid-token"
    )
    .send({
      employeeId: "USER004",
      name: "Invalid Token User",
      email: "invalidtoken@example.com",
      password: "Password123",
      role: "USER",
    });

  assert.equal(
    response.status,
    401
  );

  assert.equal(
    response.body.message,
    "Invalid or expired access token"
  );
});






test("ADMIN cannot create duplicate email", async () => {
  const admin = await createAuthUser();

  await User.create({
    employeeId: "EXIST001",
    name: "Existing User",
    email: "existing@example.com",
    password: await bcrypt.hash(
      "Password123",
      4
    ),
    role: "USER",
  });

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "NEW001",
      name: "Duplicate Email",
      email: "existing@example.com",
      password: "Password123",
      role: "USER",
    });

  assert.equal(
    response.status,
    400
  );

  assert.match(
    response.body.message,
    /already exists/i
  );
});


test("ADMIN cannot create duplicate employee ID", async () => {
  const admin = await createAuthUser();

  await User.create({
    employeeId: "EXIST002",
    name: "Existing User",
    email: "existing002@example.com",
    password: await bcrypt.hash(
      "Password123",
      4
    ),
    role: "USER",
  });

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "EXIST002",
      name: "Duplicate Employee",
      email: "new@example.com",
      password: "Password123",
      role: "USER",
    });

  assert.equal(
    response.status,
    400
  );

  assert.match(
    response.body.message,
    /already exists/i
  );
});






test("ADMIN can create an inactive user", async () => {
  const admin = await createAuthUser();

  mockProfileCreation({
    employeeId: "INACTIVE001",
    email: "inactive@example.com",
    role: "USER",
  });

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "INACTIVE001",
      name: "Inactive User",
      email: "inactive@example.com",
      password: "Password123",
      role: "USER",
      isActive: false,
    });

  assert.equal(
    response.status,
    201
  );

  assert.equal(
    response.body.data.isActive,
    false
  );

  const user = await User.findOne({
    employeeId: "INACTIVE001",
  });

  assert.ok(user);

  assert.equal(
    user.isActive,
    false
  );

  assert.ok(nock.isDone());
});






test("ADMIN user creation rejects invalid role", async () => {
  const admin = await createAuthUser();

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "INVALIDROLE001",
      name: "Invalid Role User",
      email: "invalidrole@example.com",
      password: "Password123",
      role: "SUPER_ADMIN",
    });

  assert.equal(
    response.status,
    400
  );

  const user = await User.findOne({
    employeeId: "INVALIDROLE001",
  });

  assert.equal(
    user,
    null
  );
});


test("ADMIN user creation rejects weak password", async () => {
  const admin = await createAuthUser();

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "WEAKPASS001",
      name: "Weak Password User",
      email: "weakpassword@example.com",
      password: "123",
      role: "USER",
    });

  assert.equal(
    response.status,
    400
  );

  const user = await User.findOne({
    employeeId: "WEAKPASS001",
  });

  assert.equal(
    user,
    null
  );
});






test("ADMIN user creation rolls back Auth user when profile creation fails", async () => {
  const admin = await createAuthUser();

  nock(USER_SERVICE_URL)
    .post("/api/v1/internal/users")
    .matchHeader(
      "x-service-key",
      process.env.INTERNAL_SERVICE_KEY
    )
    .reply(500, {
      success: false,
      message: "User Service unavailable",
    });

  const token =
    generateAccessToken(admin);

  const response = await request(app)
    .post("/api/v1/auth/admin/users")
    .set(
      "Authorization",
      `Bearer ${token}`
    )
    .send({
      employeeId: "ROLLBACK001",
      name: "Rollback User",
      email: "rollback@example.com",
      password: "Password123",
      role: "USER",
    });

  assert.equal(
    response.status,
    500
  );

  assert.equal(
    response.body.success,
    false
  );

  const user = await User.findOne({
    employeeId: "ROLLBACK001",
  });

  assert.equal(
    user,
    null
  );
});