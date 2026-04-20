// Central types file — import from here everywhere, not from individual files
export type { ReviewComment, ReviewResult } from "@/lib/groq/reviewPrompt";
export type { ReviewJobData } from "@/lib/queue/reviewQueue";
export type { DiffChunk } from "@/lib/github/chunkDiff";

// Prisma enums re-exported for use in frontend without importing from @prisma/client
export { ReviewStatus } from "@prisma/client";

// API response shapes
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface QueuedReviewResponse {
  reviewId: string;
  message: string;
}
