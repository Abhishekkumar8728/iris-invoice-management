import test from "node:test";
import assert from "node:assert/strict";
import {sendNotificationSchema} from "../src/validators/notification.validator.js";

test("notification schema rejects unsupported SMS delivery", () => {
  const result = sendNotificationSchema.validate({
    type: "GENERAL",
    channel: "SMS",
    recipient: "user@example.com",
  });
  assert.ok(result.error);
});

test("notification schema accepts email delivery", () => {
  const result = sendNotificationSchema.validate({
    type: "GENERAL",
    recipient: "user@example.com",
  });
  assert.equal(result.error, undefined);
  assert.equal(result.value.channel, "EMAIL");
});
