"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ExistingReview {
  existingReviewId: string;
  status: string;
  message: string;
}

export default function PRInputForm() {
  const router = useRouter();

  const [prUrl, setPrUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const submitReview = async (forceReview: boolean) => {
    if (!prUrl.trim()) {
      setError("PR URL is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setExistingReview(null);

      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl, forceReview }),
      });

      // Read rate limit header regardless of status
      const limitRemaining = res.headers.get("X-RateLimit-Remaining");
      if (limitRemaining !== null) {
        setRemaining(parseInt(limitRemaining, 10));
      }

      // 429 — limit reached
      if (res.status === 429) {
        setError("Daily review limit reached");
        return;
      }

      const data = await res.json().catch(() => ({}));

      // 409 — existing review detected
      if (res.status === 409) {
        setExistingReview(data);
        return;
      }

      // 202 — new review queued
      if (res.status === 202) {
        router.push(`/review/${data.reviewId}`);
        return;
      }

      // Other non-ok responses
      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        return;
      }

      // Unexpected status fallback
      setError("Unexpected response from server");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => submitReview(false);

  const handleForceReview = () => {
    setExistingReview(null);
    submitReview(true);
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <input
        type="text"
        value={prUrl}
        onChange={(e) => setPrUrl(e.target.value)}
        placeholder="Paste GitHub PR URL"
        disabled={isLoading}
        style={{ padding: "8px", width: "300px", marginRight: "10px" }}
      />

      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Submitting..." : "Review PR"}
      </button>

      {remaining !== null && (
        <div style={{ marginTop: "8px", color: remaining <= 2 ? "red" : "black" }}>
          {remaining} reviews remaining today
        </div>
      )}

      {error && (
        <div style={{ color: "red", marginTop: "8px" }}>{error}</div>
      )}

      {existingReview && (
        <div style={{ marginTop: "12px" }}>
          <div>
            This PR was already reviewed (status: {existingReview.status})
          </div>
          <button
            onClick={() => router.push(`/review/${existingReview.existingReviewId}`)}
            style={{ marginRight: "10px", marginTop: "6px" }}
          >
            View Result
          </button>
          <button onClick={handleForceReview}>Re-review</button>
        </div>
      )}
    </div>
  );
}
