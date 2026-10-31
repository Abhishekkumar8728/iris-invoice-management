import { describe, after, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import connectDatabase from "../src/config/database.js";

process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret-change-me";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/iris_invoices";

await connectDatabase();

const { default: app } = await import("../src/app.js");

const userToken = jwt.sign(
  { sub: new mongoose.Types.ObjectId().toString(), employeeId: "USER001", role: "USER" },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: "1h" }
);

after(async () => {
  await mongoose.disconnect();
});

describe("Invoice RBAC", () => {
  test("USER cannot approve invoice", async () => {
    const response = await request(app)
      .patch("/api/v1/invoices/000000000000000000000000/approve")
      .set("Authorization", `Bearer ${userToken}`);

    assert.ok([401, 403].includes(response.statusCode));
  });

  test("USER cannot process invoice", async () => {
    const response = await request(app)
      .patch("/api/v1/invoices/000000000000000000000000/process")
      .set("Authorization", `Bearer ${userToken}`);

    assert.ok([401, 403].includes(response.statusCode));
  });

  test("USER cannot access another user's invoice", async () => {
    const response = await request(app)
      .get("/api/v1/invoices/000000000000000000000000")
      .set("Authorization", `Bearer ${userToken}`);

    assert.ok([403, 404].includes(response.statusCode));
  });
});