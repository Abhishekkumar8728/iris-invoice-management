const errorMiddleware = (
  error,
  req,
  res,
  next
) => {
  console.error(
    `[${req.method}] ${req.originalUrl}`,
    error
  );

  let statusCode =
    error.statusCode || 500;

  let message =
    error.message ||
    "Internal server error";

  let errors =
    error.details || null;




  if (error.code === 11000) {
    statusCode = 409;

    message =
      "Duplicate invoice data detected";

    errors = Object.keys(
      error.keyPattern || {}
    ).map((field) => ({
      field,
      message:
        `${field} already exists`,
    }));
  }




  if (error.name === "CastError") {
    statusCode = 400;

    message =
      "Invalid resource identifier";

    errors = [
      {
        field:
          error.path || "id",
        message:
          "Invalid identifier format",
      },
    ];
  }




  if (
    error.name ===
    "ValidationError"
  ) {
    statusCode = 400;

    message =
      "Validation failed";

    errors =
      Object.values(
        error.errors
      ).map((item) => ({
        field: item.path,
        message: item.message,
      }));
  }




  if (
    error.code ===
    "VALIDATION_ERROR"
  ) {
    statusCode = 400;
  }




  if (
    error.name ===
    "MulterError"
  ) {
    statusCode = 400;

    message =
      error.code ===
      "LIMIT_FILE_SIZE"
        ? "File size exceeds the allowed limit"
        : "Invalid file upload";

    errors = [
      {
        field: "file",
        message,
      },
    ];
  }



if (
  error.code ===
  "INVALID_FILE"
) {
  statusCode = 400;
}




if (
  error.name ===
  "MulterError"
) {
  statusCode = 400;

  switch (error.code) {
    case "LIMIT_FILE_SIZE":
      message =
        "File size cannot exceed 5 MB";
      break;

    case "LIMIT_FILE_COUNT":
      message =
        "Maximum 5 files are allowed";
      break;

    case "LIMIT_PART_COUNT":
      message =
        "Too many multipart form parts";
      break;

    case "LIMIT_FIELD_COUNT":
      message =
        "Too many form fields";
      break;

    case "LIMIT_UNEXPECTED_FILE":
      message =
        "Unexpected file field";
      break;

    default:
      message =
        "Invalid file upload";
  }

  errors = [
    {
      field: "file",
      message,
    },
  ];
}





  if (statusCode >= 500) {
    statusCode = 500;
    message =
      "Internal server error";
    errors = null;
  }

  return res
    .status(statusCode)
    .json({
      success: false,
      message,
      errors,
      requestId:
        req.headers["x-request-id"] ||
        undefined,
    });
};

export default errorMiddleware;