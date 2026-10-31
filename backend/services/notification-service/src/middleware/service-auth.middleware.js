const serviceAuthentication = (req, res, next) => {

  const serviceKey =
    req.headers["x-service-key"];

  if (!serviceKey) {
    return res.status(401).json({
      success: false,
      message: "Service authentication required"
    });
  }

  if (
    serviceKey !== process.env.INTERNAL_SERVICE_KEY
  ) {
    return res.status(403).json({
      success: false,
      message: "Invalid service credentials"
    });
  }

  next();
};

export default serviceAuthentication;