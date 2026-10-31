import Vendor from "../models/vendor.model.js";
import { Invoice } from "../models/invoice.model.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listVendors = async ({ page, limit, search, status }) => {
  const [storedVendors, invoiceVendors] = await Promise.all([
    Vendor.find({}).lean(),
    Invoice.aggregate([
      { $match: { "vendor.vendorCode": { $exists: true, $ne: "" } } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$vendor.vendorCode",
          name: { $last: "$vendor.name" },
          gstin: { $last: "$vendor.gstin" },
          email: { $last: "$vendor.email" },
          mobile: { $last: "$vendor.mobile" },
          address: { $last: "$vendor.address" },
          invoiceCount: { $sum: 1 },
          totalInvoiced: { $sum: "$amounts.totalAmount" },
        },
      },
    ]),
  ]);

  const storedByCode = new Map(
    storedVendors.map((vendor) => [vendor.vendorCode, vendor]),
  );
  const invoicesByCode = new Map(
    invoiceVendors.map((vendor) => [vendor._id, vendor]),
  );
  const codes = new Set([...storedByCode.keys(), ...invoicesByCode.keys()]);
  let vendors = [...codes].map((vendorCode) => {
    const saved = storedByCode.get(vendorCode) || {};
    const invoiceData = invoicesByCode.get(vendorCode) || {};
    return {
      ...invoiceData,
      ...saved,
      vendorCode,
      invoiceCount: invoiceData.invoiceCount || 0,
      totalInvoiced: invoiceData.totalInvoiced || 0,
      isActive: saved.isActive ?? true,
    };
  });

  if (status !== "all") {
    vendors = vendors.filter((vendor) => vendor.isActive === (status === "active"));
  }
  if (search) {
    const expression = new RegExp(escapeRegex(search), "i");
    vendors = vendors.filter((vendor) =>
      [vendor.vendorCode, vendor.name, vendor.email, vendor.gstin]
        .some((field) => expression.test(field || "")),
    );
  }

  vendors.sort((left, right) => left.name.localeCompare(right.name));
  const total = vendors.length;
  vendors = vendors.slice((page - 1) * limit, page * limit);

  return {
    vendors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getVendor = async (vendorCode) => {
  let vendor = await Vendor.findOne({
    vendorCode: vendorCode.toUpperCase(),
  }).lean();

  if (!vendor) {
    const [invoiceData] = await Invoice.aggregate([
      { $match: { "vendor.vendorCode": vendorCode.toUpperCase() } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$vendor.vendorCode",
          name: { $last: "$vendor.name" },
          gstin: { $last: "$vendor.gstin" },
          email: { $last: "$vendor.email" },
          mobile: { $last: "$vendor.mobile" },
          address: { $last: "$vendor.address" },
          invoiceCount: { $sum: 1 },
          totalInvoiced: { $sum: "$amounts.totalAmount" },
          latestInvoiceDate: { $max: "$invoiceDate" },
        },
      },
    ]);
    if (invoiceData) {
      vendor = {
        vendorCode: invoiceData._id,
        name: invoiceData.name,
        gstin: invoiceData.gstin,
        email: invoiceData.email,
        mobile: invoiceData.mobile,
        address: invoiceData.address,
        isActive: true,
        invoiceCount: invoiceData.invoiceCount,
        totalInvoiced: invoiceData.totalInvoiced,
        latestInvoiceDate: invoiceData.latestInvoiceDate,
      };
    }
  }

  if (!vendor) {
    const error = new Error("Vendor not found");
    error.statusCode = 404;
    throw error;
  }

  if (vendor.invoiceCount !== undefined) {
    return vendor;
  }

  const [invoiceStats] = await Invoice.aggregate([
    { $match: { "vendor.vendorCode": vendor.vendorCode } },
    {
      $group: {
        _id: null,
        invoiceCount: { $sum: 1 },
        totalInvoiced: { $sum: "$amounts.totalAmount" },
        latestInvoiceDate: { $max: "$invoiceDate" },
      },
    },
  ]);

  return {
    ...vendor,
    invoiceCount: invoiceStats?.invoiceCount || 0,
    totalInvoiced: invoiceStats?.totalInvoiced || 0,
    latestInvoiceDate: invoiceStats?.latestInvoiceDate || null,
  };
};

const createVendor = async (payload, user) => Vendor.create({
  ...payload,
  vendorCode: payload.vendorCode.toUpperCase(),
  createdBy: user.id,
});

const updateVendor = async (vendorCode, payload) => {
  const vendor = await Vendor.findOneAndUpdate(
    { vendorCode: vendorCode.toUpperCase() },
    payload,
    { returnDocument: "after", runValidators: true },
  );

  if (!vendor) {
    const error = new Error("Vendor not found");
    error.statusCode = 404;
    throw error;
  }

  return vendor;
};

const archiveVendor = async (vendorCode) => {
  const vendor = await Vendor.findOneAndUpdate(
    { vendorCode: vendorCode.toUpperCase(), isActive: true },
    { isActive: false },
    { returnDocument: "after" },
  );

  if (!vendor) {
    const error = new Error("Active vendor not found");
    error.statusCode = 404;
    throw error;
  }

  return vendor;
};

const synchronizeVendor = async (details, userId) => Vendor.findOneAndUpdate(
  { vendorCode: details.vendorCode.toUpperCase() },
  {
    $set: {
      name: details.name,
      gstin: details.gstin || "",
      email: details.email || "",
      mobile: details.mobile || "",
      address: details.address || "",
    },
    $setOnInsert: {
      vendorCode: details.vendorCode.toUpperCase(),
      createdBy: userId,
    },
  },
  { upsert: true, returnDocument: "after", runValidators: true },
);

export {
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  archiveVendor,
  synchronizeVendor,
};
