const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const input =
        source === "body"
          ? req.body ?? {}
          : source === "params"
            ? req.params ?? {}
            : req.query ?? {};

      const { error, value } = schema.validate(
        input,
        {
          abortEarly: false,
          convert: true,
        }
      );

      if (error) {
        const validationErrors =
          error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          }));

        const validationError =
          new Error("Validation failed");

        validationError.statusCode = 400;
        validationError.code =
          "VALIDATION_ERROR";
        validationError.details =
          validationErrors;

        return next(validationError);
      }









      if (source === "query") {
        req.validatedQuery = value;
      } else if (source === "params") {
        req.validatedParams = value;
      } else {
        req.body = value;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;