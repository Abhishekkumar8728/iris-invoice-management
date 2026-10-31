const requiredProductionEnv = [
  "FRONTEND_URL",
  "AUTH_SERVICE_URL",
  "USER_SERVICE_URL",
  "INVOICE_SERVICE_URL",
  "NOTIFICATION_SERVICE_URL",
  "INTERNAL_SERVICE_KEY",
  "JWT_ACCESS_SECRET",
];

const validateEnvironment = () => {
  const nodeEnv =
    process.env.NODE_ENV || "development";

  if (nodeEnv !== "production") {
    return;
  }

  const missing = requiredProductionEnv.filter(
    (key) => {
      const value = process.env[key];

      return (
        typeof value !== "string" ||
        value.trim().length === 0
      );
    }
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`
    );
  }

  if (
    process.env.JWT_ACCESS_SECRET.length < 32
  ) {
    throw new Error(
      "JWT_ACCESS_SECRET must contain at least 32 characters in production."
    );
  }

  if (
    process.env.INTERNAL_SERVICE_KEY.length < 16
  ) {
    throw new Error(
      "INTERNAL_SERVICE_KEY must contain at least 16 characters in production."
    );
  }
};

export default validateEnvironment;