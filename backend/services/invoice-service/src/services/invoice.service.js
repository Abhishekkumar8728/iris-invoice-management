import { Invoice, INVOICE_STATUS } from "../models/invoice.model.js";
import generateInvoiceNumber from "../utils/invoice-number.js";
import fs from "fs";
import mongoose from "mongoose";
import {notifyInvoiceStatus} from "./notification-client.service.js";
import { synchronizeVendor } from "./vendor.service.js";

const sendInvoiceNotification = async (
  type,
  template,
  invoice,
  rejectionReason
) => {
  if (!invoice.vendor?.email) {
    return;
  }

  try {
    await notifyInvoiceStatus({
      type,
      recipient: invoice.vendor.email,
      template,
      invoice,
      rejectionReason,
    });
  } catch (error) {
    console.error("Invoice notification failed:", error.message);
  }
};

const calculateItems = (items) => {
  return items.map((item) => {
    const taxableAmount = Number((item.quantity * item.unitPrice).toFixed(2));

    const taxAmount = Number((taxableAmount * (item.taxRate / 100)).toFixed(2));

    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

    return {
      ...item,

      taxableAmount,

      taxAmount,

      totalAmount,
    };
  });
};

const calculateAmounts = (items, cgst = 0, sgst = 0, igst = 0) => {
  const calculatedItems = calculateItems(items);

  const taxableAmount = calculatedItems.reduce(
    (total, item) => total + item.taxableAmount,
    0,
  );

  const itemTax = calculatedItems.reduce(
    (total, item) => total + item.taxAmount,
    0,
  );

  const totalTax = Number(
    (itemTax + Number(cgst) + Number(sgst) + Number(igst)).toFixed(2),
  );

  const totalAmount = Number(
    (taxableAmount + totalTax).toFixed(2),
  );

  return {
    items: calculatedItems,

    amounts: {
      taxableAmount: Number(taxableAmount.toFixed(2)),

      cgst: Number(Number(cgst).toFixed(2)),

      sgst: Number(Number(sgst).toFixed(2)),

      igst: Number(Number(igst).toFixed(2)),

      totalTax,

      totalAmount,
    },
  };
};
const createInvoice = async (payload, user) => {
  await synchronizeVendor(payload.vendor, user.id);

  const invoiceNumber = await generateInvoiceNumber(Invoice);

  const purchaseOrderNumber = payload.purchaseOrderNumber ?? payload.poNumber;

  const { items, amounts } = calculateAmounts(
    payload.items,
    payload.cgst,
    payload.sgst,
    payload.igst,
  );

  const invoice = await Invoice.create({
    invoiceNumber,

    vendor: payload.vendor,

    invoiceDate: payload.invoiceDate,

    dueDate: payload.dueDate,

    currency: payload.currency,

    purchaseOrderNumber,

    items,

    amounts,

    status: INVOICE_STATUS.DRAFT,

    createdBy: user.id,

    auditHistory: [
      {
        action: "CREATED",

        fromStatus: null,

        toStatus: INVOICE_STATUS.DRAFT,

        performedBy: user.id,

        performedByRole: user.role,

        ipAddress: null,
      },
    ],
  });

  return invoice;
};
const getInvoiceById = async (invoiceId, user) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const canView =
    user.role === "ADMIN" ||
    user.role === "FINANCE" ||
    user.role === "APPROVER" ||
    invoice.createdBy.toString() === user.id;

  if (!canView) {
    const error = new Error("You are not authorized to view this invoice");

    error.statusCode = 403;

    throw error;
  }

  return invoice;
};
const getInvoices = async ({
  user,
  page = 1,
  limit = 10,
  search,
  status,
  vendorCode,
  dateFrom,
  dateTo,
  minAmount,
  maxAmount,
}) => {
  const pageNumber = Math.max(Number(page), 1);

  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const filter = {};

  if (!["ADMIN", "FINANCE", "APPROVER"].includes(user.role)) {
    filter.createdBy = user.id;
  }

  if (status) {
    filter.status = status;
  }

  if (vendorCode) {
    filter["vendor.vendorCode"] = vendorCode.toUpperCase();
  }

  if (search) {
    filter.$or = [
      {
        invoiceNumber: {
          $regex: search,
          $options: "i",
        },
      },
      {
        purchaseOrderNumber: {
          $regex: search,
          $options: "i",
        },
      },
      {
        "vendor.name": {
          $regex: search,
          $options: "i",
        },
      },
      {
        "vendor.vendorCode": {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (dateFrom || dateTo) {
    filter.invoiceDate = {};

    if (dateFrom) {
      filter.invoiceDate.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
    }

    if (dateTo) {
      filter.invoiceDate.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    filter["amounts.totalAmount"] = {};

    if (minAmount !== undefined) {
      filter["amounts.totalAmount"].$gte = Number(minAmount);
    }

    if (maxAmount !== undefined) {
      filter["amounts.totalAmount"].$lte = Number(maxAmount);
    }
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    Invoice.countDocuments(filter),
  ]);

  return {
    invoices,

    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};
const allowedTransitions = {
  [INVOICE_STATUS.DRAFT]: [INVOICE_STATUS.SUBMITTED, INVOICE_STATUS.CANCELLED],

  [INVOICE_STATUS.SUBMITTED]: [
    INVOICE_STATUS.UNDER_REVIEW,
    INVOICE_STATUS.REJECTED,
    INVOICE_STATUS.CANCELLED,
  ],

  [INVOICE_STATUS.UNDER_REVIEW]: [
    INVOICE_STATUS.APPROVED,
    INVOICE_STATUS.REJECTED,
  ],

  [INVOICE_STATUS.APPROVED]: [INVOICE_STATUS.PROCESSED],

  [INVOICE_STATUS.PROCESSED]: [INVOICE_STATUS.PAID],

  [INVOICE_STATUS.REJECTED]: [INVOICE_STATUS.DRAFT],

  [INVOICE_STATUS.PAID]: [],

  [INVOICE_STATUS.CANCELLED]: [],
};
const validateTransition = (currentStatus, nextStatus) => {
  const allowed = allowedTransitions[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    const error = new Error(
      `Invalid invoice status transition: ${currentStatus} → ${nextStatus}`,
    );

    error.statusCode = 400;

    throw error;
  }
};
const submitInvoice = async (invoiceId, user, ipAddress) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.createdBy.toString() !== user.id) {
    const error = new Error("Only invoice creator can submit this invoice");

    error.statusCode = 403;

    throw error;
  }

  validateTransition(invoice.status, INVOICE_STATUS.SUBMITTED);

  const previousStatus = invoice.status;

  invoice.status = INVOICE_STATUS.SUBMITTED;

  invoice.submittedAt = new Date();

  invoice.auditHistory.push({
    action: "SUBMITTED",

    fromStatus: previousStatus,

    toStatus: INVOICE_STATUS.SUBMITTED,

    performedBy: user.id,

    performedByRole: user.role,

    ipAddress,
  });

  await invoice.save();

  return invoice;
};
const startReview = async (invoiceId, user, ipAddress) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  validateTransition(invoice.status, INVOICE_STATUS.UNDER_REVIEW);

  const previousStatus = invoice.status;

  invoice.status = INVOICE_STATUS.UNDER_REVIEW;

  invoice.auditHistory.push({
    action: "UNDER_REVIEW",

    fromStatus: previousStatus,

    toStatus: INVOICE_STATUS.UNDER_REVIEW,

    performedBy: user.id,

    performedByRole: user.role,

    ipAddress,
  });

  await invoice.save();

  return invoice;
};
const approveInvoice = async (invoiceId, user, ipAddress) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (!["ADMIN", "FINANCE", "APPROVER"].includes(user.role)) {
  const error = new Error(
    "You are not authorized to approve invoices"
  );

  error.statusCode = 403;

  throw error;
}

  validateTransition(invoice.status, INVOICE_STATUS.APPROVED);

  const previousStatus = invoice.status;

  invoice.status = INVOICE_STATUS.APPROVED;

  invoice.approvedBy = user.id;

  invoice.approvedAt = new Date();

  invoice.auditHistory.push({
    action: "APPROVED",

    fromStatus: previousStatus,

    toStatus: INVOICE_STATUS.APPROVED,

    performedBy: user.id,

    performedByRole: user.role,

    ipAddress,
  });

  await invoice.save();

  await sendInvoiceNotification(
    "INVOICE_APPROVED",
    "invoice-approved",
    invoice
  );

  return invoice;
};
const rejectInvoice = async (invoiceId, reason, user, ipAddress) => {
  if (!reason || !reason.trim()) {
    const error = new Error("Rejection reason is required");

    error.statusCode = 400;

    throw error;
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (!["ADMIN", "FINANCE", "APPROVER"].includes(user.role)) {
    const error = new Error("You are not authorized to reject invoices");

    error.statusCode = 403;

    throw error;
  }

  validateTransition(invoice.status, INVOICE_STATUS.REJECTED);

  const previousStatus = invoice.status;

  invoice.status = INVOICE_STATUS.REJECTED;

  invoice.rejectedBy = user.id;

  invoice.rejectedAt = new Date();

  invoice.rejectionReason = reason.trim();

  invoice.auditHistory.push({
    action: "REJECTED",

    fromStatus: previousStatus,

    toStatus: INVOICE_STATUS.REJECTED,

    performedBy: user.id,

    performedByRole: user.role,

    comments: reason.trim(),

    ipAddress,
  });

  await invoice.save();

  await sendInvoiceNotification(
    "INVOICE_REJECTED",
    "invoice-rejected",
    invoice,
    reason.trim()
  );

  return invoice;
};
const resubmitRejectedInvoice = async (invoiceId, user, ipAddress) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.createdBy.toString() !== user.id) {
    const error = new Error("Only invoice creator can resubmit this invoice");

    error.statusCode = 403;

    throw error;
  }

  validateTransition(invoice.status, INVOICE_STATUS.DRAFT);

  const previousStatus = invoice.status;

  invoice.status = INVOICE_STATUS.DRAFT;

  invoice.rejectionReason = null;

  invoice.rejectedBy = null;

  invoice.rejectedAt = null;

  invoice.auditHistory.push({
    action: "RETURNED_TO_DRAFT",

    fromStatus: previousStatus,

    toStatus: INVOICE_STATUS.DRAFT,

    performedBy: user.id,

    performedByRole: user.role,

    ipAddress,
  });

  await invoice.save();

  return invoice;
};
const processInvoice = async (invoiceId, user, ipAddress) => {
  if (!["ADMIN", "FINANCE"].includes(user.role)) {
    const error = new Error("Only finance or admin can process invoices");

    error.statusCode = 403;

    throw error;
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  validateTransition(invoice.status, INVOICE_STATUS.PROCESSED);

  const previousStatus = invoice.status;

  invoice.status = INVOICE_STATUS.PROCESSED;

  invoice.processedAt = new Date();

  invoice.auditHistory.push({
    action: "PROCESSED",

    fromStatus: previousStatus,

    toStatus: INVOICE_STATUS.PROCESSED,

    performedBy: user.id,

    performedByRole: user.role,

    ipAddress,
  });

  await invoice.save();

  await sendInvoiceNotification(
    "INVOICE_PROCESSED",
    "invoice-processed",
    invoice
  );

  return invoice;
};
const markInvoicePaid = async (invoiceId, user, ipAddress) => {
  if (!["ADMIN", "FINANCE"].includes(user.role)) {
    const error = new Error("Only finance or admin can mark invoice as paid");

    error.statusCode = 403;

    throw error;
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  validateTransition(invoice.status, INVOICE_STATUS.PAID);

  const previousStatus = invoice.status;

  invoice.status = INVOICE_STATUS.PAID;

  invoice.paidAt = new Date();

  invoice.auditHistory.push({
    action: "PAID",

    fromStatus: previousStatus,

    toStatus: INVOICE_STATUS.PAID,

    performedBy: user.id,

    performedByRole: user.role,

    ipAddress,
  });

  await invoice.save();

  await sendInvoiceNotification(
    "INVOICE_PAID",
    "invoice-paid",
    invoice
  );

  return invoice;
};
const cancelInvoice = async (invoiceId, user, ipAddress) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const canCancel =
    user.role === "ADMIN" || invoice.createdBy.toString() === user.id;

  if (!canCancel) {
    const error = new Error("You are not authorized to cancel this invoice");

    error.statusCode = 403;

    throw error;
  }

  validateTransition(invoice.status, INVOICE_STATUS.CANCELLED);

  const previousStatus = invoice.status;

  invoice.status = INVOICE_STATUS.CANCELLED;

  invoice.cancelledAt = new Date();

  invoice.auditHistory.push({
    action: "CANCELLED",

    fromStatus: previousStatus,

    toStatus: INVOICE_STATUS.CANCELLED,

    performedBy: user.id,

    performedByRole: user.role,

    ipAddress,
  });

  await invoice.save();

  return invoice;
};

const updateInvoice = async (invoiceId, payload, user, ipAddress) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const editableStatuses = [INVOICE_STATUS.DRAFT, INVOICE_STATUS.REJECTED];

  if (!editableStatuses.includes(invoice.status)) {
    const error = new Error(
      `Invoice cannot be edited while status is ${invoice.status}`,
    );

    error.statusCode = 400;

    throw error;
  }

  if (invoice.createdBy.toString() !== user.id && user.role !== "ADMIN") {
    const error = new Error("You are not authorized to edit this invoice");

    error.statusCode = 403;

    throw error;
  }

  const invoiceDate = payload.invoiceDate || invoice.invoiceDate;
  const dueDate = payload.dueDate || invoice.dueDate;

  if (new Date(dueDate) < new Date(invoiceDate)) {
    const error = new Error(
      "Due date must be on or after invoice date"
    );
    error.statusCode = 400;
    throw error;
  }

  let calculatedItems = invoice.items;

  let amounts = invoice.amounts;

  if (payload.items) {
    const result = calculateAmounts(
      payload.items,
      payload.cgst ?? invoice.amounts.cgst,
      payload.sgst ?? invoice.amounts.sgst,
      payload.igst ?? invoice.amounts.igst,
    );

    calculatedItems = result.items;

    amounts = result.amounts;
  } else if (
    payload.cgst !== undefined ||
    payload.sgst !== undefined ||
    payload.igst !== undefined
  ) {
    const result = calculateAmounts(
      invoice.items,
      payload.cgst ?? invoice.amounts.cgst,
      payload.sgst ?? invoice.amounts.sgst,
      payload.igst ?? invoice.amounts.igst,
    );

    calculatedItems = result.items;

    amounts = result.amounts;
  }

  if (payload.vendor) {
    invoice.vendor = payload.vendor;
  }

  if (payload.invoiceDate) {
    invoice.invoiceDate = payload.invoiceDate;
  }

  if (payload.dueDate) {
    invoice.dueDate = payload.dueDate;
  }

  if (payload.currency) {
    invoice.currency = payload.currency;
  }

  if (
    payload.purchaseOrderNumber !== undefined ||
    payload.poNumber !== undefined
  ) {
    invoice.purchaseOrderNumber =
      payload.purchaseOrderNumber ?? payload.poNumber;
  }

  invoice.items = calculatedItems;

  invoice.amounts = amounts;

  invoice.auditHistory.push({
    action: "UPDATED",

    fromStatus: invoice.status,

    toStatus: invoice.status,

    performedBy: user.id,

    performedByRole: user.role,

    ipAddress,
  });

  await invoice.save();

  if (payload.vendor) {
    await synchronizeVendor(payload.vendor, user.id);
  }

  return invoice;
};

