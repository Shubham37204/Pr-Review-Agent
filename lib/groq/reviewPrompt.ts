import { groq } from "./groqClient";
import type { DiffChunk } from "@/lib/github/chunkDiff";

export interface ReviewComment {
  severity: "critical" | "warning" | "suggestion";
  file: string;
  line?: number;
  issue: string;
  recommendation: string;
}

export interface ReviewResult {
  summary: string;
  comments: ReviewComment[];
  score: number;
  chunksProcessed: number;
}

const SYSTEM_PROMPT = `
You are a senior software engineer performing a thorough code review.
Analyze the given PR diff and return ONLY a valid JSON object.
No markdown. No explanation. No backticks. Raw JSON only.

Return this exact shape:
{
  "summary": "string — 2-3 sentence overall assessment",
  "comments": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "file": "filename",
      "line": number or null,
      "issue": "what is wrong",
      "recommendation": "what to do instead"
    }
  ],
  "score": number between 0 and 100
}

Severity rules:
- critical: security issues, data loss risk, breaking bugs
- warning: performance problems, bad patterns, missing error handling  
- suggestion: style, naming, minor improvements
`;

export async function reviewChunk(chunk: DiffChunk): Promise<ReviewResult> {

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `PR Diff Chunk (${chunk.index}):\n\n${chunk.content}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;

    if (!raw) {
      throw new Error(`Empty response for chunk ${chunk.index}`);
    }

    let parsed: Omit<ReviewResult, "chunksProcessed">;

    try {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("Raw AI response:", raw);
      throw new Error(`JSON parse failed for chunk ${chunk.index}`);
    }

    // 2. Validate comments after parse
    const validSeverities = ["critical", "warning", "suggestion"];
    
    const safeComments = (parsed.comments || []).filter(
      (c: ReviewComment) =>
        c &&
        typeof c.issue === "string" &&
        typeof c.file === "string" &&
        typeof c.recommendation === "string" &&
        validSeverities.includes(c.severity),
    );

    return {
      summary: parsed.summary || "",
      comments: safeComments, // ← use safeComments, not parsed.comments
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      chunksProcessed: 1,
    };
  } catch (error) {
    throw new Error(
      `reviewChunk failed at chunk ${chunk.index}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export function mergeReviewResults(
  results: ReviewResult[],
  totalChunks: number,
): ReviewResult {
  if (!results.length) {
    return {
    summary:"No review results available",
    comments: [], 
    score: 0,
    chunksProcessed: 0,
    };
  }

  // Deduplicate comments (file + issue)
  const commentMap = new Map<string, ReviewComment>();

  for (const res of results) {
    for (const comment of res.comments) {
      const key = `${comment.file}-${comment.issue}`;
      if (!commentMap.has(key)) {
        commentMap.set(key, comment);
      }
    }
  }

  const mergedComments = Array.from(commentMap.values());

  // Average score
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;

  // Combine summaries
  const combinedSummary = results.map((r) => r.summary).join(" ");

  // (Optional improvement: you can re-summarize using AI later)

  return {
    summary: combinedSummary,
    comments: mergedComments,
    score: Math.round(avgScore),
    chunksProcessed: totalChunks,
  };
}
