export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema(req);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: result.errors
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};