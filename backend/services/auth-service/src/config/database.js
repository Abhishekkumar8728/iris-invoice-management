import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `MongoDB connected: ${mongoose.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDatabase;