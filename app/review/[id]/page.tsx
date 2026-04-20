"use client";

import { useEffect, useReducer, useCallback } from "react";
import { useParams } from "next/navigation";
import type { ReviewResult, ReviewComment } from "@/types";
import SeverityBadge from "@/components/review/SeverityBadge";

// DiffViewer intentionally excluded until GET /api/review/[id]/diff
// is implemented in Phase 4 — see Option 2 decision

interface ReviewData {
  id: string;
  prUrl: string;
  prTitle?: string;
  status: string;
  result?: ReviewResult;
  linesCount?: number;
  chunksCount?: number;
  createdAt: string;
  errorMessage?: string;
}

interface ReviewPageState {
  status: "idle" | "loading" | "polling" | "completed" | "failed";
  review: ReviewData | null;
  error: string | null;
}

type ReviewPageAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: ReviewData | null }
  | { type: "POLL_START" }
  | { type: "COMPLETED"; payload: ReviewData | null }
  | { type: "FAILED"; payload: string };

function reviewReducer(
  state: ReviewPageState,
  action: ReviewPageAction
): ReviewPageState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };

    case "FETCH_SUCCESS": {
      const review = action.payload;
      if (!review) return state;
      if (review.status === "PENDING" || review.status === "PROCESSING") {
        return { ...state, status: "polling", review };
      }
      if (review.status === "COMPLETED") {
        return { ...state, status: "completed", review };
      }
      if (review.status === "FAILED") {
        return {
          ...state,
          status: "failed",
          review,
          error: review.errorMessage ?? "Review failed",
        };
      }
      return state;
    }

    case "POLL_START":
      return { ...state, status: "polling" };

    case "COMPLETED":
      return { ...state, status: "completed", review: action.payload };

    case "FAILED":
      return { ...state, status: "failed", error: action.payload };

    default:
      return state;
  }
}

const POLL_INTERVAL_MS = 3000;

export default function ReviewPage() {
  const params = useParams();
  const reviewId = params.id as string;

  const [state, dispatch] = useReducer(reviewReducer, {
    status: "idle",
    review: null,
    error: null,
  });

  const fetchReview = useCallback(async () => {
    try {
      dispatch({ type: "FETCH_START" });
      const res = await fetch(`/api/review/${reviewId}`);
      if (!res.ok) throw new Error("Failed to fetch review");
      const data: ReviewData = await res.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (err: unknown) {
      dispatch({
        type: "FAILED",
        payload: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }, [reviewId]);

  // Initial fetch
  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  // Polling — only when status is polling
  useEffect(() => {
    if (state.status !== "polling") return;
    const interval = setInterval(fetchReview, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.status, fetchReview]);

  if (state.status === "loading") {
    return <div>Loading review...</div>;
  }

  if (state.status === "polling") {
    return (
      <div>
        <h2>Review in progress...</h2>
        <p>Analyzing your PR, please wait...</p>
        {state.review?.chunksCount && (
          <p>Processing {state.review.chunksCount} chunks...</p>
        )}
      </div>
    );
  }

  if (state.status === "failed") {
    return (
      <div>
        <h2>Review Failed</h2>
        <p>{state.error}</p>
        <button onClick={fetchReview}>Retry</button>
      </div>
    );
  }

  if (state.status === "completed" && state.review?.result) {
    const result = state.review.result;

    return (
      <div>
        <h1>{state.review.prTitle || "Review Result"}</h1>

        {/* Score */}
        <h2>Score: {result.score}/100</h2>

        {/* Summary */}
        <p>{result.summary}</p>

        {/* Stats */}
        <p>
          Lines reviewed: {state.review.linesCount ?? "-"} | Chunks
          processed: {result.chunksProcessed}
        </p>

        {/* Severity breakdown */}
        <div style={{ display: "flex", gap: "8px", margin: "12px 0" }}>
          {(["critical", "warning", "suggestion"] as const).map((sev) => (
            <SeverityBadge
              key={sev}
              severity={sev}
              count={result.comments.filter((c) => c.severity === sev).length}
            />
          ))}
        </div>

        {/* Comments — synced with ReviewResult.comments from Phase 2 */}
        <div>
          {result.comments.map((comment: ReviewComment, index: number) => (
            <div
              key={index}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "10px",
              }}
            >
              <SeverityBadge severity={comment.severity} />
              <p>
                <strong>{comment.file}</strong>
                {comment.line ? ` — line ${comment.line}` : ""}
              </p>
              <p>{comment.issue}</p>
              <p style={{ color: "#555" }}>
                💡 {comment.recommendation}
              </p>
            </div>
          ))}
        </div>

        {/* DiffViewer deferred to Phase 4 */}
        {/* Will be added once GET /api/review/[id]/diff endpoint exists */}
      </div>
    );
  }

  return null;
}
