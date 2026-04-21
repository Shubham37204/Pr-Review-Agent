import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import winston from "winston";

const token = process.env.BETTERSTACK_SOURCE_TOKEN;

// Base transports — always include console
const transports: winston.transport[] = [
  new winston.transports.Console({
    silent: process.env.NODE_ENV === "production",
  }),
];

// Only add BetterStack transport if token exists
// Prevents crash when running worker standalone without token
if (token) {
  const logtail = new Logtail(token);
  transports.push(new LogtailTransport(logtail));
}

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});
