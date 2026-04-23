"use client";

import { useEffect, useReducer, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReviewResult, ReviewComment } from "@/types";
import SeverityBadge from "@/components/review/SeverityBadge";
import CategoryBadge from "@/components/review/CategoryBadge";
import DiffViewer from "@/components/review/DiffViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  ExternalLink, 
  FileCode, 
  Loader2, 
  Share2, 
  Download,
  AlertCircle,
  Zap,
  ShieldCheck,
  Code2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

function reviewReducer(state: ReviewPageState, action: ReviewPageAction): ReviewPageState {
  switch (action.type) {
    case "FETCH_START": return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS": {
      const review = action.payload;
      if (!review) return state;
      if (review.status === "PENDING" || review.status === "PROCESSING") return { ...state, status: "polling", review };
      if (review.status === "COMPLETED") return { ...state, status: "completed", review };
      if (review.status === "FAILED") return { ...state, status: "failed", review, error: review.errorMessage ?? "Review failed" };
      return state;
    }
    case "POLL_START": return { ...state, status: "polling" };
    case "COMPLETED": return { ...state, status: "completed", review: action.payload };
    case "FAILED": return { ...state, status: "failed", error: action.payload };
    default: return state;
  }
}

const POLL_INTERVAL_MS = 3000;

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;

  const [state, dispatch] = useReducer(reviewReducer, {
    status: "idle",
    review: null,
    error: null,
  });

  const [diff, setDiff] = useState<string | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState(false);

  const fetchReview = useCallback(async () => {
    try {
      const res = await fetch(`/api/review/${reviewId}`);
      if (!res.ok) throw new Error("Failed to fetch review");
      const data: ReviewData = await res.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (err: unknown) {
      dispatch({ type: "FAILED", payload: err instanceof Error ? err.message : "Something went wrong" });
    }
  }, [reviewId]);

  const fetchDiff = useCallback(async () => {
    if (isDiffLoading) return;
    try {
      setIsDiffLoading(true);
      const res = await fetch(`/api/review/${reviewId}/diff`);
      if (res.ok) {
        const data = await res.json();
        setDiff(data.diff);
      }
    } catch (err) {
      console.warn("Diff fetch error:", err);
    } finally {
      setIsDiffLoading(false);
    }
  }, [reviewId, isDiffLoading]);

  useEffect(() => { fetchReview(); }, [fetchReview]);

  useEffect(() => {
    if (state.status !== "polling") return;
    const interval = setInterval(fetchReview, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.status, fetchReview]);

  useEffect(() => {
    if (state.status === "completed" && !diff) {
      fetchDiff();
    }
  }, [state.status, fetchDiff, diff]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Initializing code review engine...</p>
      </div>
    );
  }

  if (state.status === "polling") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 animate-bounce">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Analysis in Progress</h2>
        <p className="text-muted-foreground mb-8">
          Our AI is currently chunking the diff and performing security & scalability audits.
        </p>
        <div className="w-full space-y-2">
          <Progress value={45} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Processing {state.review?.chunksCount || "?"} code blocks...
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Review Failed</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{state.error}</p>
        <Button onClick={fetchReview}>Try Again</Button>
      </div>
    );
  }

  if (state.status === "completed" && state.review?.result) {
    const { result } = state.review;
    const metrics = result.metrics || { scalabilityScore: 0, securityScore: 0, qualityScore: 0 };

    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {state.review.prTitle || "PR Analysis Result"}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs font-mono">#{reviewId.slice(0, 8)}</Badge>
              <Link href={state.review.prUrl} target="_blank" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> View on GitHub
              </Link>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            <Button className="flex-1 md:flex-none"><Download className="mr-2 h-4 w-4" /> Export Report</Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Global Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="text-6xl font-black text-primary mb-2">{result.score}%</div>
              <Badge variant={result.score > 70 ? "success" : "warning"}>
                {result.score > 70 ? "Passed Review" : "Needs Attention"}
              </Badge>
            </CardContent>
          </Card>

          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <MetricCard icon={Zap} label="Scalability" value={metrics.scalabilityScore} color="text-amber-500" />
            <MetricCard icon={ShieldCheck} label="Security" value={metrics.securityScore} color="text-emerald-500" />
            <MetricCard icon={Code2} label="Quality" value={metrics.qualityScore} color="text-blue-500" />
          </div>
        </div>

        {/* Tabs for Comments & Diff */}
        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
            <TabsTrigger value="comments">Insights & Issues</TabsTrigger>
            <TabsTrigger value="diff">Annotated Diff</TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
                <CardDescription>Overall assessment of code changes and impact.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                Detailed Feedback <Badge variant="secondary">{result.comments.length}</Badge>
              </h3>
              <div className="grid gap-4">
                {result.comments.map((comment, i) => (
                  <CommentCard key={i} comment={comment} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="diff">
             <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                   <CardTitle>Source Code Diff</CardTitle>
                   <CardDescription>Visualization of changes with AI annotations.</CardDescription>
                 </div>
                 <div className="flex gap-2">
                   <Badge variant="outline">Lines: {state.review.linesCount}</Badge>
                   <Badge variant="outline">Chunks: {result.chunksProcessed}</Badge>
                 </div>
               </CardHeader>
               <CardContent className="p-0">
                  {isDiffLoading ? (
                    <div className="p-24 text-center space-y-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Hydrating diff data...</p>
                    </div>
                  ) : diff ? (
                    <div className="max-h-[800px] overflow-auto border-t">
                      <DiffViewer diff={diff} highlightedLines={[]} />
                    </div>
                  ) : (
                    <div className="p-24 text-center text-muted-foreground">Diff data unavailable for this review.</div>
                  )}
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: number, color: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
          <Icon className={`w-4 h-4 ${color}`} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold">{value}%</div>
        <Progress value={value} className="h-1.5" />
      </CardContent>
    </Card>
  );
}

function CommentCard({ comment }: { comment: ReviewComment }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-6 rounded-2xl border bg-card hover:bg-muted/30 transition-colors group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
      
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SeverityBadge severity={comment.severity} />
          <CategoryBadge category={comment.category || "quality"} />
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
            <FileCode className="w-4 h-4" />
            {comment.file}{comment.line ? `:${comment.line}` : ""}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-bold text-lg leading-tight">{comment.issue}</h4>
          <p className="text-muted-foreground leading-relaxed">{comment.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
