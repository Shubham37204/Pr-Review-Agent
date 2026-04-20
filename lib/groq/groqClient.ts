import Groq from "groq-sdk";

// Singleton pattern — same reason as Prisma
// Prevents multiple SDK instances on hot reload
const globalForGroq = globalThis as unknown as { groq: Groq | undefined };

export const groq =
  globalForGroq.groq ??
  new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

if (process.env.NODE_ENV !== "production") globalForGroq.groq = groq;
