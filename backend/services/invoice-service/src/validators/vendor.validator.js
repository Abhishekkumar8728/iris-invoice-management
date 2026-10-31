import Joi from "joi";

const vendorFields = {
  vendorCode: Joi.string().trim().uppercase().min(1).max(100),
  name: Joi.string().trim().min(2).max(200),
  gstin: Joi.string().trim().uppercase().max(20).allow(""),
  email: Joi.string().trim().lowercase().email().max(150).allow(""),
  mobile: Joi.string().trim().max(15).allow(""),
  address: Joi.string().trim().max(500).allow(""),
};

const createVendorSchema = Joi.object({
  ...vendorFields,
  vendorCode: vendorFields.vendorCode.required(),
  name: vendorFields.name.required(),
}).required();

const updateVendorSchema = Joi.object(vendorFields).min(1).required();

const vendorQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow("").optional(),
  status: Joi.string().valid("active", "inactive", "all").default("active"),
});

const vendorCodeSchema = Joi.object({
  vendorCode: Joi.string().trim().uppercase().min(1).max(100).required(),
});

export {
  createVendorSchema,
  updateVendorSchema,
  vendorQuerySchema,
  vendorCodeSchema,
};
