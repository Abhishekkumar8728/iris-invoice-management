import test, {
  before,
  after,
  beforeEach,
} from "node:test";

import assert from "node:assert/strict";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../src/models/user.model.js";
import RefreshToken from "../src/models/refresh-token.model.js";

import {
  login,
  refreshAccessToken,
} from "../src/services/auth.service.js";

import {
  hashToken,
} from "../src/utils/token.js";

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

const createUser = async () => {
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
  });
};

const createLoggedInUser = async () => {
  const user = await createUser();

  const result = await login(
    user.email,
    "Password123",
    "127.0.0.1"
  );

  return {
    user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
};


test("refresh succeeds with a valid refresh token", async () => {
  const {
    user,
    refreshToken,
  } = await createLoggedInUser();

  const result =
    await refreshAccessToken(
      refreshToken,
      "127.0.0.1"
    );

  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);

  assert.notEqual(
    result.refreshToken,
    refreshToken
  );

  const oldToken =
    await RefreshToken.findOne({
      tokenHash: hashToken(refreshToken),
    });

  assert.ok(oldToken);
  assert.ok(oldToken.revokedAt);

  const newToken =
    await RefreshToken.findOne({
      tokenHash: hashToken(
        result.refreshToken
      ),
    });

  assert.ok(newToken);

  assert.equal(
    newToken.userId.toString(),
    user._id.toString()
  );

  assert.equal(
    newToken.createdByIp,
    "127.0.0.1"
  );
});


test("refresh rejects a missing refresh token", async () => {
  await assert.rejects(
    () =>
      refreshAccessToken(
        null,
        "127.0.0.1"
      ),
    {
      message:
        "Refresh token is required",
    }
  );
});


test("refresh rejects an invalid refresh token", async () => {
  await assert.rejects(
    () =>
      refreshAccessToken(
        "invalid-refresh-token",
        "127.0.0.1"
      ),
    {
      message:
        "Invalid or expired refresh token",
    }
  );
});


test("refresh rejects an access token used as refresh token", async () => {
  const {
    accessToken,
  } = await createLoggedInUser();

  await assert.rejects(
    () =>
      refreshAccessToken(
        accessToken,
        "127.0.0.1"
      ),
    {
      message:
        "Invalid or expired refresh token",
    }
  );
});
test("refresh rejects a JWT with an invalid token type", async () => {
  const {
    user,
  } = await createLoggedInUser();

  const wrongTypeToken = jwt.sign(
    {
      sub: user._id.toString(),
      type: "access",
      jti: "test-wrong-type-token",
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "15m",
    }
  );

  await assert.rejects(
    () =>
      refreshAccessToken(
        wrongTypeToken,
        "127.0.0.1"
      ),
    {
      message:
        "Invalid refresh token",
    }
  );
});


test("refresh rejects a revoked refresh token", async () => {
  const {
    refreshToken,
  } = await createLoggedInUser();

  const storedToken =
    await RefreshToken.findOne({
      tokenHash: hashToken(refreshToken),
    });

  assert.ok(storedToken);

  storedToken.revokedAt = new Date(
    Date.now() - 1000
  );

  storedToken.revokedByIp =
    "10.0.0.1";

  await storedToken.save();

  await assert.rejects(
    () =>
      refreshAccessToken(
        refreshToken,
        "10.0.0.2"
      ),
    {
      message:
        "Refresh token reuse detected",
    }
  );
});


test("refresh token reuse revokes all active user tokens", async () => {
  const {
    user,
    refreshToken:
      firstRefreshToken,
  } = await createLoggedInUser();







  const secondResult =
    await refreshAccessToken(
      firstRefreshToken,
      "127.0.0.1"
    );

  const secondRefreshToken =
    secondResult.refreshToken;




  const activeBeforeReuse =
    await RefreshToken.findOne({
      tokenHash: hashToken(
        secondRefreshToken
      ),
    });

  assert.ok(activeBeforeReuse);
  assert.equal(
    activeBeforeReuse.revokedAt,
    null
  );







  await assert.rejects(
    () =>
      refreshAccessToken(
        firstRefreshToken,
        "192.168.1.100"
      ),
    {
      message:
        "Refresh token reuse detected",
    }
  );





  const userTokens =
    await RefreshToken.find({
      userId: user._id,
    });

  assert.ok(
    userTokens.length >= 2
  );

  for (const token of userTokens) {
    assert.ok(
      token.revokedAt,
      "Expected refresh token to be revoked"
    );
  }
});


test("refresh rejects token belonging to deleted user", async () => {
  const {
    user,
    refreshToken,
  } = await createLoggedInUser();

  await User.findByIdAndDelete(
    user._id
  );

  await assert.rejects(
    () =>
      refreshAccessToken(
        refreshToken,
        "127.0.0.1"
      ),
    {
      message:
        "User account is unavailable",
    }
  );
});


test("refresh rejects token for inactive user", async () => {
  const {
    user,
    refreshToken,
  } = await createLoggedInUser();

  user.isActive = false;

  await user.save();

  await assert.rejects(
    () =>
      refreshAccessToken(
        refreshToken,
        "127.0.0.1"
      ),
    {
      message:
        "User account is unavailable",
    }
  );
});


test("rotated refresh token has correct JWT type", async () => {
  const {
    refreshToken,
  } = await createLoggedInUser();

  const result =
    await refreshAccessToken(
      refreshToken,
      "127.0.0.1"
    );

  const decoded =
    jwt.verify(
      result.refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

  assert.equal(
    decoded.type,
    "refresh"
  );

  assert.ok(decoded.sub);
  assert.ok(decoded.jti);
});


test("rotated access token contains user identity and role", async () => {
  const {
    refreshToken,
  } = await createLoggedInUser();

  const result =
    await refreshAccessToken(
      refreshToken,
      "127.0.0.1"
    );

  const decoded =
    jwt.verify(
      result.accessToken,
      process.env.JWT_ACCESS_SECRET
    );

  assert.ok(decoded.sub);

  assert.equal(
    decoded.employeeId,
    "EMP001"
  );

  assert.equal(
    decoded.role,
    "USER"
  );

  assert.ok(decoded.jti);
});