import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
  path: ".env.test",
  override: true,
});

const TEST_DB_NAME = "iris_auth_test";

if (!process.env.MONGO_URI?.includes(TEST_DB_NAME)) {
  throw new Error(
    `Auth tests must use ${TEST_DB_NAME}. Current MONGO_URI: ${process.env.MONGO_URI}`
  );
}

const connectTestDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
};

const clearTestDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
};

const disconnectTestDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

export {
  connectTestDatabase,
  clearTestDatabase,
  disconnectTestDatabase,
};