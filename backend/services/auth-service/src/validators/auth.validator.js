import Joi from "joi";

const loginSchema = Joi.object({
  identifier: Joi.string().trim().optional(),

  email: Joi.string().email().optional(),

  password: Joi.string().min(8).max(100).required(),
}).or("identifier", "email");

const registerSchema = Joi.object({
  employeeId: Joi.string().trim().required(),

  name: Joi.string().trim().min(2).max(100).required(),

  email: Joi.string().email().required(),

  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),

  password: Joi.string().min(8).max(100).required(),

  role: Joi.string()
    .valid("ADMIN", "FINANCE", "APPROVER", "USER")
    .default("USER"),

  department: Joi.string().trim().max(100).optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifyResetOtpSchema = Joi.object({
  email: Joi.string().email().required(),

  otp: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required(),
});

const bootstrapAdminSchema = Joi.object({
  employeeId: Joi.string()
    .trim()
    .required(),

  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  email: Joi.string()
    .email()
    .required(),

  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),

  password: Joi.string()
    .min(8)
    .max(100)
    .required(),

  department: Joi.string()
    .trim()
    .max(100)
    .optional(),

  bootstrapKey: Joi.string()
    .min(16)
    .required(),
});

const createAdminUserSchema = Joi.object({
  employeeId: Joi.string().trim().min(2).max(50).required(),
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  password: Joi.string().min(8).max(100).required(),
  role: Joi.string().valid('ADMIN', 'FINANCE', 'APPROVER', 'USER').required(),
  department: Joi.string().trim().max(100).optional(),
  designation: Joi.string().trim().max(100).optional(),
  isActive: Joi.boolean().optional(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),

  otp: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required(),

  newPassword: Joi.string().min(8).max(128).required(),
});

export {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  bootstrapAdminSchema,
  createAdminUserSchema,
};
