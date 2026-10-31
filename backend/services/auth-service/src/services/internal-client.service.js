import axios from "axios";
import crypto from "crypto";

const internalClient = axios.create({
  timeout: Number(
    process.env.SERVICE_REQUEST_TIMEOUT || 5000
  ),

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


internalClient.interceptors.request.use(
  (config) => {
    config.headers["x-service-key"] =
      process.env.INTERNAL_SERVICE_KEY;

    config.headers["x-request-id"] =
      config.requestId || crypto.randomUUID();

    delete config.requestId;

    return config;
  }
);


internalClient.interceptors.response.use(
  (response) => response,

  (error) => {
    const serviceMessage =
      error.response?.data?.message;

    const wrappedError = new Error(
      serviceMessage ||
        "Internal service communication failed"
    );

    wrappedError.statusCode =
      error.response?.status || 503;

    wrappedError.service =
      error.config?.baseURL ||
      error.config?.url ||
      "unknown";

    throw wrappedError;
  }
);


export default internalClient;