"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PRInputForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);

    const toastId = toast.loading("Queuing AI review...", {
      description: "Fetching diff and preparing analysis.",
    });

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl: url.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Review queued!", {
          id: toastId,
          description: "Redirecting to your analysis...",
        });
        setUrl("");
        setOpen(false);
        router.push(`/review/${data.reviewId}`);

      } else if (res.status === 409) {
        // Already reviewed — navigate to existing
        toast.info("Already reviewed", {
          id: toastId,
          description: "Opening the existing analysis for this PR.",
        });
        setOpen(false);
        router.push(`/review/${data.existingReviewId}`);

      } else if (res.status === 429) {
        toast.error("Daily limit reached", {
          id: toastId,
          description: "You've used all 10 reviews for today. Resets at midnight UTC.",
          duration: 6000,
        });

      } else if (res.status === 400) {
        toast.error("Invalid PR URL", {
          id: toastId,
          description: "Please paste a valid GitHub pull request URL.",
        });

      } else {
        toast.error("Something went wrong", {
          id: toastId,
          description: data.error || "Please try again in a moment.",
        });
      }
    } catch {
      toast.error("Connection error", {
        id: toastId,
        description: "Could not reach the server. Check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/20 font-semibold gap-2 h-10 px-5">
          <Plus className="h-4 w-4" />
          New Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg">Analyze a Pull Request</DialogTitle>
          </div>
          <DialogDescription>
            Paste any public GitHub PR URL. Our AI will review it for scalability, security, and code quality.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="pr-url-input"
              placeholder="https://github.com/owner/repo/pull/123"
              className="pl-10 h-12 font-mono text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            Analyzes scalability · security · code quality · best practices
          </div>
          <Button
            type="submit"
            className="w-full h-12 font-semibold text-base shadow-md shadow-primary/20"
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Queuing Analysis...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Start AI Review
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
