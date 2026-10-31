import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";

test("public notification route is mounted behind service authentication", async () => {
  const response = await request(app).get("/api/v1/notifications");

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Service authentication required");
});

test("public notification route requires gateway user identity", async () => {
  const previousKey = process.env.INTERNAL_SERVICE_KEY;
  process.env.INTERNAL_SERVICE_KEY = "test-service-key";

  try {
    const response = await request(app)
      .get("/api/v1/notifications")
      .set("x-service-key", "test-service-key");

    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Authenticated user identity is required");
  } finally {
    if (previousKey === undefined) {
      delete process.env.INTERNAL_SERVICE_KEY;
    } else {
      process.env.INTERNAL_SERVICE_KEY = previousKey;
    }
  }
});
