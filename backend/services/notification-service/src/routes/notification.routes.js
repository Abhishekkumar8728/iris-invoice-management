import express from "express";

import serviceAuthentication from "../middleware/service-auth.middleware.js";

import {
  sendNotificationController,
  sendOtpController,
  verifyOtpController,
  notificationHistoryController,
  userNotificationHistoryController,
  markNotificationReadController,
  markAllNotificationsReadController,
} from "../controllers/notification.controller.js";

import validate from "../middleware/validate.middleware.js";

import {
  sendNotificationSchema,
  sendOtpSchema,
  verifyOtpSchema,
  notificationQuerySchema,
  notificationIdSchema,
} from "../validators/notification.validator.js";

const router =
  express.Router();

router.use(
  serviceAuthentication
);




router.get(
  "/",
  validate(
    notificationQuerySchema,
    "query"
  ),
  userNotificationHistoryController
);






router.patch(
  "/read-all",
  markAllNotificationsReadController
);

router.patch(
  "/:id/read",
  validate(
    notificationIdSchema,
    "params"
  ),
  markNotificationReadController
);




router.post(
  "/send",
  validate(
    sendNotificationSchema,
    "body"
  ),
  sendNotificationController
);




router.post(
  "/otp/send",
  validate(
    sendOtpSchema,
    "body"
  ),
  sendOtpController
);




router.post(
  "/otp/verify",
  validate(
    verifyOtpSchema,
    "body"
  ),
  verifyOtpController
);




router.get(
  "/history",
  validate(
    notificationQuerySchema,
    "query"
  ),
  notificationHistoryController
);

export default router;