const errorMiddleware = (
  error,
  req,
  res,
  next
) => {

  console.error(
    `[Gateway Error] ${error.message}`
  );

  if (res.headersSent) {
    return next(error);
  }

  return res.status(
    error.statusCode || 500
  ).json({
    success: false,
    message:
      error.message ||
      "Internal server error",
    requestId: req.requestId
  });
};

export default errorMiddleware;