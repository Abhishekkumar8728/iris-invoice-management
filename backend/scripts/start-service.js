import { spawn } from "node:child_process";
import { assertMongoDBAvailable } from "./mongodb.js";

const services = {
  "user-service": {
    entry: "services/user-service/server.js",
    port: "USER_SERVICE_PORT",
    defaultPort: 4002,
    mongoUri: "USER_MONGO_URI",
  },
  "notification-service": {
    entry: "services/notification-service/server.js",
    port: "NOTIFICATION_SERVICE_PORT",
    defaultPort: 4004,
    mongoUri: "NOTIFICATION_MONGO_URI",
  },
  "auth-service": {
    entry: "services/auth-service/server.js",
    port: "AUTH_SERVICE_PORT",
    defaultPort: 4001,
    mongoUri: "AUTH_MONGO_URI",
  },
  "invoice-service": {
    entry: "services/invoice-service/server.js",
    port: "INVOICE_SERVICE_PORT",
    defaultPort: 4003,
    mongoUri: "INVOICE_MONGO_URI",
  },
  "api-gateway": {
    entry: "api-gateway/server.js",
    port: "GATEWAY_PORT",
    defaultPort: 4000,
  },
};

const serviceName = process.argv[2];
const service = services[serviceName];

if (!service) {
  console.error(
    `Unknown service "${serviceName}". Choose one of: ${Object.keys(services).join(", ")}`,
  );
  process.exit(1);
}

if (service.mongoUri && !process.env[service.mongoUri]) {
  console.error(`Missing ${service.mongoUri} in the root .env file.`);
  process.exit(1);
}

if (service.mongoUri) {
  try {
    await assertMongoDBAvailable();
  } catch (error) {
    console.error(error.message);
    console.error("Start your local MongoDB service, then run this command again.");
    process.exit(1);
  }
}

const child = spawn(
  process.execPath,
  [service.entry],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...(service.port
        ? { PORT: process.env[service.port] || String(service.defaultPort) }
        : {}),
      ...(service.mongoUri
        ? { MONGO_URI: process.env[service.mongoUri] }
        : {}),
    },
    stdio: "inherit",
  },
);

process.once("SIGINT", () => child.kill("SIGINT"));
process.once("SIGTERM", () => child.kill("SIGTERM"));

child.once("error", (error) => {
  console.error(`Failed to start ${serviceName}: ${error.message}`);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) {
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
