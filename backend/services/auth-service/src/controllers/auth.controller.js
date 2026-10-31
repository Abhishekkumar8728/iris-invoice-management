import * as authService from "../services/auth.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  bootstrapAdminSchema,
  createAdminUserSchema,
} from "../validators/auth.validator.js";

const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const result = await authService.login(
      value.identifier || value.email,
      value.password,
      req.ip
    );

    return successResponse(res, result, "Login successful");
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const user = await authService.register(value, req.requestId);

    return successResponse(res, user, "User registered successfully", 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const bootstrapAdmin = async (req, res, next) => {
  try {
    const { error, value } = bootstrapAdminSchema.validate(req.body);

    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    if (
      process.env.NODE_ENV === "production" &&
      process.env.ADMIN_BOOTSTRAP_ENABLED !== "true"
    ) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    const result = await authService.bootstrapAdmin(value, req.requestId);

    return successResponse(res, result, "Admin bootstrapped successfully", 201);
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

const refresh = async (req, res) => {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);

    if (error) {
      return errorResponse(res, error.details[0].message, 400);
    }

    const result = await authService.refreshAccessToken(value.refreshToken, req.ip);

    return successResponse(res, result, "Token refreshed successfully");
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

const createAdminUser = async (req, res, next) => {
  try {
    const { error, value } =
      createAdminUserSchema.validate(req.body);

    if (error) {
      return errorResponse(
        res,
        error.details[0].message,
        400
      );
    }

    const result = await authService.createAdminUser(
      value,
      req.user,
      req.requestId
    );

    return successResponse(
      res,
      result,
      "User created successfully.",
      201
    );
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken, req.ip);

    return successResponse(res, null, "Logout successful");
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const forgotPasswordController = async (req, res, next) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details,
      });
    }

    const result = await authService.forgotPassword({
      email: value.email,
      requestId: req.headers["x-request-id"],
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details,
      });
    }

    const result = await authService.resetPassword({
      ...value,
      requestId: req.headers["x-request-id"],
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export {
  login,
  register,
  bootstrapAdmin,
  refresh,
  logout,
  forgotPasswordController,
  resetPasswordController,
  createAdminUser,
};
