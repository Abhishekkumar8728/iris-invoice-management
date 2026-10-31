import mongoose from "mongoose";

const sequenceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },

    sequence: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Sequence = mongoose.model(
  "Sequence",
  sequenceSchema
);

export default Sequence;