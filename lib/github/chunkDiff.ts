export interface DiffChunk {
  index: number;
  content: string;
  tokenEstimate: number;
}

const MAX_TOKENS_PER_CHUNK = 3000; // safe limit for Groq free tier
const AVG_CHARS_PER_TOKEN = 4;

export function chunkDiff(diff: string): DiffChunk[] {
  
  if (!diff || diff.trim().length === 0) {
    throw new Error("PR diff is empty — possibly a binary-only PR");
  }

  // Split by file boundaries (each file starts with "diff --git")
  const files = diff.split(/(?=diff --git )/).filter(Boolean);
  const chunks: DiffChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const file of files) {
    const estimatedTokens = Math.ceil(file.length / AVG_CHARS_PER_TOKEN);

    // If single file exceeds limit, split by hunk boundaries
    if (estimatedTokens > MAX_TOKENS_PER_CHUNK) {
      const hunks = file.split(/(?=@@)/).filter(Boolean);
      for (const hunk of hunks) {
        const hunkTokens = Math.ceil(hunk.length / AVG_CHARS_PER_TOKEN);
        if (
          Math.ceil(currentChunk.length / AVG_CHARS_PER_TOKEN) + hunkTokens >
          MAX_TOKENS_PER_CHUNK
        ) {
          if (currentChunk) {
            chunks.push({
              index: chunkIndex++,
              content: currentChunk,
              tokenEstimate: Math.ceil(
                currentChunk.length / AVG_CHARS_PER_TOKEN,
              ),
            });
            currentChunk = "";
          }
        }
        currentChunk += hunk;
      }
      if (currentChunk) {
        chunks.push({
          index: chunkIndex++,
          content: currentChunk,
          tokenEstimate: Math.ceil(currentChunk.length / AVG_CHARS_PER_TOKEN),
        });
        currentChunk = ""; // reset so next file starts clean
      }
      continue;
    }

    // If adding this file would exceed limit, flush current chunk
    if (
      Math.ceil(currentChunk.length / AVG_CHARS_PER_TOKEN) + estimatedTokens >
      MAX_TOKENS_PER_CHUNK
    ) {
      if (currentChunk) {
        chunks.push({
          index: chunkIndex++,
          content: currentChunk,
          tokenEstimate: Math.ceil(currentChunk.length / AVG_CHARS_PER_TOKEN),
        });
        currentChunk = "";
      }
    }

    currentChunk += file;
  }

  // Push remaining
  if (currentChunk) {
    chunks.push({
      index: chunkIndex++,
      content: currentChunk,
      tokenEstimate: Math.ceil(currentChunk.length / AVG_CHARS_PER_TOKEN),
    });
  }

  return chunks;
}
