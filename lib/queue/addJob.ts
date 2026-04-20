import { reviewQueue, type ReviewJobData } from "./reviewQueue";

// Instruction: generate jobId as `review-${reviewId}` for deduplication
// BullMQ will reject duplicate jobIds — prevents double processing
// if user submits same PR twice while first is still queued
export async function addReviewJob(data: ReviewJobData): Promise<string> {
  //  Create deterministic jobId
  const jobId = `review-${data.reviewId}`;

  //  Add job to queue
  const job = await reviewQueue.add("review-job", data, {
    jobId,
  });

  //  Return job.id for tracking
  return job.id!;
}
