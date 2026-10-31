import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: null,
      index: true,
    },

    identifier: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: [
        "LOGIN",
        "PASSWORD_RESET",
        "EMAIL_VERIFICATION",
        "GENERAL",
      ],
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);




otpSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);




otpSchema.index({
  identifier: 1,
  purpose: 1,
  createdAt: -1,
});




otpSchema.index({
  identifier: 1,
  purpose: 1,
  used: 1,
});

const OTP = mongoose.model(
  "OTP",
  otpSchema
);

export default OTP;