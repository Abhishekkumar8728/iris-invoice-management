const validate = (
  schema,
  source = "body"
) => {
  return (
    req,
    res,
    next
  ) => {
    try {
      const input =
        source === "body"
          ? req.body ?? {}
          : req[source] ?? {};

      const {
        error,
        value,
      } = schema.validate(
        input,
        {
          abortEarly: false,
          convert: true,
        }
      );

      if (error) {
        const details =
          error.details.map(
            (detail) => ({
              field:
                detail.path.join("."),
              message:
                detail.message,
            })
          );

        const validationError =
          new Error(
            "Validation failed"
          );

        validationError.statusCode =
          400;

        validationError.code =
          "VALIDATION_ERROR";

        validationError.details =
          details;

        return next(
          validationError
        );
      }

      req[source] = value;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;