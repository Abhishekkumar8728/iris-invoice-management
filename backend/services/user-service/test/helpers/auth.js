import jwt from "jsonwebtoken";

export function createAccessToken({
  id = "test-user-id",
  employeeId = "TEST001",
  role = "USER",
} = {}) {
  return jwt.sign(
    {
      sub: id,
      employeeId,
      role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    },
  );
}

export function authHeader(options = {}) {
  return `Bearer ${createAccessToken(options)}`;
}