import test from "node:test";
import assert from "node:assert/strict";
import {
  invoiceQuerySchema,
  updateInvoiceSchema,
} from "../src/validators/invoice.validator.js";

test("invoice query schema rejects unknown status", () => {
  const result = invoiceQuerySchema.validate({status: "UNKNOWN"});
  assert.ok(result.error);
});

test("invoice query schema accepts bounded filters", () => {
  const result = invoiceQuerySchema.validate({
    page: 2,
    limit: 25,
    status: "PAID",
    minAmount: 100,
    maxAmount: 500,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.value.page, 2);
});

test("invoice update schema requires at least one field", () => {
  const result = updateInvoiceSchema.validate({});
  assert.ok(result.error);
});

test("invoice date filters reject an end date before start date", () => {
  const result = invoiceQuerySchema.validate({
    dateFrom: "2026-09-10T00:00:00.000Z",
    dateTo: "2026-09-09T00:00:00.000Z"
  });
  assert.ok(result.error);
});
