import { Worker, type Job } from "bullmq";
import { redisConnection, type ReviewJobData } from "@/lib/queue/reviewQueue";
import { fetchPRData } from "@/lib/github/fetchPR";
import { chunkDiff } from "@/lib/github/chunkDiff";
import { reviewChunk, mergeReviewResults } from "@/lib/groq/reviewPrompt";
import { prisma } from "@/lib/prisma/client";
import { Resend } from "resend";
import type { ReviewResult } from "@/lib/groq/reviewPrompt";
import type { Prisma } from "@/generated/prisma";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

// Worker job processor
async function processReviewJob(job: Job<ReviewJobData>) {
  const { reviewId, prUrl, userId, userEmail } = job.data;

  try {
    // 1. Update status → PROCESSING
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "PROCESSING" },
    });

    // 2. Fetch PR data
    let prData;
    try {
      prData = await fetchPRData(prUrl);
    } catch (error) {
      await prisma.review.update({
        where: { id: reviewId },
        data: { status: "FAILED" },
      });
      throw error;
    }

    // 3. Chunk diff
    const chunks = chunkDiff(prData.diff);
    const totalLines = prData.diff.split("\n").length;

    console.log(
      logger.info("Review started", {
        reviewId,
        chunks: chunks.length,
        lines: totalLines,
      }),
    );

    // 4. Initial progress
    await job.updateProgress(10);

    // 5. Process chunks sequentially
    const results: ReviewResult[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        const result = await reviewChunk(chunk);
        results.push(result);
      } catch (err) {
        logger.warn("Chunk failed", { reviewId, chunkIndex: i });
      }

      // update progress (10 → 90)
      const progress = 10 + ((i + 1) / chunks.length) * 80;
      await job.updateProgress(Math.round(progress));
    }

    // 6. Merge results
    const finalResult = mergeReviewResults(results, chunks.length);

    // 7. Save to DB
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: "COMPLETED",
        result: finalResult as unknown as Prisma.InputJsonValue,
        linesCount: totalLines,
        chunksCount: chunks.length,
        prTitle: prData.title,
      },
    });

    // 8. Send email (non-blocking failure)
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: userEmail,
        subject: "Your PR review is ready",
        html: `
          <p>Your PR review is ready 🎉</p>
          <p>Summary:</p>
          <p>${finalResult.summary}</p>
          <p>
            View full review:
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/review/${reviewId}">
              Open Review
            </a>
          </p>
        `,
      });
    } catch (err) {
      console.error(`[Worker] Email failed for review ${reviewId}:`, err);
    }

    // 9. Increment user usage
    await prisma.user.update({
      where: { id: userId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    // 10. Done
    await job.updateProgress(100);
  } catch (error) {
    logger.error("Job failed", { reviewId, error });
    throw error; // let BullMQ handle retries
  }
}

// Worker setup
export const reviewWorker = new Worker<ReviewJobData>(
  "pr-review",
  processReviewJob,
  {
    connection: redisConnection,
    concurrency: 2,
  },
);

// Handle failed jobs
reviewWorker.on("failed", async (job, err) => {
  try {
    if (job?.data?.reviewId) {
      await prisma.review.update({
        where: { id: job.data.reviewId },
        data: { status: "FAILED" },
      });
    }
    console.error(`[ReviewWorker] Job failed: ${job?.id}`, err.message);
  } catch (dbErr) {
    logger.error("Failed to update review status to FAILED", { error: dbErr });
  }
});

// Global worker error (do NOT crash)
reviewWorker.on("error", (err) => {
  logger.error("Worker error", { error: err });
});
