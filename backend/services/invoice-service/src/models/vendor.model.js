import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    vendorCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 20,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
      default: "",
    },
    mobile: {
      type: String,
      trim: true,
      maxlength: 15,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

vendorSchema.index({ name: "text", vendorCode: "text" });

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