const getInvoiceAuditHistory = async (invoiceId, user) => {
  const invoice = await Invoice.findById(invoiceId)
    .select("invoiceNumber createdBy auditHistory")
    .lean();

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const canView =
    user.role === "ADMIN" ||
    user.role === "FINANCE" ||
    user.role === "APPROVER" ||
    invoice.createdBy.toString() === user.id;

  if (!canView) {
    const error = new Error("You are not authorized to view invoice history");

    error.statusCode = 403;

    throw error;
  }

  return {
    invoiceNumber: invoice.invoiceNumber,

    history: invoice.auditHistory,
  };
};

const getAttachment = async (invoiceId, attachmentId, user) => {
  const invoice = await getInvoiceById(invoiceId, user);
  const attachment = invoice.attachments.id(attachmentId);

  if (!attachment || !fs.existsSync(attachment.filePath)) {
    const error = new Error("Attachment not found");
    error.statusCode = 404;
    throw error;
  }

  return attachment;
};

const addAttachment = async (invoiceId, file, user, ipAddress) => {
  if (!file) {
    throw new Error("File is required");
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

 const canUpload =
  invoice.createdBy.toString() === user.id ||
  ["ADMIN", "FINANCE", "APPROVER"].includes(user.role);

if (!canUpload) {
  const error = new Error(
    "You are not authorized to upload attachments"
  );

  error.statusCode = 403;

  throw error;
}

  const editableStatuses = [INVOICE_STATUS.DRAFT, INVOICE_STATUS.REJECTED];

  if (!editableStatuses.includes(invoice.status)) {
    const error = new Error(
      "Attachments cannot be added after invoice submission",
    );
    error.statusCode = 400;
    throw error;
  }

  invoice.attachments.push({
    originalName: file.originalname,
    fileName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy: user.id,
    uploadedAt: new Date(),
  });

  invoice.auditHistory.push({
    action: "ATTACHMENT_ADDED",
    fromStatus: invoice.status,
    toStatus: invoice.status,
    performedBy: user.id,
    performedByRole: user.role,
    comments: file.originalname,
    ipAddress,
  });

  await invoice.save();
  return invoice;
};

const deleteAttachment = async (invoiceId, attachmentId, user, ipAddress) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const editableStatuses = [INVOICE_STATUS.DRAFT, INVOICE_STATUS.REJECTED];

  if (!editableStatuses.includes(invoice.status)) {
    const error = new Error("Attachments cannot be deleted after submission");
    error.statusCode = 400;
    throw error;
  }

  const attachment = invoice.attachments.id(attachmentId);

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  if (attachment.uploadedBy.toString() !== user.id && user.role !== "ADMIN") {
    const error = new Error("You are not authorized to delete this attachment");
    error.statusCode = 403;
    throw error;
  }

  if (fs.existsSync(attachment.filePath)) {
    fs.unlinkSync(attachment.filePath);
  }

  invoice.attachments.pull(attachmentId);
  invoice.auditHistory.push({
    action: "ATTACHMENT_DELETED",
    fromStatus: invoice.status,
    toStatus: invoice.status,
    performedBy: user.id,
    performedByRole: user.role,
    comments: attachment.originalName,
    ipAddress,
  });

  await invoice.save();
  return invoice;
};


