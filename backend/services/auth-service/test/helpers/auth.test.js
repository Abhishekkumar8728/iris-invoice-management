import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
  override: true,
});

import {
  describe,
  before,
  after,
  test,
} from "node:test";

import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";





const TEST_DB_NAME = "iris_auth_test";

if (!process.env.MONGO_URI?.includes(TEST_DB_NAME)) {
  throw new Error(
    `Auth integration tests must use ${TEST_DB_NAME}. ` +
      `Current MONGO_URI: ${process.env.MONGO_URI}`
  );
}





const internalClient = (
  await import(
    "../../src/services/internal-client.service.js"
  )
).default;

internalClient.post = async (
  url,
  payload,
  config
) => {
  return {
    data: {
      data: {
        id: "test-user-profile-id",
        employeeId: payload.employeeId,
        name: payload.name,
        email: payload.email,
        mobile: payload.mobile,
        role: payload.role,
        department: payload.department,
        designation: payload.designation,
      },
    },
  };
};





const { default: app } = await import(
  "../../src/app.js"
);





const connectTestDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
};

const clearTestDatabase = async () => {
  const collections =
    mongoose.connection.collections;

  for (const collection of Object.values(
    collections
  )) {
    await collection.deleteMany({});
  }
};

const disconnectTestDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};





describe("Auth API", () => {
  let testUser;

  before(async () => {
    await connectTestDatabase();
    await clearTestDatabase();

    const timestamp = Date.now();

    testUser = {
      employeeId: `TEST${timestamp}`,
      name: "Test User",
      email: `test${timestamp}@example.com`,
      mobile: "9876543210",
      password: "TestPassword123",
      department: "Finance",
    };
  });

  after(async () => {
    await disconnectTestDatabase();
  });





  test("should register a USER", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(testUser);

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.role, "USER");
    assert.equal(
      response.body.data.employeeId,
      testUser.employeeId
    );
    assert.equal(
      response.body.data.email,
      testUser.email
    );
  });





  test("should register an account with each supported role", async () => {
    const roles = ["ADMIN", "FINANCE", "APPROVER", "USER"];

    for (const role of roles) {
      const timestamp = `${Date.now()}${role}`;
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          employeeId: `ROLE${timestamp}`,
          name: `${role} User`,
          email: `${role.toLowerCase()}${timestamp}@example.com`,
          password: "TestPassword123",
          role,
        });

      assert.equal(response.statusCode, 201);
      assert.equal(response.body.success, true);
      assert.equal(response.body.data.role, role);
    }
  });

  test("should reject an unsupported registration role", async () => {
    const timestamp = Date.now();

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        employeeId: `INVALID${timestamp}`,
        name: "Invalid Role User",
        email: `invalid-role${timestamp}@example.com`,
        password: "TestPassword123",
        role: "SUPER_ADMIN",
      });

    assert.equal(response.statusCode, 400);
  });





  test("should reject weak password", async () => {
    const timestamp = Date.now();

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        employeeId: `WEAK${timestamp}`,
        name: "Weak User",
        email: `weak${timestamp}@example.com`,
        password: "123",
      });

    assert.equal(response.statusCode, 400);
  });





  test("should login with employee ID", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        identifier: testUser.employeeId,
        password: testUser.password,
      });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.ok(
      response.body.data.accessToken
    );
    assert.ok(
      response.body.data.refreshToken
    );
  });





  test("should login with email", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        identifier: testUser.email,
        password: testUser.password,
      });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.ok(
      response.body.data.accessToken
    );
    assert.ok(
      response.body.data.refreshToken
    );
  });





  test("should reject invalid password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        identifier: testUser.email,
        password: "WrongPassword123",
      });

    assert.equal(response.statusCode, 401);
  });





  test("should reject request without token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me");

    assert.equal(response.statusCode, 401);
  });
});