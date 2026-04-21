import { config } from "dotenv";
config({ path: ".env.local" });

async function start() {
  await import("./reviewWorker");
  console.log("[Worker] Review worker started");
}

start();