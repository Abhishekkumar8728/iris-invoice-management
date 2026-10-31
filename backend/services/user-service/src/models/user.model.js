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

    role: {
      type: String,
      enum: [
        "ADMIN",
        "FINANCE",
        "APPROVER",
        "USER",
      ],
      default: "USER",
    },

    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    designation: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    profileImage: {
      type: String,
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
  role: 1,
  isActive: 1,
});

userSchema.index({
  department: 1,
  isActive: 1,
});




userSchema.index({
  createdAt: -1,
});




userSchema.index({
  isActive: 1,
  createdAt: -1,
});

const User = mongoose.model(
  "User",
  userSchema
);

export default User;