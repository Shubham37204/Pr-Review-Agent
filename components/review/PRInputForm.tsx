"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PRInputForm() {
  const router = useRouter();

  const [prUrl, setPrUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // 1. Validate
    if (!prUrl.trim()) {
      setError("PR URL is required");
      return;
    }

    try {
      // 2. Start loading
      setIsLoading(true);
      setError(null);

      // 3. API call
      const res = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prUrl }),
      });

      // 5. Handle 429
      if (res.status === 429) {
        setError("Daily review limit reached");
        return;
      }

      // 4. Handle non-ok response
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to submit review");
        return;
      }

      // 6. Success
      const data = await res.json();
      const reviewId = data.reviewId;

      router.push(`/review/${reviewId}`);
    } catch (err: unknown) {
      // 7. Catch error safely
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      // 8. Stop loading
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Input */}
      <input
        type="text"
        value={prUrl}
        onChange={(e) => setPrUrl(e.target.value)}
        placeholder="Paste GitHub PR URL"
        disabled={isLoading}
        style={{
          padding: "8px",
          width: "300px",
          marginRight: "10px",
        }}
      />

      {/* Button */}
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Submitting..." : "Review PR"}
      </button>

      {/* Error */}
      {error && (
        <div style={{ color: "red", marginTop: "8px" }}>
          {error}
        </div>
      )}
    </div>
  );
}
