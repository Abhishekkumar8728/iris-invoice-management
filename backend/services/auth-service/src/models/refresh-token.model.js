import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    createdByIp: {
      type: String,
      default: null,
    },

    revokedByIp: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);




refreshTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);





refreshTokenSchema.index({
  userId: 1,
  revokedAt: 1,
  expiresAt: 1,
});

const RefreshToken = mongoose.model(
  "RefreshToken",
  refreshTokenSchema
);

export default RefreshToken;