import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(
  new URL("../../../../.env", import.meta.url)
);

dotenv.config({ path: envPath });

const requiredVariables = ["PORT", "SERVICE_NAME", "NODE_ENV"];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing environment variable: ${variable}`);
  }
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid port number");
}

export const env = {
  port,
  serviceName: process.env.SERVICE_NAME,
  nodeEnv: process.env.NODE_ENV
};