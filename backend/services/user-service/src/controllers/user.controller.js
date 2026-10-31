import * as userService from "../services/user.service.js";
import {successResponse, errorResponse} from "../utils/response.js";
import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator.js";

const createUser =
  async (
    req,
    res
  ) => {
    try {
      const {
        error,
        value
      } =
        createUserSchema.validate(
          req.body
        );

      if (error) {
        return errorResponse(
          res,
          error.details[0].message,
          400
        );
      }

      const user =
        await userService.createUser(
          value
        );

      return successResponse(
        res,
        user,
        "User created successfully",
        201
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        400
      );
    }
  };

const getUsers =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await userService.getUsers(
          req.query
        );

      return successResponse(
        res,
        result,
        "Users fetched successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        500
      );
    }
  };

const getUserById =
  async (
    req,
    res
  ) => {
    try {
      const user =
        await userService.getUserById(
          req.params.id
        );

      return successResponse(
        res,
        user,
        "User fetched successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        404
      );
    }
  };

const getMyProfile =
  async (
    req,
    res
  ) => {
    try {
      const user =
        await userService.getUserByEmployeeId(
          req.user.employeeId
        );

      return successResponse(
        res,
        user,
        "Profile fetched successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        404
      );
    }
  };

const updateUser =
  async (
    req,
    res
  ) => {
    try {
      const {
        error,
        value
      } =
        updateUserSchema.validate(
          req.body
        );

      if (error) {
        return errorResponse(
          res,
          error.details[0].message,
          400
        );
      }

      const user =
        await userService.updateUser(
          req.params.id,
          value
        );

      return successResponse(
        res,
        user,
        "User updated successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        400
      );
    }
  };

const activateUser =
  async (
    req,
    res
  ) => {
    try {
      const user =
        await userService.updateUserStatus(
          req.params.id,
          true
        );

      return successResponse(
        res,
        user,
        "User activated successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        404
      );
    }
  };

const deactivateUser =
  async (
    req,
    res
  ) => {
    try {
      const user =
        await userService.updateUserStatus(
          req.params.id,
          false
        );

      return successResponse(
        res,
        user,
        "User deactivated successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        404
      );
    }
  };

const deleteUser =
  async (
    req,
    res
  ) => {
    try {
      await userService.deleteUser(
        req.params.id
      );

      return successResponse(
        res,
        null,
        "User deleted successfully"
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message,
        404
      );
    }
  };

export {
  createUser,
  getUsers,
  getUserById,
  getMyProfile,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser
};