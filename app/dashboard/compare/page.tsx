import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

type ReviewScoreShape = { score?: number };

export default async function ComparePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/dashboard");

  // Fetch all completed reviews, grouped by prUrl
  const allReviews = await prisma.review.findMany({
    where: { userId: user.id, status: "COMPLETED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      prUrl: true,
      prTitle: true,
      status: true,
      result: true,
      createdAt: true,
    },
  });

  // Group by prUrl — keep only PRs reviewed more than once
  const grouped: Record<string, typeof allReviews> = {};
  for (const r of allReviews) {
    if (!grouped[r.prUrl]) grouped[r.prUrl] = [];
    grouped[r.prUrl].push(r);
  }

  const comparablePRs = Object.entries(grouped)
    .filter(([, reviews]) => reviews.length >= 2)
    .map(([prUrl, reviews]) => ({
      prUrl,
      first: reviews[0],
      latest: reviews[reviews.length - 1],
      totalRuns: reviews.length,
    }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Review Comparison</h1>
            <p className="text-muted-foreground">
              Track score improvements across re-reviews of the same PR.
            </p>
          </div>
        </div>
      </div>

      {comparablePRs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
              <GitCompare className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">No comparisons yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Re-review the same PR URL to see score progression here. Use the
                "Force Re-review" option on any existing review.
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {comparablePRs.length} PR{comparablePRs.length > 1 ? "s" : ""} with multiple reviews found.
          </p>
          {comparablePRs.map(({ prUrl, first, latest, totalRuns }) => {
            const firstScore = (first.result as ReviewScoreShape)?.score ?? 0;
            const latestScore = (latest.result as ReviewScoreShape)?.score ?? 0;
            const delta = latestScore - firstScore;
            const improved = delta > 0;
            const regressed = delta < 0;

            return (
              <Card key={prUrl} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-base font-bold truncate">
                        {first.prTitle || "Pull Request"}
                      </CardTitle>
                      <Link
                        href={prUrl}
                        target="_blank"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{prUrl.replace("https://github.com/", "")}</span>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary">
                        <RefreshCw className="w-3 h-3 mr-1" /> {totalRuns} runs
                      </Badge>
                      {improved && (
                        <Badge variant="success" className="gap-1">
                          <TrendingUp className="w-3 h-3" /> +{delta}pts
                        </Badge>
                      )}
                      {regressed && (
                        <Badge variant="destructive" className="gap-1">
                          <TrendingDown className="w-3 h-3" /> {delta}pts
                        </Badge>
                      )}
                      {delta === 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Minus className="w-3 h-3" /> No change
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* First Review */}
                    <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          First Review
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(first.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-4xl font-black tabular-nums">
                        {firstScore}
                        <span className="text-lg text-muted-foreground font-normal">%</span>
                      </div>
                      <Progress value={firstScore} className="h-2" />
                      <Link href={`/review/${first.id}`}>
                        <Button variant="ghost" size="sm" className="w-full text-xs mt-1">
                          View Analysis <ArrowRight className="ml-1 w-3 h-3" />
                        </Button>
                      </Link>
                    </div>

                    {/* Latest Review */}
                    <div
                      className={`space-y-3 p-4 rounded-xl border ${
                        improved
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : regressed
                          ? "bg-rose-500/5 border-rose-500/20"
                          : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Latest Review
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(latest.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`text-4xl font-black tabular-nums ${
                          improved
                            ? "text-emerald-500"
                            : regressed
                            ? "text-rose-500"
                            : ""
                        }`}
                      >
                        {latestScore}
                        <span className="text-lg text-muted-foreground font-normal">%</span>
                      </div>
                      <Progress
                        value={latestScore}
                        className={`h-2 ${improved ? "[&>div]:bg-emerald-500" : regressed ? "[&>div]:bg-rose-500" : ""}`}
                      />
                      <Link href={`/review/${latest.id}`}>
                        <Button variant="ghost" size="sm" className="w-full text-xs mt-1">
                          View Analysis <ArrowRight className="ml-1 w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Delta Summary */}
                  <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-muted/20 border-dashed border">
                    <span className="text-sm text-muted-foreground">Score moved</span>
                    <span className="font-black text-lg tabular-nums">{firstScore}%</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span
                      className={`font-black text-lg tabular-nums ${
                        improved ? "text-emerald-500" : regressed ? "text-rose-500" : ""
                      }`}
                    >
                      {latestScore}%
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        improved ? "text-emerald-500" : regressed ? "text-rose-500" : "text-muted-foreground"
                      }`}
                    >
                      ({improved ? "+" : ""}{delta} points)
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
