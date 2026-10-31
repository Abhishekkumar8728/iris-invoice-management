import test, {
  before,
  after,
  beforeEach,
} from "node:test";

import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import nock from "nock";

import User from "../src/models/user.model.js";
import RefreshToken from "../src/models/refresh-token.model.js";

import {
  login,
  forgotPassword,
  resetPassword,
} from "../src/services/auth.service.js";

import {
  hashToken,
} from "../src/utils/token.js";

import {
  connectTestDatabase,
  clearTestDatabase,
  disconnectTestDatabase,
} from "./setup.js";

const NOTIFICATION_SERVICE_URL =
  "http://notification-service.test";

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

const createUser = async (overrides = {}) => {
  const password = await bcrypt.hash(
    "Password123",
    4
  );

  return User.create({
    employeeId: "EMP200",
    name: "Password Test User",
    email: "password@example.com",
    password,
    role: "USER",
    department: "Finance",
    isActive: true,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    ...overrides,
  });
};

const mockOtpSend = (email = "password@example.com") => {
  return nock(NOTIFICATION_SERVICE_URL)
    .post(
      "/api/v1/internal/notifications/otp/send",
      (body) => {
        return (
          body.identifier === email &&
          body.purpose === "PASSWORD_RESET"
        );
      }
    )
    .matchHeader(
      "x-service-key",
      process.env.INTERNAL_SERVICE_KEY
    )
    .reply(200, {
      success: true,
      message: "OTP sent",
      data: {
        sent: true,
      },
    });
};

const mockOtpVerify = (
  email = "password@example.com",
  otp = "123456"
) => {
  return nock(NOTIFICATION_SERVICE_URL)
    .post(
      "/api/v1/internal/notifications/otp/verify",
      (body) => {
        return (
          body.identifier === email &&
          body.purpose === "PASSWORD_RESET" &&
          body.otp === otp
        );
      }
    )
    .matchHeader(
      "x-service-key",
      process.env.INTERNAL_SERVICE_KEY
    )
    .reply(200, {
      success: true,
      message: "OTP verified",
      data: {
        verified: true,
      },
    });
};






test("forgot password sends OTP for an active user", async () => {
  const user = await createUser();

  mockOtpSend(user.email);

  const result = await forgotPassword({
    email: user.email,
    requestId: "password-reset-001",
  });

  assert.equal(
    result.message,
    "If the account exists, an OTP has been sent."
  );

  assert.ok(nock.isDone());
});


test("forgot password does not reveal an unknown email", async () => {
  const result = await forgotPassword({
    email: "unknown@example.com",
    requestId: "password-reset-002",
  });

  assert.equal(
    result.message,
    "If the account exists, an OTP has been sent."
  );

  assert.ok(nock.pendingMocks().length === 0);
});


test("forgot password does not send OTP to inactive user", async () => {
  const user = await createUser({
    isActive: false,
  });

  const result = await forgotPassword({
    email: user.email,
    requestId: "password-reset-003",
  });

  assert.equal(
    result.message,
    "If the account exists, an OTP has been sent."
  );

  assert.ok(
    nock.pendingMocks().length === 0
  );
});


test("forgot password normalizes email", async () => {
  const user = await createUser();

  mockOtpSend(user.email);

  const result = await forgotPassword({
    email: "PASSWORD@EXAMPLE.COM",
    requestId: "password-reset-004",
  });

  assert.equal(
    result.message,
    "If the account exists, an OTP has been sent."
  );

  assert.ok(nock.isDone());
});






test("reset password succeeds with valid OTP", async () => {
  const user = await createUser();

  mockOtpVerify(
    user.email,
    "123456"
  );

  const result = await resetPassword({
    email: user.email,
    otp: "123456",
    newPassword: "NewPassword123",
    requestId: "password-reset-005",
  });

  assert.equal(
    result.message,
    "Password reset successfully"
  );

  const updatedUser =
    await User.findById(user._id).select(
      "+password"
    );

  assert.ok(updatedUser);

  assert.equal(
    await bcrypt.compare(
      "NewPassword123",
      updatedUser.password
    ),
    true
  );

  assert.equal(
    await bcrypt.compare(
      "Password123",
      updatedUser.password
    ),
    false
  );

  assert.equal(
    updatedUser.failedLoginAttempts,
    0
  );

  assert.equal(
    updatedUser.accountLockedUntil,
    null
  );

  assert.ok(nock.isDone());
});


test("reset password rejects unknown user", async () => {
  await assert.rejects(
    () =>
      resetPassword({
        email: "unknown@example.com",
        otp: "123456",
        newPassword: "NewPassword123",
        requestId: "password-reset-006",
      }),
    {
      message:
        "Invalid password reset request",
    }
  );
});


test("reset password calls OTP verification", async () => {
  const user = await createUser();

  mockOtpVerify(
    user.email,
    "654321"
  );

  await resetPassword({
    email: user.email,
    otp: "654321",
    newPassword: "NewPassword123",
    requestId: "password-reset-007",
  });

  assert.ok(nock.isDone());
});


test("reset password revokes all active refresh tokens", async () => {
  const user = await createUser();





  await RefreshToken.create([
    {
      userId: user._id,
      tokenHash: hashToken("refresh-token-1"),
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
      createdByIp: "127.0.0.1",
    },
    {
      userId: user._id,
      tokenHash: hashToken("refresh-token-2"),
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
      createdByIp: "127.0.0.1",
    },
  ]);

  mockOtpVerify(
    user.email,
    "123456"
  );

  await resetPassword({
    email: user.email,
    otp: "123456",
    newPassword: "NewPassword123",
    requestId: "password-reset-008",
  });

  const tokens =
    await RefreshToken.find({
      userId: user._id,
    });

  assert.equal(tokens.length, 2);

  for (const token of tokens) {
    assert.ok(
      token.revokedAt,
      "Expected refresh token to be revoked"
    );
  }
});


test("reset password clears account lock state", async () => {
  const user = await createUser({
    failedLoginAttempts: 4,
    accountLockedUntil: new Date(
      Date.now() + 10 * 60 * 1000
    ),
  });

  mockOtpVerify(
    user.email,
    "123456"
  );

  await resetPassword({
    email: user.email,
    otp: "123456",
    newPassword: "NewPassword123",
    requestId: "password-reset-009",
  });

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
});


test("reset password allows login with the new password", async () => {
  const user = await createUser();

  mockOtpVerify(
    user.email,
    "123456"
  );

  await resetPassword({
    email: user.email,
    otp: "123456",
    newPassword: "NewPassword123",
    requestId: "password-reset-010",
  });

  const result = await login(
    user.email,
    "NewPassword123",
    "127.0.0.1"
  );

  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
});


test("reset password no longer accepts the old password", async () => {
  const user = await createUser();

  mockOtpVerify(
    user.email,
    "123456"
  );

  await resetPassword({
    email: user.email,
    otp: "123456",
    newPassword: "NewPassword123",
    requestId: "password-reset-011",
  });

  await assert.rejects(
    () =>
      login(
        user.email,
        "Password123",
        "127.0.0.1"
      ),
    {
      message: "Invalid credentials",
    }
  );
});