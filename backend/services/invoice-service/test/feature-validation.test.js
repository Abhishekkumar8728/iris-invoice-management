import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createVendorSchema,
  updateVendorSchema,
  vendorQuerySchema,
} from "../src/validators/vendor.validator.js";

test("vendor validation normalizes vendor codes and rejects empty updates", () => {
  const result = createVendorSchema.validate({
    vendorCode: "v-100",
    name: "Example Vendor",
  });

  assert.equal(result.error, undefined);
  assert.equal(result.value.vendorCode, "V-100");
  assert.ok(updateVendorSchema.validate({}).error);
  assert.equal(vendorQuerySchema.validate({ page: "2" }).value.page, 2);
});
