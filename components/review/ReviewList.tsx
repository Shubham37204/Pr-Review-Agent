"use client";

import ReviewCard from "@/components/review/ReviewCard";

interface Review {
  id: string;
  prUrl: string;
  prTitle?: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  linesCount?: number | null;
  chunksCount?: number | null;
  createdAt: Date;
}

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  // Empty state
  if (reviews.length === 0) {
    return (
      <div style={{ marginTop: "20px", color: "#666" }}>
        No reviews yet. Paste a GitHub PR URL above to get started.
      </div>
    );
  }

  // List
  return (
    <div style={{ marginTop: "20px" }}>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          id={review.id}
          prUrl={review.prUrl}
          prTitle={review.prTitle}
          status={review.status}
          linesCount={review.linesCount}
          chunksCount={review.chunksCount}
          createdAt={review.createdAt.toISOString()}
        />
      ))}
    </div>
  );
}
