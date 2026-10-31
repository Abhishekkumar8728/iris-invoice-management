import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    type: {
      type: String,
      enum: [
        "OTP",
        "PASSWORD_RESET",
        "INVOICE_SUBMITTED",
        "INVOICE_APPROVED",
        "INVOICE_REJECTED",
        "INVOICE_PROCESSED",
        "INVOICE_PAID",
        "GENERAL",
      ],
      required: true,
    },

    channel: {
      type: String,
      enum: [
        "EMAIL",
        "SMS",
        "IN_APP",
      ],
      required: true,
      default: "EMAIL",
    },

    recipient: {
      type: String,
      default: "",
      trim: true,
      maxlength: 255,
    },

    subject: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    template: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: [
        "QUEUED",
        "SENT",
        "FAILED",
      ],
      default: "QUEUED",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    errorMessage: {
      type: String,
      maxlength: 2000,
    },

    relatedEntity: {
      entityType: {
        type: String,
        trim: true,
      },

      entityId: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);




notificationSchema.index({
  userId: 1,
  createdAt: -1,
});




notificationSchema.index({
  userId: 1,
  isRead: 1,
  createdAt: -1,
});




notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});




notificationSchema.index({
  "relatedEntity.entityId": 1,
  createdAt: -1,
});




notificationSchema.index({
  status: 1,
  createdAt: 1,
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;