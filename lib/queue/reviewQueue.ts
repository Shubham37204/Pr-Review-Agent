import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { logger } from "@/lib/logger";

// Use UPSTASH_REDIS_URL (NOT REST URL)
if (!process.env.UPSTASH_REDIS_URL) {
  throw new Error("Missing UPSTASH_REDIS_URL");
}

// Proper Redis connection for BullMQ + Upstash
export const redisConnection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null, // required for BullMQ
  enableReadyCheck: false, // required for Upstash
  tls: {}, // Upstash requires TLS
});

redisConnection.on("error", (err) => {
  logger.error("Redis connection error", { message: err.message });
});

// Job data type
export interface ReviewJobData {
  reviewId: string; // Prisma review record ID
  prUrl: string;
  userId: string;
  userEmail: string;
}

// Queue (name must match worker exactly)
export const reviewQueue = new Queue<ReviewJobData>("pr-review", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // retry 3 times
    backoff: {
      type: "exponential",
      delay: 5000, // 5s → 10s → 20s
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
