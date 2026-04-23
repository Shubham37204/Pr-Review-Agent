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
    <pre className="font-mono text-xs p-3 overflow-x-auto bg-card border rounded-md">
      {lines.map((line) => {
        let lineClass = "px-1.5 py-0.5 border-l-[3px] border-transparent ";

        if (line.type === "added") {
          lineClass += "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
        } else if (line.type === "removed") {
          lineClass += "bg-rose-500/15 text-rose-800 dark:text-rose-300";
        } else if (line.type === "header") {
          lineClass += "bg-muted font-bold text-muted-foreground";
        } else {
          lineClass += "text-foreground";
        }

        const isHighlighted =
          line.lineNumber !== undefined &&
          highlightedLines.includes(line.lineNumber);

        if (isHighlighted) {
          lineClass = lineClass.replace("border-transparent", "border-primary");
        }

        return (
          <div key={line.lineNumber} className={lineClass}>
            {line.content}
          </div>
        );
      })}
    </pre>
  );
}
