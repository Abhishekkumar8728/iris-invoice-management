const errorMiddleware = (
  error,
  req,
  res,
  next
) => {
  console.error(error);

  return res.status(
    error.statusCode || 500
  ).json({
    success: false,
    message:
      error.message ||
      "Internal server error"
  });
};
export const errorHandler = (
  error,
  req,
  res,
  next
) => {

  console.error(
    `[${new Date().toISOString()}]`,
    error
  );

  if (res.headersSent) {
    return next(error);
  }

  if (error?.name === "ValidationError") {

    const errors =
      Object.entries(error.errors || {})
        .map(([field, value]) => ({
          field,
          message: value.message
        }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }


  if (error?.code === 11000) {

    const field =
      Object.keys(error.keyPattern || {})[0] ||
      "field";

    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
      errors: [
        {
          field,
          message: `${field} must be unique.`
        }
      ]
    });
  }


  const statusCode =
    Number.isInteger(error?.statusCode)
      ? error.statusCode
      : 500;


  const response = {
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error."
        : (
            error?.message ||
            "Request failed."
          )
  };


  if (
    error?.errors &&
    Array.isArray(error.errors)
  ) {
    response.errors = error.errors;
  }


  if (
    process.env.NODE_ENV !== "production" &&
    error?.stack
  ) {
    response.stack = error.stack;
  }


  return res
    .status(statusCode)
    .json(response);
};

export default errorMiddleware;