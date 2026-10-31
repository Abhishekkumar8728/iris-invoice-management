import express from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  register,
  bootstrapAdmin,
  refresh,
  logout,
  forgotPasswordController,
  resetPasswordController,
  createAdminUser,
} from "../controllers/auth.controller.js";

import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

const bootstrapLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many bootstrap attempts",
  },
});

router.post("/login", login);
router.post("/register", register);
router.post("/bootstrap-admin", bootstrapLimiter, bootstrapAdmin);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);
router.post("/admin/users", authenticate, authorize("ADMIN"), createAdminUser);

export default router;