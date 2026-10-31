import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import RefreshToken from "../models/refresh-token.model.js";

import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/token.js";

import { createUserProfile } from "./user-client.service.js";
import { sendOtp, verifyOtp } from "./notification-client.service.js";

const createConflictError = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};
const login = async (
  identifier,
  password,
  ipAddress
) => {
  const user = await User.findOne({
    $or: [
      {
        email: identifier.toLowerCase(),
      },
      {
        employeeId: identifier.toUpperCase(),
      },
    ],
  }).select("+password");

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  if (
    user.accountLockedUntil &&
    user.accountLockedUntil > new Date()
  ) {
    throw new Error("Account temporarily locked");
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordValid) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= 5) {
      user.accountLockedUntil = new Date(
        Date.now() + 15 * 60 * 1000
      );

      user.failedLoginAttempts = 0;
    }

    await user.save();

    throw new Error("Invalid credentials");
  }

  user.failedLoginAttempts = 0;
  user.accountLockedUntil = null;
  user.lastLoginAt = new Date();

  await user.save();

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user);

  const refreshTokenPayload = jwt.decode(
    refreshToken
  );

  await RefreshToken.create({
    userId: user._id,

    tokenHash: hashToken(refreshToken),

    expiresAt: new Date(
      refreshTokenPayload.exp * 1000
    ),

    createdByIp: ipAddress || null,
  });

  return {
    accessToken,
    refreshToken,

    user: {
      id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      department: user.department,
    },
  };
};
const refreshAccessToken = async (
  refreshToken,
  ipAddress
) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  let decoded;

  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch (error) {
    throw new Error(
      "Invalid or expired refresh token"
    );
  }

  if (decoded.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await RefreshToken.findOne({
    tokenHash,
  });

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  if (storedToken.revokedAt) {
    await RefreshToken.updateMany(
      {
        userId: storedToken.userId,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          revokedByIp: ipAddress || null,
        },
      }
    );

    throw new Error("Refresh token reuse detected");
  }

  if (storedToken.expiresAt <= new Date()) {
    throw new Error(
      "Refresh token has expired"
    );
  }

  const user = await User.findById(decoded.sub);

  if (!user || !user.isActive) {
    throw new Error(
      "User account is unavailable"
    );
  }

  storedToken.revokedAt = new Date();
  storedToken.revokedByIp = ipAddress || null;

  await storedToken.save();

  const newAccessToken =
    generateAccessToken(user);

  const newRefreshToken =
    generateRefreshToken(user);

  const newRefreshPayload =
    jwt.decode(newRefreshToken);

  await RefreshToken.create({
    userId: user._id,

    tokenHash: hashToken(newRefreshToken),

    expiresAt: new Date(
      newRefreshPayload.exp * 1000
    ),

    createdByIp: ipAddress || null,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};
const forgotPassword = async ({
  email,
  requestId,
}) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    return {
      message:
        "If the account exists, an OTP has been sent.",
    };
  }

  if (!user.isActive) {
    return {
      message:
        "If the account exists, an OTP has been sent.",
    };
  }

  await sendOtp({
    userId: user._id.toString(),
    email: user.email,
    purpose: "PASSWORD_RESET",
    requestId,
  });

  return {
    message:
      "If the account exists, an OTP has been sent.",
  };
};
const resetPassword = async ({
  email,
  otp,
  newPassword,
  requestId,
}) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  if (!user) {
    throw new Error(
      "Invalid password reset request"
    );
  }

  await verifyOtp({
    email: user.email,
    purpose: "PASSWORD_RESET",
    otp,
    requestId,
  });

  const saltRounds = Number(
    process.env.BCRYPT_SALT_ROUNDS || 12
  );

  user.password = await bcrypt.hash(
    newPassword,
    saltRounds
  );

  user.failedLoginAttempts = 0;
  user.accountLockedUntil = null;

  await user.save();

  await RefreshToken.updateMany(
    {
      userId: user._id,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    }
  );

  return {
    message: "Password reset successfully",
  };
};
const logout = async (
  refreshToken,
  ipAddress
) => {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashToken(refreshToken);

  await RefreshToken.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null,
    },
    {
      revokedAt: new Date(),
      revokedByIp: ipAddress || null,
    }
  );
};
const register = async (
  payload,
  requestId
) => {
  const employeeId =
    payload.employeeId.toUpperCase();

  const email =
    payload.email.toLowerCase();

  const existingUser = await User.findOne({
    $or: [
      {
        email,
      },
      {
        employeeId,
      },
    ],
  });

  if (existingUser) {
  throw createConflictError(
    "User with email or employee ID already exists"
  );
}

  const hashedPassword =
    await bcrypt.hash(
      payload.password,
      Number(
        process.env.BCRYPT_SALT_ROUNDS || 12
      )
    );

  const user = await User.create({
    employeeId,

    name: payload.name.trim(),

    email,

    mobile: payload.mobile || null,

    password: hashedPassword,

    role: payload.role || "USER",

    department:
      payload.department || null,
  });

  try {
    await createUserProfile({
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      department: user.department,
      requestId,
    });
  } catch (error) {
    await User.findByIdAndDelete(
      user._id
    );

    console.error(
      "User profile creation failed:",
      error.message
    );

    throw new Error(
      "Unable to create user profile"
    );
  }

  return {
    id: user._id,

    employeeId: user.employeeId,

    name: user.name,

    email: user.email,

    role: user.role,
  };
};
const bootstrapAdmin = async (
  payload,
  requestId
) => {
  if (
    process.env.ADMIN_BOOTSTRAP_ENABLED !==
    "true"
  ) {
    throw new Error(
      "Admin bootstrap is disabled"
    );
  }

  if (!process.env.ADMIN_BOOTSTRAP_KEY) {
    throw new Error(
      "Admin bootstrap key is not configured"
    );
  }

  if (
    payload.bootstrapKey !==
    process.env.ADMIN_BOOTSTRAP_KEY
  ) {
    throw new Error(
      "Invalid admin bootstrap key"
    );
  }

  const existingAdmin = await User.findOne({
    role: "ADMIN",
  });

  if (existingAdmin) {
    throw new Error(
      "An admin user already exists"
    );
  }

  const employeeId =
    payload.employeeId.toUpperCase();

  const email =
    payload.email.toLowerCase();

  const existingUser = await User.findOne({
    $or: [
      {
        email,
      },
      {
        employeeId,
      },
    ],
  });

  if (existingUser) {
  const error = new Error(
    "User with email or employee ID already exists"
  );

  error.statusCode = 400;

  throw error;
}

  const hashedPassword =
    await bcrypt.hash(
      payload.password,
      Number(
        process.env.BCRYPT_SALT_ROUNDS || 12
      )
    );

  const user = await User.create({
    employeeId,

    name: payload.name.trim(),

    email,

    mobile: payload.mobile || null,

    password: hashedPassword,

    role: "ADMIN",

    department:
      payload.department || null,
  });

  try {
    await createUserProfile({
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      department: user.department,
      requestId,
    });
  } catch (error) {
    await User.findByIdAndDelete(
      user._id
    );

    console.error(
      "Admin profile creation failed:",
      error.message
    );

    throw new Error(
      "Unable to create admin profile"
    );
  }

  return {
    id: user._id,

    employeeId: user.employeeId,

    name: user.name,

    email: user.email,

    role: user.role,

    department: user.department,
  };
};

