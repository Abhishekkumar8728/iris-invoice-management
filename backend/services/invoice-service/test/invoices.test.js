import { describe, before, after, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import connectDatabase from "../src/config/database.js";

process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret-change-me";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/iris_invoices";

const { default: app } = await import("../src/app.js");

describe("Invoice Workflow", () => {
  let userToken;
  let financeToken;
  let approverToken;
  let invoiceId;

  before(async () => {
    await connectDatabase();

    userToken = jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString(), employeeId: "USER001", role: "FINANCE" },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    financeToken = jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString(), employeeId: "FIN001", role: "FINANCE" },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    approverToken = jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString(), employeeId: "APP001", role: "APPROVER" },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );
  });

  after(async () => {
    await mongoose.disconnect();
  });

  test("create invoice as USER", async () => {
    const response = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        vendor: {
          vendorCode: "TEST_VENDOR",
          name: "Test Vendor",
        },
        invoiceDate: "2026-09-15",
        dueDate: "2026-09-30",
        items: [
          {
            description: "Test Item",
            quantity: 1,
            unitPrice: 1000,
            taxRate: 18,
          },
        ],
      });

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.data.status, "DRAFT");
    invoiceId = response.body.data._id;
  });

  test("submit invoice", async () => {
    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/submit`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.status, "SUBMITTED");
  });

  test("start invoice review", async () => {
    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/review`)
      .set("Authorization", `Bearer ${financeToken}`);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.status, "UNDER_REVIEW");
  });

  test("approve invoice", async () => {
    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/approve`)
      .set("Authorization", `Bearer ${approverToken}`);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.status, "APPROVED");
  });

  test("process invoice", async () => {
    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/process`)
      .set("Authorization", `Bearer ${financeToken}`);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.status, "PROCESSED");
  });

  test("pay invoice", async () => {
    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/pay`)
      .set("Authorization", `Bearer ${financeToken}`);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.status, "PAID");
  });
});