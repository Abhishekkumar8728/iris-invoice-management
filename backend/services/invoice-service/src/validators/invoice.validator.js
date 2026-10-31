import Joi from "joi";

const objectIdSchema =
  Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  });

const attachmentParamsSchema =
  Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),

    attachmentId:
      Joi.string()
        .hex()
        .length(24)
        .required(),
  });

const vendorSchema =
  Joi.object({
    vendorCode:
      Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required(),

    name:
      Joi.string()
        .trim()
        .min(2)
        .max(200)
        .required(),

    gstin:
      Joi.string()
        .trim()
        .max(20)
        .allow("")
        .optional(),

    email:
      Joi.string()
        .trim()
        .lowercase()
        .email()
        .max(150)
        .allow("")
        .optional(),

    mobile:
      Joi.string()
        .pattern(/^[0-9]{10}$/)
        .allow("")
        .optional(),

    address:
      Joi.string()
        .trim()
        .max(500)
        .allow("")
        .optional(),
  });

const itemSchema =
  Joi.object({
    description:
      Joi.string()
        .trim()
        .min(1)
        .max(500)
        .required(),

    quantity:
      Joi.number()
        .positive()
        .max(100000000)
        .required(),

    unitPrice:
      Joi.number()
        .min(0)
        .max(100000000000)
        .required(),

    taxRate:
      Joi.number()
        .min(0)
        .max(100)
        .default(0),
  });

const taxSchema =
  Joi.number()
    .min(0)
    .max(100000000000)
    .default(0);

const createInvoiceSchema =
  Joi.object({
    vendor:
      vendorSchema.required(),

    invoiceDate:
      Joi.date().required(),

    dueDate:
      Joi.date()
        .min(
          Joi.ref(
            "invoiceDate"
          )
        )
        .required(),

    currency:
      Joi.string()
        .trim()
        .uppercase()
        .length(3)
        .default("INR"),

    purchaseOrderNumber:
      Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    poNumber:
      Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    items:
      Joi.array()
        .items(itemSchema)
        .min(1)
        .max(500)
        .required(),

    cgst:
      taxSchema,

    sgst:
      taxSchema,

    igst:
      taxSchema,
  })
  .required();

const updateInvoiceSchema =
  Joi.object({
    vendor:
      vendorSchema.optional(),

    invoiceDate:
      Joi.date().optional(),

    dueDate:
      Joi.date().optional(),

    currency:
      Joi.string()
        .trim()
        .uppercase()
        .length(3)
        .optional(),

    purchaseOrderNumber:
      Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    poNumber:
      Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    items:
      Joi.array()
        .items(itemSchema)
        .min(1)
        .max(500)
        .optional(),

    cgst:
      Joi.number()
        .min(0)
        .max(100000000000)
        .optional(),

    sgst:
      Joi.number()
        .min(0)
        .max(100000000000)
        .optional(),

    igst:
      Joi.number()
        .min(0)
        .max(100000000000)
        .optional(),
  })
  .min(1);

const invoiceQuerySchema =
  Joi.object({
    page:
      Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit:
      Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),

    search:
      Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    status:
      Joi.string()
        .valid(
          "DRAFT",
          "SUBMITTED",
          "UNDER_REVIEW",
          "APPROVED",
          "REJECTED",
          "PROCESSED",
          "PAID",
          "CANCELLED"
        )
        .optional(),

    vendorCode:
      Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    dateFrom:
      Joi.date()
        .iso()
        .optional(),

    dateTo:
      Joi.date()
        .iso()
        .min(
          Joi.ref("dateFrom")
        )
        .optional(),

    minAmount:
      Joi.number()
        .min(0)
        .optional(),

    maxAmount:
      Joi.number()
        .min(
          Joi.ref("minAmount")
        )
        .optional(),
  });

const rejectInvoiceSchema =
  Joi.object({
    reason:
      Joi.string()
        .trim()
        .min(3)
        .max(1000)
        .required(),
  });

const emptyBodySchema =
  Joi.object({});

export {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceQuerySchema,
  rejectInvoiceSchema,
  objectIdSchema,
  attachmentParamsSchema,
  emptyBodySchema,
};