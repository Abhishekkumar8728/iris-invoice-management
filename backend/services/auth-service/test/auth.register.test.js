import test, {
  before,
  after,
  beforeEach,
} from "node:test";

import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import nock from "nock";

import User from "../src/models/user.model.js";

import {
  register,
} from "../src/services/auth.service.js";

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
});

after(async () => {
  nock.cleanAll();
  nock.enableNetConnect();

  await disconnectTestDatabase();
});

const validPayload = () => ({
  employeeId: "EMP100",
  name: "Registration Test User",
  email: "registration@example.com",
  mobile: "9876543210",
  password: "Password123",
  department: "Finance",
});

const mockUserProfileCreation = (
  payload = validPayload()
) => {
  return nock(USER_SERVICE_URL)
    .post(
      "/api/v1/internal/users",
      (body) => {
        return (
          body.employeeId ===
            payload.employeeId.toUpperCase() &&
          body.email ===
            payload.email.toLowerCase() &&
          body.role === "USER"
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
        id: "user-profile-test-id",
        employeeId:
          payload.employeeId.toUpperCase(),
        email:
          payload.email.toLowerCase(),
      },
    });
};


test("register creates a USER account successfully", async () => {
  mockUserProfileCreation();

  const payload = validPayload();

  const result = await register(
    payload,
    "request-register-001"
  );

  assert.ok(result.id);

  assert.equal(
    result.employeeId,
    "EMP100"
  );

  assert.equal(
    result.name,
    "Registration Test User"
  );

  assert.equal(
    result.email,
    "registration@example.com"
  );

  assert.equal(
    result.role,
    "USER"
  );

  const user = await User.findOne({
    employeeId: "EMP100",
  }).select("+password");

  assert.ok(user);

  assert.equal(
    user.role,
    "USER"
  );

  assert.notEqual(
    user.password,
    "Password123"
  );

  assert.equal(
    await bcrypt.compare(
      "Password123",
      user.password
    ),
    true
  );

  assert.ok(
    nock.isDone(),
    "User Service profile request was not made"
  );
});


test("register normalizes employee ID and email", async () => {
  const payload = {
    ...validPayload(),
    employeeId: "emp101",
    email: "REGISTER@EXAMPLE.COM",
  };

  mockUserProfileCreation(payload);

  const result = await register(
    payload,
    "request-register-002"
  );

  assert.equal(
    result.employeeId,
    "EMP101"
  );

  assert.equal(
    result.email,
    "register@example.com"
  );

  const user = await User.findOne({
    employeeId: "EMP101",
  });

  assert.ok(user);

  assert.equal(
    user.email,
    "register@example.com"
  );
});


test("register always creates USER role", async () => {
  const payload = validPayload();

  mockUserProfileCreation(payload);






  payload.role = "ADMIN";

  const result = await register(
    payload,
    "request-register-003"
  );

  assert.equal(
    result.role,
    "USER"
  );

  const user = await User.findOne({
    employeeId: "EMP100",
  });

  assert.ok(user);

  assert.equal(
    user.role,
    "USER"
  );
});


test("register rejects duplicate email", async () => {
  const payload = validPayload();

  await User.create({
    employeeId: "EXISTING001",
    name: "Existing User",
    email: payload.email,
    password: await bcrypt.hash(
      "Password123",
      4
    ),
    role: "USER",
  });

  await assert.rejects(
    () =>
      register(
        payload,
        "request-register-004"
      ),
    {
      message:
        "User with email or employee ID already exists",
    }
  );
});


test("register rejects duplicate employee ID", async () => {
  const payload = validPayload();

  await User.create({
    employeeId: payload.employeeId,
    name: "Existing User",
    email: "existing@example.com",
    password: await bcrypt.hash(
      "Password123",
      4
    ),
    role: "USER",
  });

  await assert.rejects(
    () =>
      register(
        payload,
        "request-register-005"
      ),
    {
      message:
        "User with email or employee ID already exists",
    }
  );
});


test("register rolls back Auth user when User Service profile creation fails", async () => {
  const payload = validPayload();

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

  await assert.rejects(
    () =>
      register(
        payload,
        "request-register-006"
      ),
    {
      message:
        "Unable to create user profile",
    }
  );

  const user = await User.findOne({
    employeeId: payload.employeeId,
  });

  assert.equal(
    user,
    null
  );

  assert.ok(
    nock.isDone(),
    "Expected User Service failure request was not made"
  );
});


test("register passes request ID to User Service", async () => {
  const payload = validPayload();

  nock(USER_SERVICE_URL)
    .post(
      "/api/v1/internal/users",
      (body) => {
        return (
          body.employeeId === "EMP100" &&
          body.role === "USER"
        );
      }
    )
    .matchHeader(
      "x-service-key",
      process.env.INTERNAL_SERVICE_KEY
    )
    .matchHeader(
      "x-request-id",
      "request-register-007"
    )
    .reply(201, {
      success: true,
      message: "User profile created",
      data: {
        id: "profile-007",
      },
    });

  const result = await register(
    payload,
    "request-register-007"
  );

  assert.equal(
    result.role,
    "USER"
  );

  assert.ok(nock.isDone());
});