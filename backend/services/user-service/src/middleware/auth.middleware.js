import jwt from "jsonwebtoken";

const authenticate = (
  req,
  res,
  next
) => {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message:
          "Authorization header is required"
      });
    }

    const [scheme, token] =
      authorization.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format"
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET
      );

    req.user = {
      id: decoded.sub,
      employeeId:
        decoded.employeeId,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired access token"
    });
  }
};

const authorize = (...roles) => {
  return (
    req,
    res,
    next
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required"
      });
    }

    if (
      !roles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    next();
  };
};

export {
  authenticate,
  authorize
};