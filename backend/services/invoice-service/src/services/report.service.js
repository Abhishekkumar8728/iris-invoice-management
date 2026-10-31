import mongoose from "mongoose";
import { Invoice, INVOICE_STATUS } from "../models/invoice.model.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const financeRoles = ["ADMIN", "FINANCE", "APPROVER"];

const getInvoiceReport = async ({ user, page, limit, search, status, vendorCode, dateFrom, dateTo, minAmount, maxAmount }) => {
  const filter = {};

  if (!financeRoles.includes(user.role)) {
    if (!mongoose.Types.ObjectId.isValid(user.id)) {
      const error = new Error("Invalid user ID");
      error.statusCode = 400;
      throw error;
    }
    filter.createdBy = new mongoose.Types.ObjectId(user.id);
  }

  if (status) filter.status = status;
  if (vendorCode) filter["vendor.vendorCode"] = vendorCode.toUpperCase();

  if (search) {
    const expression = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { invoiceNumber: expression },
      { purchaseOrderNumber: expression },
      { "vendor.name": expression },
      { "vendor.vendorCode": expression },
    ];
  }

  if (dateFrom || dateTo) {
    filter.invoiceDate = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setUTCHours(0, 0, 0, 0);
      filter.invoiceDate.$gte = from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setUTCHours(23, 59, 59, 999);
      filter.invoiceDate.$lte = to;
    }
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    filter["amounts.totalAmount"] = {};
    if (minAmount !== undefined) filter["amounts.totalAmount"].$gte = Number(minAmount);
    if (maxAmount !== undefined) filter["amounts.totalAmount"].$lte = Number(maxAmount);
  }

  const [invoices, total, [summary = {}]] = await Promise.all([
    Invoice.find(filter)
      .sort({ invoiceDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter),
    Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$amounts.totalAmount" },
          paidValue: {
            $sum: {
              $cond: [
                { $eq: ["$status", INVOICE_STATUS.PAID] },
                "$amounts.totalAmount",
                0,
              ],
            },
          },
          draftCount: {
            $sum: { $cond: [{ $eq: ["$status", INVOICE_STATUS.DRAFT] }, 1, 0] },
          },
          submittedCount: {
            $sum: { $cond: [{ $eq: ["$status", INVOICE_STATUS.SUBMITTED] }, 1, 0] },
          },
          underReviewCount: {
            $sum: { $cond: [{ $eq: ["$status", INVOICE_STATUS.UNDER_REVIEW] }, 1, 0] },
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$status", INVOICE_STATUS.APPROVED] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$status", INVOICE_STATUS.REJECTED] }, 1, 0] },
          },
          processedCount: {
            $sum: { $cond: [{ $eq: ["$status", INVOICE_STATUS.PROCESSED] }, 1, 0] },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", INVOICE_STATUS.PAID] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ["$status", INVOICE_STATUS.CANCELLED] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  return {
    invoices,
    summary: {
      totalInvoices: total,
      totalValue: summary.totalValue || 0,
      paidValue: summary.paidValue || 0,
      pendingValue: Number(((summary.totalValue || 0) - (summary.paidValue || 0)).toFixed(2)),
      statusCounts: {
        DRAFT: summary.draftCount || 0,
        SUBMITTED: summary.submittedCount || 0,
        UNDER_REVIEW: summary.underReviewCount || 0,
        APPROVED: summary.approvedCount || 0,
        REJECTED: summary.rejectedCount || 0,
        PROCESSED: summary.processedCount || 0,
        PAID: summary.paidCount || 0,
        CANCELLED: summary.cancelledCount || 0,
      },
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export { getInvoiceReport };
