import express from "express";
import serviceAuthentication from "../middleware/service-auth.middleware.js";

import {
  publicUserNotificationHistoryController,
  markNotificationReadController,
  markAllNotificationsReadController,
} from "../controllers/notification.controller.js";

const router = express.Router();





router.use(serviceAuthentication);
router.use((req, res, next) => {
  const userId = req.headers["x-user-id"];

  if (typeof userId !== "string" || !userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user identity is required",
    });
  }

  req.user = { sub: userId };
  next();
});

router.get(
  "/",
  publicUserNotificationHistoryController
);

router.patch(
  "/read-all",
  markAllNotificationsReadController
);

router.patch(
  "/:id/read",
  markNotificationReadController
);

export default router;