const getDashboardStats = async (user) => {
  const filter = {};



  if (!["ADMIN", "FINANCE", "APPROVER"].includes(user.role)) {
    if (!mongoose.Types.ObjectId.isValid(user.id)) {
      throw new Error("Invalid user ID");
    }

    filter.createdBy = new mongoose.Types.ObjectId(user.id);
  }

  const result = await Invoice.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,

        totalInvoices: { $sum: 1 },

        totalValue: {
          $sum: {
            $ifNull: ["$amounts.totalAmount", 0],
          },
        },

        draftCount: {
          $sum: {
            $cond: [
              { $eq: ["$status", INVOICE_STATUS.DRAFT] },
              1,
              0,
            ],
          },
        },

        submittedCount: {
          $sum: {
            $cond: [
              { $eq: ["$status", INVOICE_STATUS.SUBMITTED] },
              1,
              0,
            ],
          },
        },

        reviewCount: {
          $sum: {
            $cond: [
              { $eq: ["$status", INVOICE_STATUS.UNDER_REVIEW] },
              1,
              0,
            ],
          },
        },

        approvedCount: {
          $sum: {
            $cond: [
              { $eq: ["$status", INVOICE_STATUS.APPROVED] },
              1,
              0,
            ],
          },
        },

        rejectedCount: {
          $sum: {
            $cond: [
              { $eq: ["$status", INVOICE_STATUS.REJECTED] },
              1,
              0,
            ],
          },
        },

        processedCount: {
          $sum: {
            $cond: [
              { $eq: ["$status", INVOICE_STATUS.PROCESSED] },
              1,
              0,
            ],
          },
        },

        paidCount: {
          $sum: {
            $cond: [
              { $eq: ["$status", INVOICE_STATUS.PAID] },
              1,
              0,
            ],
          },
        },

        cancelledCount: {
          $sum: {
            $cond: [
              { $eq: ["$status", INVOICE_STATUS.CANCELLED] },
              1,
              0,
            ],
          },
        },

                paidValue: {
          $sum: {
            $cond: [
              { $eq: ["$status", "PAID"] },
              { $ifNull: ["$amounts.totalAmount", 0] },
              0,
            ],
          },
        },

        pendingValue: {
          $sum: {
            $cond: [
              {
                $not: [
                  {
                    $in: ["$status", ["PAID", "CANCELLED"]],
                  },
                ],
              },
              { $ifNull: ["$amounts.totalAmount", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  const stats = result[0] || {
    totalInvoices: 0,
    totalValue: 0,
    draftCount: 0,
    submittedCount: 0,
    reviewCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    processedCount: 0,
    paidCount: 0,
    cancelledCount: 0,
    paidValue: 0,
  };

  stats.pendingValue = Number(
    (stats.totalValue - stats.paidValue).toFixed(2)
  );

  delete stats._id;

  const recentInvoices = await Invoice.find(filter)
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    ...stats,
    draft: stats.draftCount,
    submitted: stats.submittedCount,
    underReview: stats.reviewCount,
    approved: stats.approvedCount,
    rejected: stats.rejectedCount,
    processed: stats.processedCount,
    paid: stats.paidCount,
    cancelled: stats.cancelledCount,
    recentInvoices,
  };
};

export {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  getInvoiceAuditHistory,
  getAttachment,
  addAttachment,
  deleteAttachment,
  getDashboardStats,
  submitInvoice,
  startReview,
  approveInvoice,
  rejectInvoice,
  processInvoice,
  markInvoicePaid,
  cancelInvoice,
  resubmitRejectedInvoice,
};
