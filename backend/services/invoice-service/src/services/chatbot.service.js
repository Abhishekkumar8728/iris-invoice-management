
import * as invoiceService from "./invoice.service.js";

const normalizeMessage = (message = "") => {
  return String(message)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};


const getStatsResponse = (stats) => ({
  type: "stats",
  message: "Here is your invoice summary.",
  data: stats,
});


const getStatusResponse = (stats, status) => {
  const statusMap = {
    draft: ["draftCount", "Draft"],
    submitted: ["submittedCount", "Submitted"],
    "under review": ["reviewCount", "Under review"],
    review: ["reviewCount", "Under review"],
    approved: ["approvedCount", "Approved"],
    rejected: ["rejectedCount", "Rejected"],
    processed: ["processedCount", "Processed"],
    paid: ["paidCount", "Paid"],
    cancelled: ["cancelledCount", "Cancelled"],
  };

  const [key, label] = statusMap[status] || ["totalInvoices", "Invoice"];

  const count = Number(stats[key]) || 0;

  return {
    type: "status-count",
    message: `There are ${count} ${label.toLowerCase()} invoices.`,
    data: {
      status: label,
      count,
    },
  };
};


const getHelpResponse = () => ({
  type: "help",
  message: [
    "I can help you with invoice information.",
    "",
    "You can ask questions like:",
    "• How many invoices are pending?",
    "• How many invoices are approved?",
    "• How many invoices are rejected?",
    "• What is the total invoice value?",
    "• What is the pending invoice value?",
    "• What is the paid invoice value?",
    "• Show me invoice INV-1001",
    "• Show my invoice summary",
  ].join("\n"),
  data: null,
});

const getChatbotResponse = async (message, user) => {
  const normalizedMessage = normalizeMessage(message);

  if (!normalizedMessage) {
    return {
      type: "error",
      message: "Please enter a question.",
      data: null,
    };
  }


  if (
    normalizedMessage.includes("help") ||
    normalizedMessage.includes("what can you do")
  ) {
    return getHelpResponse();
  }


  const getStats = () => invoiceService.getDashboardStats(user);









  if (
    normalizedMessage.includes("pending value") ||
    normalizedMessage.includes("pending amount") ||
    normalizedMessage.includes("pending invoice value") ||
    normalizedMessage.includes("outstanding invoice value") ||
    normalizedMessage.includes("outstanding amount")
  ) {
    const stats = await getStats();
    const pendingValue = Number(stats.pendingValue) || 0;

    return {
      type: "pending-value",
      message: `The pending invoice value is ${formatCurrency(pendingValue)}.`,
      data: { pendingValue },
    };
  }


  if (
    normalizedMessage.includes("paid value") ||
    normalizedMessage.includes("paid amount") ||
    normalizedMessage.includes("paid invoice value") ||
    normalizedMessage.includes("total paid value") ||
    normalizedMessage.includes("value of paid invoices") ||
    normalizedMessage.includes("paid invoices value")
  ) {
    const stats = await getStats();
    const paidValue = Number(stats.paidValue) || 0;

    return {
      type: "paid-value",
      message: `The paid invoice value is ${formatCurrency(paidValue)}.`,
      data: { paidValue },
    };
  }


  if (
    normalizedMessage.includes("total invoice value") ||
    normalizedMessage.includes("total value of invoices") ||
    normalizedMessage.includes("total value") ||
    normalizedMessage.includes("total amount") ||
    normalizedMessage.includes("invoice value") ||
    normalizedMessage.includes("value of all invoices")
  ) {
    const stats = await getStats();
    const totalValue = Number(stats.totalValue) || 0;

    return {
      type: "total-value",
      message: `The total invoice value is ${formatCurrency(totalValue)}.`,
      data: { totalValue },
    };
  }



  if (
    normalizedMessage.includes("pending") ||
    normalizedMessage.includes("outstanding invoices") ||
    normalizedMessage.includes("not paid") ||
    normalizedMessage.includes("unpaid invoices")
  ) {
    const isCountQuestion =
      normalizedMessage.includes("how many") ||
      normalizedMessage.includes("count") ||
      normalizedMessage.includes("number of") ||
      normalizedMessage.includes("quantity") ||
      normalizedMessage.includes("pending invoices");

    if (isCountQuestion) {
      const stats = await getStats();

      const pendingCount = Math.max(
        0,
        (Number(stats.totalInvoices) || 0) -
          (Number(stats.paidCount) || 0) -
          (Number(stats.cancelledCount) || 0)
      );

      return {
        type: "pending-count",
        message: `There are ${pendingCount} pending invoices.`,
        data: { pendingCount },
      };
    }
  }


  const statusQuestions = [
    ["under review", ["under review", "in review"]],
    ["draft", ["draft"]],
    ["submitted", ["submitted"]],
    ["approved", ["approved"]],
    ["rejected", ["rejected"]],
    ["processed", ["processed"]],
    ["paid", ["paid"]],
    ["cancelled", ["cancelled", "canceled"]],
    ["review", ["review"]],
  ];

  const isCountQuestion =
    normalizedMessage.includes("how many") ||
    normalizedMessage.includes("count") ||
    normalizedMessage.includes("number of") ||
    normalizedMessage.includes("quantity");

  if (isCountQuestion) {
    for (const [status, phrases] of statusQuestions) {
      if (phrases.some((phrase) => normalizedMessage.includes(phrase))) {
        const stats = await getStats();
        return getStatusResponse(stats, status);
      }
    }
  }


  if (
    normalizedMessage.includes("summary") ||
    normalizedMessage.includes("dashboard") ||
    normalizedMessage.includes("invoice statistics") ||
    normalizedMessage.includes("invoice stats") ||
    normalizedMessage === "total invoices" ||
    normalizedMessage === "show invoices"
  ) {
    const stats = await getStats();
    return getStatsResponse(stats);
  }


  const invoiceNumberMatch = normalizedMessage.match(
    /\b(?:inv(?:oice)?[-\s]?)?(\d{3,})\b/i
  );

  if (normalizedMessage.includes("invoice") && invoiceNumberMatch) {
    const invoiceNumber = invoiceNumberMatch[1];

    const result = await invoiceService.getInvoices({
      user,
      page: 1,
      limit: 10,
      search: invoiceNumber,
    });

    const invoice = result.invoices?.find((item) =>
      String(item.invoiceNumber)
        .toLowerCase()
        .includes(invoiceNumber.toLowerCase())
    );

    if (!invoice) {
      return {
        type: "invoice-not-found",
        message: `I could not find an invoice matching ${invoiceNumber}.`,
        data: null,
      };
    }

    return {
      type: "invoice",
      message: [
        `Invoice: ${invoice.invoiceNumber}`,
        `Status: ${invoice.status}`,
        `Vendor: ${invoice.vendor?.name || "N/A"}`,
        `PO Number: ${invoice.purchaseOrderNumber || "N/A"}`,
        `Total Amount: ${formatCurrency(
          invoice.amounts?.totalAmount || 0
        )}`,
      ].join("\n"),
      data: invoice,
    };
  }


  return {
    type: "unknown",
    message:
      "I can help with invoice counts, invoice values, statuses, summaries, and specific invoice details. Try asking: 'How many invoices are approved?'",
    data: null,
  };
};

export {
  getChatbotResponse,
};