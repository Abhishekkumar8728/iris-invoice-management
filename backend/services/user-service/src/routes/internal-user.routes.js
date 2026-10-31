import express from "express";

import serviceAuth from "../middleware/service-auth.middleware.js";

import {
  createInternalUser,
  getUserByEmployeeId,
  deleteInternalUser,
} from "../controllers/internal-user.controller.js";

import validate from "../middleware/validate.middleware.js";

import {
  createUserSchema,
  employeeIdParamSchema,
} from "../validators/user.validator.js";

const router =
  express.Router();

router.use(serviceAuth);

router.post(
  "/",
  validate(
    createUserSchema,
    "body"
  ),
  createInternalUser
);

router.get(
  "/employee/:employeeId",
  validate(
    employeeIdParamSchema,
    "params"
  ),
  getUserByEmployeeId
);

router.delete(
  "/employee/:employeeId",
  validate(
    employeeIdParamSchema,
    "params"
  ),
  deleteInternalUser
);

export default router;