"use client";

import { useMemo } from "react";

interface DiffLine {
  type: "added" | "removed" | "context" | "header";
  content: string;
  lineNumber?: number;
}

interface DiffViewerProps {
  diff: string;
  highlightedLines?: number[];
}

function parseDiff(diff: string): DiffLine[] {
  return diff.split("\n").map((line, index) => {
    let type: DiffLine["type"] = "context";

    if (line.startsWith("+") && !line.startsWith("+++")) {
      type = "added";
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      type = "removed";
    } else if (line.startsWith("@@")) {
      type = "header";
    }

    return {
      type,
      content: line,
      lineNumber: index + 1,
    };
  });
}

export default function DiffViewer({
  diff,
  highlightedLines = [],
}: DiffViewerProps) {
  //  Hook must always run
  const lines = useMemo(() => parseDiff(diff || ""), [diff]);

  //  Safe guard AFTER hooks
  if (!diff) return null;

  return (
    <pre
      style={{
        fontFamily: "monospace",
        fontSize: "12px",
        padding: "12px",
        overflowX: "auto",
        backgroundColor: "#f6f8fa",
        borderRadius: "6px",
      }}
    >
      {lines.map((line) => {
        let backgroundColor = "transparent";
        let fontWeight: "normal" | "bold" = "normal";

        if (line.type === "added") backgroundColor = "#e6ffed";
        if (line.type === "removed") backgroundColor = "#ffeef0";
        if (line.type === "header") {
          backgroundColor = "#eee";
          fontWeight = "bold";
        }

        const isHighlighted =
          line.lineNumber !== undefined &&
          highlightedLines.includes(line.lineNumber);

        return (
          <div
            key={line.lineNumber}
            style={{
              backgroundColor,
              fontWeight,
              padding: "2px 6px",
              borderLeft: isHighlighted ? "3px solid #0070f3" : "none",
            }}
          >
            {line.content}
          </div>
        );
      })}
    </pre>
  );
}
