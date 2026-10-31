import { spawn } from "node:child_process";
import { assertMongoDBAvailable } from "./mongodb.js";

const services = [
  "user-service",
  "notification-service",
  "auth-service",
  "invoice-service",
  "api-gateway",
];
const children = new Set();
let stopping = false;
let remaining = services.length;

try {
  await assertMongoDBAvailable();
} catch (error) {
  console.error(error.message);
  console.error("Start your local MongoDB service, then run this command again.");
  process.exit(1);
}

const stopChildren = (signal) => {
  if (stopping) {
    return;
  }

  stopping = true;
  for (const child of children) {
    child.kill(signal);
  }
};

process.once("SIGINT", () => stopChildren("SIGINT"));
process.once("SIGTERM", () => stopChildren("SIGTERM"));

for (const service of services) {
  const child = spawn(
    process.execPath,
    ["scripts/start-service.js", service],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    },
  );

  children.add(child);
  child.once("error", (error) => {
    console.error(`Failed to start ${service}: ${error.message}`);
    process.exitCode = 1;
    stopChildren("SIGTERM");
  });
  child.once("exit", (code, signal) => {
    children.delete(child);
    remaining -= 1;

    if (!stopping && (signal || code !== 0)) {
      process.exitCode = code ?? 1;
      stopChildren("SIGTERM");
    }

    if (remaining === 0 && stopping && process.exitCode === undefined) {
      process.exitCode = 0;
    }
  });
}

console.log("Started local services. Press Ctrl+C to stop them all.");
