import "dotenv/config";

import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User from "../models/user.model.js";

const required = [
  "MONGO_URI",
  "BOOTSTRAP_ADMIN_EMPLOYEE_ID",
  "BOOTSTRAP_ADMIN_NAME",
  "BOOTSTRAP_ADMIN_EMAIL",
  "BOOTSTRAP_ADMIN_PASSWORD"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }
}

if (
  process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 12
) {
  throw new Error(
    "Bootstrap admin password must contain at least 12 characters."
  );
}

await mongoose.connect(
  process.env.MONGO_URI
);

try {

  const existing =
    await User.findOne({
      $or: [
        {
          employeeId:
            process.env.BOOTSTRAP_ADMIN_EMPLOYEE_ID
        },
        {
          email:
            process.env.BOOTSTRAP_ADMIN_EMAIL
              .toLowerCase()
        }
      ]
    });

  if (existing) {

    console.log(
      "Admin account already exists."
    );

    process.exit(0);
  }

  const passwordHash =
    await bcrypt.hash(
      process.env.BOOTSTRAP_ADMIN_PASSWORD,
      12
    );

  await User.create({
    employeeId:
      process.env.BOOTSTRAP_ADMIN_EMPLOYEE_ID,

    name:
      process.env.BOOTSTRAP_ADMIN_NAME,

    email:
      process.env.BOOTSTRAP_ADMIN_EMAIL
        .toLowerCase(),

    passwordHash,

    role: "ADMIN",

    isActive: true
  });

  console.log(
    "Initial admin account created successfully."
  );

} finally {

  await mongoose.disconnect();

}