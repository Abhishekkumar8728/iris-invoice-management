import Joi from "joi";

const notificationIdSchema =
  Joi.object({
    id:
      Joi.string()
        .hex()
        .length(24)
        .required(),
  });

const notificationQuerySchema =
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
        .default(20),

    recipient:
      Joi.string()
        .email()
        .allow("")
        .optional(),
  });

const sendNotificationSchema =
  Joi.object({
    userId:
      Joi.string()
        .hex()
        .length(24)
        .allow(null, "")
        .optional(),

    type:
      Joi.string()
        .valid(
          "OTP",
          "PASSWORD_RESET",
          "INVOICE_SUBMITTED",
          "INVOICE_APPROVED",
          "INVOICE_REJECTED",
          "INVOICE_PROCESSED",
          "INVOICE_PAID",
          "GENERAL"
        )
        .required(),

    channel:
      Joi.string()
        .valid("EMAIL")
        .default("EMAIL"),

    recipient:
      Joi.string()
        .email()
        .allow("", null)
        .optional(),

    subject:
      Joi.string()
        .trim()
        .max(200)
        .allow("", null)
        .optional(),

    message:
      Joi.string()
        .trim()
        .max(5000)
        .allow("", null)
        .optional(),

    template:
      Joi.string()
        .trim()
        .max(100)
        .allow("", null)
        .optional(),

    payload:
      Joi.object()
        .default({}),

    relatedEntity:
      Joi.object({
        entityType:
          Joi.string()
            .trim()
            .max(100)
            .required(),

        entityId:
          Joi.string()
            .trim()
            .max(100)
            .required(),
      })
        .allow(null)
        .optional(),
  })
  .or(
    "userId",
    "recipient"
  );

const sendOtpSchema =
  Joi.object({
    userId:
      Joi.string()
        .hex()
        .length(24)
        .allow("", null)
        .optional(),

    identifier:
      Joi.string()
        .email()
        .required(),

    purpose:
      Joi.string()
        .valid(
          "LOGIN",
          "PASSWORD_RESET",
          "EMAIL_VERIFICATION",
          "GENERAL"
        )
        .required(),
  });

const verifyOtpSchema =
  Joi.object({
    identifier:
      Joi.string()
        .email()
        .required(),

    purpose:
      Joi.string()
        .valid(
          "LOGIN",
          "PASSWORD_RESET",
          "EMAIL_VERIFICATION",
          "GENERAL"
        )
        .required(),

    otp:
      Joi.string()
        .pattern(
          /^[0-9]{6}$/
        )
        .required(),
  });

export {
  sendNotificationSchema,
  sendOtpSchema,
  verifyOtpSchema,
  notificationQuerySchema,
  notificationIdSchema,
};