import * as invoiceService from "../services/invoice.service.js";
import {createInvoiceSchema, updateInvoiceSchema, invoiceQuerySchema} from "../validators/invoice.validator.js";
import {successResponse, errorResponse} from "../utils/response.js";
import fs from "fs";
import {
  validateUploadedFile,
  safeDeleteFile,
} from "../utils/file-security.js";

const createInvoice =
  async (req, res) => {
    try {
      const {
        error,
        value
      } =
        createInvoiceSchema.validate(
          req.body
        );

      if (error) {
        return errorResponse(
          res,
          error.details[0].message,
          400
        );
      }

      const invoice =
        await invoiceService.createInvoice(
          value,
          req.user
        );

      return successResponse(
        res,
        invoice,
        "Invoice created successfully",
        201
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };

const getInvoices =
  async (req, res) => {
    try {
      const queryValidation =
        invoiceQuerySchema.validate(req.query);

      if (queryValidation.error) {
        return errorResponse(
          res,
          queryValidation.error.details[0].message,
          400
        );
      }

      const result =
        await invoiceService.getInvoices({
          user: req.user,
          ...queryValidation.value
        });

      return successResponse(
        res,
        result,
        "Invoices fetched successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 500
      );
    }
  };

const getInvoiceById =
  async (req, res) => {
    try {
      const invoice =
        await invoiceService.getInvoiceById(
          req.params.id,
          req.user
        );

      return successResponse(
        res,
        invoice,
        "Invoice fetched successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 404
      );
    }
  };

const updateInvoice =
  async (req, res) => {
    try {
      const {
        error,
        value
      } =
        updateInvoiceSchema.validate(
          req.body
        );

      if (error) {
        return errorResponse(
          res,
          error.details[0].message,
          400
        );
      }

      const invoice =
        await invoiceService.updateInvoice(
          req.params.id,
          value,
          req.user,
          req.ip
        );

      return successResponse(
        res,
        invoice,
        "Invoice updated successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };

const submitInvoice =
  async (req, res) => {
    try {
      const invoice =
        await invoiceService.submitInvoice(
          req.params.id,
          req.user,
          req.ip
        );

      return successResponse(
        res,
        invoice,
        "Invoice submitted successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };

const startReview =
  async (req, res) => {
    try {
      const invoice =
        await invoiceService.startReview(
          req.params.id,
          req.user,
          req.ip
        );

      return successResponse(
        res,
        invoice,
        "Invoice moved to review"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };

const approveInvoice =
  async (req, res) => {
    try {
      const invoice =
        await invoiceService.approveInvoice(
          req.params.id,
          req.user,
          req.ip
        );

      return successResponse(
        res,
        invoice,
        "Invoice approved successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };

const rejectInvoice =
  async (req, res) => {
    try {
      const invoice =
        await invoiceService.rejectInvoice(
          req.params.id,
          req.body.reason,
          req.user,
          req.ip
        );

      return successResponse(
        res,
        invoice,
        "Invoice rejected successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };

const processInvoice =
  async (req, res) => {
    try {
      const invoice =
        await invoiceService.processInvoice(
          req.params.id,
          req.user,
          req.ip
        );

      return successResponse(
        res,
        invoice,
        "Invoice processed successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };

const markInvoicePaid =
  async (req, res) => {
    try {
      const invoice =
        await invoiceService.markInvoicePaid(
          req.params.id,
          req.user,
          req.ip
        );

      return successResponse(
        res,
        invoice,
        "Invoice marked as paid"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };

const cancelInvoice =
  async (req, res) => {
    try {
      const invoice =
        await invoiceService.cancelInvoice(
          req.params.id,
          req.user,
          req.ip
        );

      return successResponse(
        res,
        invoice,
        "Invoice cancelled successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };

const resubmitRejectedInvoice =
  async (req, res) => {
    try {
      const invoice =
        await invoiceService.resubmitRejectedInvoice(
          req.params.id,
          req.user,
          req.ip
        );

      return successResponse(
        res,
        invoice,
        "Invoice returned to draft"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        error.statusCode || 400
      );
    }
  };
const getDashboardStats =
async (
  req,
  res
) => {
  try {
    const stats =
      await invoiceService.getDashboardStats(
        req.user
      );

    return successResponse(
      res,
      stats,
      "Dashboard statistics fetched successfully"
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      error.statusCode || 500
    );
  }
};
const getInvoiceAuditHistory =
async (
  req,
  res
) => {
  try {
    const history =
      await invoiceService.getInvoiceAuditHistory(
        req.params.id,
        req.user
      );

    return successResponse(
      res,
      history,
      "Invoice audit history fetched successfully"
    );
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return errorResponse(
      res,
      error.message,
      error.statusCode || 404
    );
  }
};
const addAttachment = async (req, res, next) => {
  const uploadedFiles = [];

  try {
    const files = [
      ...(req.files?.file || []),
      ...(req.files?.attachments || []),
    ];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "At least one attachment is required",
      });
    }

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 attachments are allowed",
      });
    }

    let invoice;

    for (const file of files) {
      await validateUploadedFile(file);

      uploadedFiles.push(file.path);

      invoice = await invoiceService.addAttachment(
        req.params.id,
        file,
        req.user,
        req.ip
      );
    }

    return successResponse(
      res,
      invoice,
      "Attachment(s) uploaded successfully"
    );
  } catch (error) {
    next(error);
  }
};
const deleteAttachment =
async (
  req,
  res
) => {
  try {
    const invoice =
      await invoiceService.deleteAttachment(
        req.params.id,
        req.params.attachmentId,
        req.user,
        req.ip
      );

    return successResponse(
      res,
      invoice,
      "Attachment deleted successfully"
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      error.statusCode || 400
    );
  }
};

const downloadAttachment =
async (
  req,
  res
) => {
  try {
    const attachment =
      await invoiceService.getAttachment(
        req.params.id,
        req.params.attachmentId,
        req.user
      );

    return res.download(
      attachment.filePath,
      attachment.originalName
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      error.statusCode || 404
    );
  }
};

export {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  addAttachment,
  deleteAttachment,
  downloadAttachment,
  submitInvoice,
  startReview,
  approveInvoice,
  rejectInvoice,
  resubmitRejectedInvoice,
  processInvoice,
  markInvoicePaid,
  cancelInvoice,
  getDashboardStats,
  getInvoiceAuditHistory,
};