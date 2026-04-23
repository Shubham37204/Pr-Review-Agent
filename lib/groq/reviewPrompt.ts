import { groq } from "./groqClient";
import type { DiffChunk } from "@/lib/github/chunkDiff";

export interface ReviewComment {
  severity: "critical" | "warning" | "suggestion";
  file: string;
  line?: number;
  issue: string;
  recommendation: string;
  category: "scalability" | "security" | "quality" | "performance";
}

export interface ReviewResult {
  summary: string;
  comments: ReviewComment[];
  score: number;
  chunksProcessed: number;
  metrics: {
    scalabilityScore: number;
    securityScore: number;
    qualityScore: number;
  };
}

const SYSTEM_PROMPT = `
You are a senior software engineer performing a thorough code review.
Analyze the given PR diff and return ONLY a valid JSON object.

Evaluate the code based on these core categories:
1. SCALABILITY: Can this handle 10k+ users? Are there blocking sync calls? Suggest queue/background jobs if needed.
2. CODE QUALITY: Check for missing error handling, lack of logging, weak testability, or poor folder structure.
3. SECURITY: Look for missing input validation, hardcoded secrets, or OWASP vulnerabilities.
4. BEST PRACTICES: Check for type safety, rate limiting, and API versioning.

Return this exact shape:
{
  "summary": "string — 2-3 sentence overall assessment",
  "comments": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "category": "scalability" | "security" | "quality" | "performance",
      "file": "filename",
      "line": number or null,
      "issue": "what is wrong",
      "recommendation": "what to do instead"
    }
  ],
  "score": number between 0 and 100,
  "metrics": {
    "scalabilityScore": 0-100,
    "securityScore": 0-100,
    "qualityScore": 0-100
  }
}
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
      comments: safeComments,
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      metrics: {
        scalabilityScore: Number(parsed.metrics?.scalabilityScore) || 0,
        securityScore: Number(parsed.metrics?.securityScore) || 0,
        qualityScore: Number(parsed.metrics?.qualityScore) || 0,
      },
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
      summary: "No review results available",
      comments: [],
      score: 0,
      metrics: {
        scalabilityScore: 0,
        securityScore: 0,
        qualityScore: 0,
      },
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

  // Combine summaries
  const combinedSummary = results.map((r) => r.summary).join(" ");

  // Average score and metrics
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  const avgMetrics = results.reduce(
    (acc, r) => ({
      scalabilityScore: acc.scalabilityScore + (r.metrics?.scalabilityScore || 0),
      securityScore: acc.securityScore + (r.metrics?.securityScore || 0),
      qualityScore: acc.qualityScore + (r.metrics?.qualityScore || 0),
    }),
    { scalabilityScore: 0, securityScore: 0, qualityScore: 0 }
  );

  const num = results.length;

  return {
    summary: combinedSummary,
    comments: mergedComments,
    score: Math.round(avgScore),
    metrics: {
      scalabilityScore: Math.round(avgMetrics.scalabilityScore / num),
      securityScore: Math.round(avgMetrics.securityScore / num),
      qualityScore: Math.round(avgMetrics.qualityScore / num),
    },
    chunksProcessed: totalChunks,
  };
}
