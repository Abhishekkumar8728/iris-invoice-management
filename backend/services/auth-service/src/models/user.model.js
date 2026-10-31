import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 30,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },

    mobile: {
      type: String,
      trim: true,
      maxlength: 15,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["ADMIN", "FINANCE", "APPROVER", "USER"],
      default: "USER",
      index: true,
    },

    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    accountLockedUntil: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);





userSchema.index({
  employeeId: 1,
  isActive: 1,
});

userSchema.index({
  role: 1,
  isActive: 1,
});

userSchema.index({
  department: 1,
  isActive: 1,
});

const User = mongoose.model("User", userSchema);

export default User;