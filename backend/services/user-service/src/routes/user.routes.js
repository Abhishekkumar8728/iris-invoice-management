import express from "express";

import {
  getUsers,
  getUserById,
  getMyProfile,
} from "../controllers/user.controller.js";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

import validate from "../middleware/validate.middleware.js";

import {
  userQuerySchema,
  objectIdSchema,
} from "../validators/user.validator.js";

const router = express.Router();




router.use(authenticate);






router.get(
  "/me",
  getMyProfile
);






router.get(
  "/",
  authorize("ADMIN"),
  validate(userQuerySchema, "query"),
  getUsers
);






router.get(
  "/:id",
  authorize("ADMIN"),
  validate(objectIdSchema, "params"),
  getUserById
);

export default router;