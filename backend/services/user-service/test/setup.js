import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
  path: ".env.test",
  override: true,
});

beforeAll(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is not configured for tests",
    );
  }

  if (!process.env.MONGO_URI.includes("iris_users_test")) {
    throw new Error(
      "Tests must use the iris_users_test database",
    );
  }

  await mongoose.connect(
    process.env.MONGO_URI,
  );

  await mongoose.connection.dropDatabase();
});

afterEach(async () => {
  if (
    mongoose.connection.readyState === 1
  ) {
    const collections =
      mongoose.connection.collections;

    for (const collection of Object.values(
      collections,
    )) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (
    mongoose.connection.readyState === 1
  ) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});