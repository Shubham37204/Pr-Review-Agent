import { reviewQueue, type ReviewJobData } from "@/lib/queue/reviewQueue";

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

  if (!job.id)
    throw new Error(`Failed to enqueue job for review ${data.reviewId}`);
  
  return job.id;
}
