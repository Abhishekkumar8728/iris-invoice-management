
import express from "express";

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  getDashboardStats,
  getInvoiceAuditHistory,
  addAttachment,
  downloadAttachment,
  deleteAttachment,
  submitInvoice,
  startReview,
  approveInvoice,
  rejectInvoice,
  processInvoice,
  markInvoicePaid,
  cancelInvoice,
  resubmitRejectedInvoice,
} from "../controllers/invoice.controller.js";
import {
  chat,
} from "../controllers/chatbot.controller.js";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

import upload from "../middleware/upload.middleware.js";
import validate from "../middleware/validate.middleware.js";

import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceQuerySchema,
  rejectInvoiceSchema,
  objectIdSchema,
  attachmentParamsSchema,
  emptyBodySchema,
} from "../validators/invoice.validator.js";

const router = express.Router();








router.use(authenticate);







router.post(
  "/chatbot",
  chat
);








router.post(
  "/",
  authorize(
    "ADMIN",
    "FINANCE",
    "APPROVER",
    "USER"
  ),
  validate(createInvoiceSchema, "body"),
  createInvoice
);








router.get(
  "/",
  validate(invoiceQuerySchema, "query"),
  getInvoices
);







router.get(
  "/dashboard/stats",
  getDashboardStats
);







router.get(
  "/:id/audit-history",
  validate(objectIdSchema, "params"),
  getInvoiceAuditHistory
);







router.get(
  "/:id",
  validate(objectIdSchema, "params"),
  getInvoiceById
);











router.patch(
  "/:id",
  authorize(
    "ADMIN",
    "FINANCE",
    "APPROVER"
  ),
  validate(objectIdSchema, "params"),
  validate(updateInvoiceSchema, "body"),
  updateInvoice
);













router.post(
  "/:id/attachments",
  authorize(
    "ADMIN",
    "FINANCE",
    "APPROVER",
    "USER"
  ),
  validate(objectIdSchema, "params"),
  upload.fields([
    {
      name: "file",
      maxCount: 1,
    },
    {
      name: "attachments",
      maxCount: 5,
    },
  ]),
  addAttachment
);








router.delete(
  "/:id/attachments/:attachmentId",
  authorize(
    "ADMIN",
    "FINANCE",
    "APPROVER",
    "USER"
  ),
  validate(attachmentParamsSchema, "params"),
  deleteAttachment
);









router.get(
  "/:id/attachments/:attachmentId",
  validate(attachmentParamsSchema, "params"),
  downloadAttachment
);










router.patch(
  "/:id/submit",
  authorize(
    "ADMIN",
    "FINANCE",
    "APPROVER"
  ),
  validate(objectIdSchema, "params"),
  validate(emptyBodySchema, "body"),
  submitInvoice
);








router.patch(
  "/:id/review",
  authorize(
    "ADMIN",
    "FINANCE",
    "APPROVER"
  ),
  validate(objectIdSchema, "params"),
  validate(emptyBodySchema, "body"),
  startReview
);








router.patch(
  "/:id/approve",
  authorize(
    "ADMIN",
    "FINANCE",
    "APPROVER"
  ),
  validate(objectIdSchema, "params"),
  validate(emptyBodySchema, "body"),
  approveInvoice
);








router.patch(
  "/:id/reject",
  authorize(
    "ADMIN",
    "FINANCE",
    "APPROVER"
  ),
  validate(objectIdSchema, "params"),
  validate(rejectInvoiceSchema, "body"),
  rejectInvoice
);










router.patch(
  "/:id/resubmit",
  authorize(
    "ADMIN",
    "FINANCE"
  ),
  validate(objectIdSchema, "params"),
  validate(emptyBodySchema, "body"),
  resubmitRejectedInvoice
);








router.patch(
  "/:id/process",
  authorize(
    "ADMIN",
    "FINANCE"
  ),
  validate(objectIdSchema, "params"),
  validate(emptyBodySchema, "body"),
  processInvoice
);








router.patch(
  "/:id/pay",
  authorize(
    "ADMIN",
    "FINANCE"
  ),
  validate(objectIdSchema, "params"),
  validate(emptyBodySchema, "body"),
  markInvoicePaid
);








router.patch(
  "/:id/cancel",
  authorize(
    "ADMIN",
    "FINANCE"
  ),
  validate(objectIdSchema, "params"),
  validate(emptyBodySchema, "body"),
  cancelInvoice
);

export default router;