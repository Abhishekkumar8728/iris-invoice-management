import mongoose from "mongoose";

const INVOICE_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PROCESSED: "PROCESSED",
  PAID: "PAID",
  CANCELLED: "CANCELLED"
};

const invoiceItemSchema =
  new mongoose.Schema(
    {
      description: {
        type: String,
        required: true,
        trim: true
      },

      quantity: {
        type: Number,
        required: true,
        min: 0.01
      },

      unitPrice: {
        type: Number,
        required: true,
        min: 0
      },

      taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },

      taxableAmount: {
        type: Number,
        required: true,
        min: 0
      },

      taxAmount: {
        type: Number,
        required: true,
        min: 0
      },

      totalAmount: {
        type: Number,
        required: true,
        min: 0
      }
    },
    {
      _id: true
    }
  );
const auditHistorySchema =
new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },

    fromStatus: {
      type: String,
      default: null
    },

    toStatus: {
      type: String,
      default: null
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    performedByRole: {
      type: String,
      required: true
    },

    comments: {
      type: String,
      trim: true,
      default: null
    },

    ipAddress: {
      type: String,
      default: null
    },

    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);
const vendorSchema =
new mongoose.Schema(
  {
    vendorCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    gstin: {
      type: String,
      trim: true,
      uppercase: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true
    },

    mobile: {
      type: String,
      trim: true
    },

    address: {
      type: String,
      trim: true
    }
  },
  {
    _id: false
  }
);
const attachmentSchema =
new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },

    fileName: {
      type: String,
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    mimeType: {
      type: String,
      required: true
    },

    size: {
      type: Number,
      required: true
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);
const invoiceSchema =
new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    vendor: {
      type: vendorSchema,
      required: true
    },

    invoiceDate: {
      type: Date,
      required: true
    },

    dueDate: {
      type: Date,
      required: true
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true
    },

    purchaseOrderNumber: {
      type: String,
      trim: true
    },

    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator: (items) =>
          items.length > 0,

        message:
          "Invoice must contain at least one item"
      }
    },

    amounts: {
      taxableAmount: {
        type: Number,
        required: true,
        min: 0
      },

      cgst: {
        type: Number,
        default: 0,
        min: 0
      },

      sgst: {
        type: Number,
        default: 0,
        min: 0
      },

      igst: {
        type: Number,
        default: 0,
        min: 0
      },

      totalTax: {
        type: Number,
        default: 0,
        min: 0
      },

      totalAmount: {
        type: Number,
        required: true,
        min: 0
      }
    },

    status: {
      type: String,
      enum: Object.values(
        INVOICE_STATUS
      ),
      default:
        INVOICE_STATUS.DRAFT,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    submittedAt: {
      type: Date,
      default: null
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    rejectedAt: {
      type: Date,
      default: null
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null
    },

    processedAt: {
      type: Date,
      default: null
    },

    paidAt: {
      type: Date,
      default: null
    },

    cancelledAt: {
      type: Date,
      default: null
    },

    attachments: {
      type: [attachmentSchema],
      default: []
    },

    auditHistory: {
      type: [auditHistorySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

invoiceSchema.index({
  "vendor.name": "text",
  invoiceNumber: "text",
  purchaseOrderNumber: "text"
});

invoiceSchema.index({
  status: 1,
  createdAt: -1
});

invoiceSchema.index({
  createdBy: 1,
  createdAt: -1
});



invoiceSchema.index({
  status: 1,
  invoiceDate: -1,
});




invoiceSchema.index({
  "vendor.vendorCode": 1,
  invoiceDate: -1,
});




invoiceSchema.index({
  "amounts.totalAmount": 1,
});




invoiceSchema.index({
  createdBy: 1,
  status: 1,
  createdAt: -1,
});




invoiceSchema.index({
  createdAt: -1,
  status: 1,
});

const Invoice = mongoose.model(
  "Invoice",
  invoiceSchema
);

export {
  Invoice,
  INVOICE_STATUS
};