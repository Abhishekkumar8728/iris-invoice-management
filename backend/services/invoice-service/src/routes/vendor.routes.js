import express from "express";
import {
  archiveVendor,
  createVendor,
  getVendor,
  listVendors,
  updateVendor,
} from "../controllers/vendor.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createVendorSchema,
  updateVendorSchema,
  vendorCodeSchema,
  vendorQuerySchema,
} from "../validators/vendor.validator.js";

const router = express.Router();

router.use(authenticate);
router.get("/", validate(vendorQuerySchema, "query"), listVendors);
router.post("/", authorize("ADMIN", "FINANCE"), validate(createVendorSchema), createVendor);
router.get("/:vendorCode", validate(vendorCodeSchema, "params"), getVendor);
router.patch(
  "/:vendorCode",
  authorize("ADMIN", "FINANCE"),
  validate(vendorCodeSchema, "params"),
  validate(updateVendorSchema),
  updateVendor,
);
router.delete(
  "/:vendorCode",
  authorize("ADMIN", "FINANCE"),
  validate(vendorCodeSchema, "params"),
  archiveVendor,
);

export default router;
