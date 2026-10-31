import { invoiceQuerySchema } from "../validators/invoice.validator.js";
import { getInvoiceReport } from "../services/report.service.js";
import { errorResponse, successResponse } from "../utils/response.js";

const getInvoiceReportData = async (req, res) => {
  const { error, value } = invoiceQuerySchema.validate(req.query);
  if (error) {
    return errorResponse(res, error.details[0].message, 400);
  }

  try {
    const report = await getInvoiceReport({ user: req.user, ...value });
    return successResponse(res, report, "Invoice report fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

export { getInvoiceReportData };
