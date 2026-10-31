import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import {
  authenticate,
  authorize,
} from "../src/middleware/auth.middleware.js";

process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "test-access-secret";

const createResponse = () => {
  const response = {
    statusCode: null,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };

  return response;
};

test("authenticate rejects missing Authorization header", () => {
  const req = {
    headers: {},
  };

  const res = createResponse();

  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(
    res.body.message,
    "Authorization header is required"
  );
  assert.equal(nextCalled, false);
});

test("authenticate rejects invalid authorization format", () => {
  const req = {
    headers: {
      authorization: "Basic abc123",
    },
  };

  const res = createResponse();

  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(
    res.body.message,
    "Invalid authorization format"
  );
  assert.equal(nextCalled, false);
});

test("authenticate accepts a valid access token", () => {
  const token = jwt.sign(
    {
      sub: "507f1f77bcf86cd799439011",
      employeeId: "EMP001",
      name: "Test User",
      role: "USER",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );

  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  const res = createResponse();

  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);

  assert.deepEqual(req.user, {
    id: "507f1f77bcf86cd799439011",
    employeeId: "EMP001",
    name: "Test User",
    role: "USER",
  });
});

test("authenticate rejects an invalid access token", () => {
  const req = {
    headers: {
      authorization: "Bearer invalid-token",
    },
  };

  const res = createResponse();

  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(
    res.body.message,
    "Invalid or expired access token"
  );
  assert.equal(nextCalled, false);
});

test("authorize allows an allowed role", () => {
  const req = {
    user: {
      id: "123",
      employeeId: "ADMIN001",
      role: "ADMIN",
    },
  };

  const res = createResponse();

  let nextCalled = false;

  authorize("ADMIN")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test("authorize rejects a non-allowed role", () => {
  const req = {
    user: {
      id: "123",
      employeeId: "EMP001",
      role: "USER",
    },
  };

  const res = createResponse();

  let nextCalled = false;

  authorize("ADMIN")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(
    res.body.message,
    "Access denied"
  );
  assert.equal(nextCalled, false);
});

test("authorize rejects missing authentication", () => {
  const req = {};
  const res = createResponse();

  let nextCalled = false;

  authorize("ADMIN")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(
    res.body.message,
    "Authentication required"
  );
  assert.equal(nextCalled, false);
});