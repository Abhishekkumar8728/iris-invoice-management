import axios from "axios";
import crypto from "crypto";

const client = axios.create({
  timeout: Number(
    process.env.SERVICE_REQUEST_TIMEOUT || 5000
  ),

  headers: {
    "Content-Type": "application/json"
  }
});

client.interceptors.request.use(
  (config) => {

    config.headers["x-service-key"] =
      process.env.INTERNAL_SERVICE_KEY;

    config.headers["x-request-id"] =
      config.requestId ||
      crypto.randomUUID();

    return config;
  }
);

export default client;