const createAdminUser = async (
  payload,
  requestingUser,
  requestId
) => {

  if (requestingUser?.role !== "ADMIN") {
    const error = new Error(
      "Only administrators can create users"
    );

    error.statusCode = 403;
    throw error;
  }


  const employeeId = payload.employeeId
    .trim()
    .toUpperCase();

  const email = payload.email
    .trim()
    .toLowerCase();


  const existingUser = await User.findOne({
    $or: [
      { email },
      { employeeId },
    ],
  });

  if (existingUser) {
    const error = new Error(
      "User with email or employee ID already exists"
    );

    error.statusCode = 409;
    throw error;
  }


  const saltRounds = Number(
    process.env.BCRYPT_SALT_ROUNDS || 12
  );

  const hashedPassword = await bcrypt.hash(
    payload.password,
    saltRounds
  );


  const user = await User.create({
    employeeId,
    name: payload.name.trim(),
    email,
    mobile: payload.mobile || null,
    password: hashedPassword,
    role: payload.role,
    department: payload.department || null,
    isActive: payload.isActive !== false,
  });


  try {
    await createUserProfile({
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      department: user.department,
      designation: payload.designation || null,
      requestId,
    });
  } catch (error) {

    await User.findByIdAndDelete(user._id);

    console.error(
      "Admin-created user profile failed:",
      error.message
    );

    const profileError = new Error(
      "Unable to create user profile"
    );

    profileError.statusCode = 502;
    throw profileError;
  }


  return {
    id: user._id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    department: user.department,
    isActive: user.isActive,
  };
};
export {
  login,
  register,
  bootstrapAdmin,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  createAdminUser,
};