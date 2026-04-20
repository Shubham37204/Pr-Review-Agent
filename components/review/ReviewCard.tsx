"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
  id: string;
  prUrl: string;
  prTitle?: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  linesCount?: number | null;
  chunksCount?: number | null;
  createdAt: string | Date;
}

export default function ReviewCard(props: ReviewCardProps) {
  const { id, prUrl, prTitle, status, linesCount, chunksCount, createdAt } = props;

  const timeAgo = formatDistanceToNow(
    typeof createdAt === "string" ? new Date(createdAt) : createdAt,
    { addSuffix: true }
  );

  let repoName = "";
  try {
    repoName = new URL(prUrl).pathname.split("/").slice(1, 3).join("/");
  } catch {
    repoName = prUrl;
  }

  const statusColorMap: Record<ReviewCardProps["status"], string> = {
    PENDING: "gray",
    PROCESSING: "blue",
    COMPLETED: "green",
    FAILED: "red",
  };

  const statusColor = statusColorMap[status];

  return (
    <Link href={`/review/${id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "12px",
          cursor: "pointer",
          transition: "box-shadow 0.2s",
        }}
      >
        {/* Repo */}
        <h3>{repoName}</h3>

        {/* Title */}
        <p>{prTitle || prUrl}</p>

        {/* Status + Time */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px",
          }}
        >
          <span
            style={{
              backgroundColor: statusColor,
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            {status}
          </span>

          <span style={{ fontSize: "12px", color: "#666" }}>
            {timeAgo}
          </span>
        </div>

        {/* Completed stats */}
        {status === "COMPLETED" && (
          <div style={{ marginTop: "10px", fontSize: "12px" }}>
            <span style={{ marginRight: "10px" }}>
              Lines: {linesCount ?? "-"}
            </span>
            <span>Chunks: {chunksCount ?? "-"}</span>
          </div>
        )}

        {/* Processing indicator */}
        {status === "PROCESSING" && (
          <div style={{ marginTop: "10px", opacity: 0.7 }}>
            ⏳ Processing...
          </div>
        )}
      </div>
    </Link>
  );
}
