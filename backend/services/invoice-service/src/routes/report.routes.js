import express from "express";
import { getInvoiceReportData } from "../controllers/report.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);
router.get("/invoices", getInvoiceReportData);

export default router;
