import Joi from "joi";

const employeeIdSchema =
  Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z0-9_-]+$/)
    .required();

const nameSchema =
  Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required();

const emailSchema =
  Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(150)
    .required();

const mobileSchema =
  Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("", null)
    .optional();

const roleSchema =
  Joi.string().valid(
    "ADMIN",
    "FINANCE",
    "APPROVER",
    "USER"
  );

const createUserSchema =
  Joi.object({
    employeeId:
      employeeIdSchema,

    name:
      nameSchema,

    email:
      emailSchema,

    mobile:
      mobileSchema,

    role:
      roleSchema.default("USER"),

    department:
      Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .optional(),

    designation:
      Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .optional(),

    isActive:
      Joi.boolean()
        .default(true)
        .optional(),
  })
  .required();

const updateUserSchema =
  Joi.object({
    name:
      Joi.string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

    email:
      Joi.string()
        .trim()
        .lowercase()
        .email()
        .max(150)
        .optional(),

    mobile:
      mobileSchema,

    role:
      roleSchema.optional(),

    department:
      Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .optional(),

    designation:
      Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .optional(),

    isActive:
      Joi.boolean()
        .optional(),
  })
  .min(1);

const userQuerySchema =
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

    role:
      roleSchema.optional(),

    department:
      Joi.string()
        .trim()
        .max(100)
        .allow("")
        .optional(),

    status:
      Joi.string()
        .valid(
          "active",
          "inactive"
        )
        .optional(),

    isActive:
      Joi.boolean()
        .optional(),
  });

const objectIdSchema =
  Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  });

const employeeIdParamSchema =
  Joi.object({
    employeeId:
      Joi.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(
          /^[A-Za-z0-9_-]+$/
        )
        .required(),
  });

export {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  objectIdSchema,
  employeeIdParamSchema,
};