import jwt from "jsonwebtoken";

const publicRoutes = [
  "/health",

  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/bootstrap-admin",
  "/api/v1/auth/refresh",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/logout",
];

const isPublicRoute = (path) => {
  return publicRoutes.includes(path);
};

const authenticateGateway = (req, res, next) => {
  try {
    if (isPublicRoute(req.path)) {
      return next();
    }

    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is required",
      });
    }

    const parts = authorization.trim().split(/\s+/);

    if (parts.length !== 2) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const [scheme, token] = parts;

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );
    if (
  !decoded?.sub ||
  !decoded?.employeeId ||
  !decoded?.role
) {
  return res.status(401).json({
    success: false,
    message: "Invalid access token",
  });
}







    req.user = {
      sub: decoded.sub,
      employeeId: decoded.employeeId,
      role: decoded.role,
    };





    req.headers["x-user-id"] = decoded.sub;
    req.headers["x-employee-id"] = decoded.employeeId;
    req.headers["x-user-role"] = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};

export default authenticateGateway;