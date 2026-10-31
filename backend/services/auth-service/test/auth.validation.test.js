import test from "node:test";
import assert from "node:assert/strict";
import {
  loginSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from "../src/validators/auth.validator.js";

test("login accepts email alias", () => {
  const result = loginSchema.validate({
    email: "admin2@example.com",
    password: "valid-password"
  });
  assert.equal(result.error, undefined);
  assert.equal(result.value.email, "admin2@example.com");
});

test("login requires identifier or email", () => {
  const result = loginSchema.validate({
    password: "valid-password"
  });
  assert.ok(result.error);
});

test("password reset requires a six-digit OTP and strong password", () => {
  const result = resetPasswordSchema.validate({
    email: "admin2@example.com",
    otp: "123456",
    newPassword: "new-valid-password"
  });
  assert.equal(result.error, undefined);
});

test("refresh token requests require a token", () => {
  const result = refreshTokenSchema.validate({});
  assert.ok(result.error);
});
