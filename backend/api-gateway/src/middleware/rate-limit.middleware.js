import rateLimit from "express-rate-limit";

const createRateLimiter = ({
  max,
  message,
  skipSuccessfulRequests = false,
}) => {
  return rateLimit({
    windowMs: Number(
      process.env.RATE_LIMIT_WINDOW_MS ||
        15 * 60 * 1000
    ),

    max,
    skipSuccessfulRequests,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      success: false,
      message,
    },
  });
};

const apiRateLimiter = createRateLimiter({
  max: Number(
    process.env.RATE_LIMIT_MAX || 300
  ),

  message:
    "Too many requests. Please try again later.",
});

const authRateLimiter = createRateLimiter({
  max: Number(
    process.env.AUTH_RATE_LIMIT_MAX || 20
  ),

  skipSuccessfulRequests: true,

  message:
    "Too many authentication requests. Please try again later.",
});

export {
  apiRateLimiter,
  authRateLimiter,
};