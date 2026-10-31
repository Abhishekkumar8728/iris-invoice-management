import * as vendorService from "../services/vendor.service.js";
import { errorResponse, successResponse } from "../utils/response.js";

const listVendors = async (req, res) => {
  try {
    const result = await vendorService.listVendors(res.locals.validatedQuery);
    return successResponse(res, result, "Vendors fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

const getVendor = async (req, res) => {
  try {
    const vendor = await vendorService.getVendor(req.params.vendorCode);
    return successResponse(res, vendor, "Vendor fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

const createVendor = async (req, res) => {
  try {
    const vendor = await vendorService.createVendor(req.body, req.user);
    return successResponse(res, vendor, "Vendor created successfully", 201);
  } catch (error) {
    const statusCode = error.code === 11000 ? 409 : error.statusCode || 400;
    return errorResponse(res, error.code === 11000 ? "Vendor code already exists" : error.message, statusCode);
  }
};

const updateVendor = async (req, res) => {
  try {
    const vendor = await vendorService.updateVendor(req.params.vendorCode, req.body);
    return successResponse(res, vendor, "Vendor updated successfully");
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 400);
  }
};

const archiveVendor = async (req, res) => {
  try {
    const vendor = await vendorService.archiveVendor(req.params.vendorCode);
    return successResponse(res, vendor, "Vendor archived successfully");
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 400);
  }
};

export { listVendors, getVendor, createVendor, updateVendor, archiveVendor };
