"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronRight, FileDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Review {
  id: string;
  status: string;
  prUrl: string;
  prTitle: string | null;
  linesCount: number | null;
  createdAt: Date;
  result: any;
}

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">No reviews found. Start by adding a PR URL above.</p>
      </div>
    );
  }

  const exportToCSV = () => {
    const headers = ["ID", "Title", "URL", "Status", "Score", "Date"];
    const rows = reviews.map(r => [
      r.id,
      r.prTitle || "N/A",
      r.prUrl,
      r.status,
      r.result?.score || 0,
      r.createdAt.toISOString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "reviews_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overflow-x-auto">
      <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
        <h3 className="text-sm font-semibold">Activity Logs</h3>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <FileDown className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
          <tr>
            <th className="px-6 py-4 font-medium">Pull Request</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Score</th>
            <th className="px-6 py-4 font-medium">Analyzed</th>
            <th className="px-6 py-4 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {reviews.map((review) => (
            <tr key={review.id} className="hover:bg-muted/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-foreground line-clamp-1">
                    {review.prTitle || "Untitled Review"}
                  </span>
                  <Link 
                    href={review.prUrl} 
                    target="_blank" 
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {new URL(review.prUrl).pathname.split('/').slice(-3).join('/')}
                  </Link>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={review.status} />
              </td>
              <td className="px-6 py-4">
                {review.status === "COMPLETED" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full" 
                        style={{ width: `${review.result?.score || 0}%` }}
                      />
                    </div>
                    <span className="font-mono font-medium">{review.result?.score || 0}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/review/${review.id}`}>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/review/${review.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete Record</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="success">Completed</Badge>;
    case "PROCESSING":
      return <Badge variant="info" className="animate-pulse">Processing</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}
