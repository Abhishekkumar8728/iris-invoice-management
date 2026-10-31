import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

import User from "../src/models/user.model.js";
import RefreshToken from "../src/models/refresh-token.model.js";
import { login } from "../src/services/auth.service.js";

import {
  connectTestDatabase,
  clearTestDatabase,
  disconnectTestDatabase,
} from "./setup.js";

before(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
});

after(async () => {
  await disconnectTestDatabase();
});

const createUser = async (overrides = {}) => {
  const password = await bcrypt.hash(
    "Password123",
    4
  );

  return User.create({
    employeeId: "EMP001",
    name: "Test User",
    email: "test@example.com",
    password,
    role: "USER",
    department: "Finance",
    isActive: true,
    ...overrides,
  });
};

test("login succeeds with email", async () => {
  const user = await createUser();

  const result = await login(
    user.email,
    "Password123",
    "127.0.0.1"
  );

  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);

  assert.equal(
    result.user.employeeId,
    "EMP001"
  );

  assert.equal(
    result.user.email,
    "test@example.com"
  );

  const storedToken =
    await RefreshToken.findOne({
      userId: user._id,
    });

  assert.ok(storedToken);
  assert.ok(storedToken.tokenHash);
  assert.equal(
    storedToken.createdByIp,
    "127.0.0.1"
  );
});

test("login succeeds with employee ID", async () => {
  const user = await createUser();

  const result = await login(
    "emp001",
    "Password123",
    "127.0.0.1"
  );

  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);

  assert.equal(
    result.user.employeeId,
    user.employeeId
  );
});

test("login rejects an unknown user", async () => {
  await assert.rejects(
    () =>
      login(
        "unknown@example.com",
        "Password123",
        "127.0.0.1"
      ),
    {
      message: "Invalid credentials",
    }
  );
});

test("login rejects an invalid password", async () => {
  const user = await createUser();

  await assert.rejects(
    () =>
      login(
        user.email,
        "WrongPassword123",
        "127.0.0.1"
      ),
    {
      message: "Invalid credentials",
    }
  );

  const updatedUser =
    await User.findById(user._id);

  assert.equal(
    updatedUser.failedLoginAttempts,
    1
  );
});

test("login rejects inactive user", async () => {
  const user = await createUser({
    isActive: false,
  });

  await assert.rejects(
    () =>
      login(
        user.email,
        "Password123",
        "127.0.0.1"
      ),
    {
      message: "User account is inactive",
    }
  );
});

test("fifth failed login temporarily locks account", async () => {
  const user = await createUser();

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await assert.rejects(
      () =>
        login(
          user.email,
          "WrongPassword123",
          "127.0.0.1"
        ),
      {
        message: "Invalid credentials",
      }
    );
  }

  const lockedUser =
    await User.findById(user._id);

  assert.equal(
    lockedUser.failedLoginAttempts,
    0
  );

  assert.ok(
    lockedUser.accountLockedUntil
  );

  assert.ok(
    lockedUser.accountLockedUntil > new Date()
  );

  await assert.rejects(
    () =>
      login(
        user.email,
        "Password123",
        "127.0.0.1"
      ),
    {
      message: "Account temporarily locked",
    }
  );
});

test("successful login resets failed attempts and lock state", async () => {
  const user = await createUser({
    failedLoginAttempts: 3,
    accountLockedUntil: null,
  });

  const result = await login(
    user.email,
    "Password123",
    "127.0.0.1"
  );

  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);

  const updatedUser =
    await User.findById(user._id);

  assert.equal(
    updatedUser.failedLoginAttempts,
    0
  );

  assert.equal(
    updatedUser.accountLockedUntil,
    null
  );

  assert.ok(updatedUser.lastLoginAt);
});