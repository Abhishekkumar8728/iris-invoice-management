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




  if (
    error.code ===
    "VALIDATION_ERROR"
  ) {
    statusCode = 400;
  }




  if (error.code === 11000) {
    statusCode = 409;

    message =
      "Duplicate notification data";

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