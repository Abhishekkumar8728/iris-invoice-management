import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      jti: crypto.randomUUID(),
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m"
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      type: "refresh",
      jti: crypto.randomUUID(),
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d"
    }
  );
};

const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export {
  generateAccessToken,
  generateRefreshToken,
  hashToken
};