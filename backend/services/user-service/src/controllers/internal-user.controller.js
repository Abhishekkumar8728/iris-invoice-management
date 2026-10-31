import User from "../models/user.model.js";
import { deleteInternalUser as deleteInternalUserService } from "../services/user.service.js";

const createInternalUser = async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is required",
      });
    }

    const { employeeId, name, email, mobile, role, department, designation } =
      req.body;

    if (!employeeId || !name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "employeeId, name, email and role are required",
      });
    }

    const normalizedEmployeeId = employeeId.trim().toUpperCase();

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      employeeId: normalizedEmployeeId,
    });

    const emailOwner = await User.findOne({
      email: normalizedEmail,
    });

    if (
      emailOwner &&
      (!existingUser ||
        emailOwner._id.toString() !== existingUser._id.toString())
    ) {
      return res.status(409).json({
        success: false,
        message: "Email is already assigned to another employee ID",
      });
    }

    const profile = {
      employeeId: normalizedEmployeeId,
      name: name.trim(),
      email: normalizedEmail,
      mobile: mobile || null,
      role,
      department: department || null,
      designation: designation || null,
      isActive: true,
    };

    if (existingUser) {
      const user = await User.findByIdAndUpdate(existingUser._id, profile, {
        returnDocument: "after",
        runValidators: true,
      });

      return res.status(200).json({
        success: true,
        message: "User profile synchronized",
        data: user,
      });
    }

    const user = await User.create(profile);

    return res.status(201).json({
      success: true,
      message: "User profile created",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getUserByEmployeeId = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId.trim().toUpperCase();

    const user = await User.findOne({
      employeeId,
    }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInternalUser = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const result = await deleteInternalUserService(employeeId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export { createInternalUser, getUserByEmployeeId };
