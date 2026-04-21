import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import winston from "winston";

const logtail = new Logtail(process.env.BETTERSTACK_SOURCE_TOKEN!);

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV === "production",
    }),
    new LogtailTransport(logtail),
  ],
});
