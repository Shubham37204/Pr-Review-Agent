import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart2,
  ShieldCheck,
  Zap,
  Code2,
  GitPullRequest,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

const DAILY_REVIEW_LIMIT = 10;

export default async function UsagePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) redirect("/dashboard");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalReviews,
    reviewCountToday,
    completedCount,
    failedCount,
    pendingCount,
    avgScoreResult,
    totalLinesAnalyzed,
  ] = await Promise.all([
    prisma.review.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { userId: user.id, createdAt: { gte: today } } }),
    prisma.review.count({ where: { userId: user.id, status: "COMPLETED" } }),
    prisma.review.count({ where: { userId: user.id, status: "FAILED" } }),
    prisma.review.count({ where: { userId: user.id, status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.review.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      select: { result: true },
    }),
    prisma.review.aggregate({
      where: { userId: user.id },
      _sum: { linesCount: true },
    }),
  ]);

  const scores = avgScoreResult
    .map((r: any) => r.result?.score as number | undefined)
    .filter((s): s is number => typeof s === "number");
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const totalLines = totalLinesAnalyzed._sum.linesCount ?? 0;
  const dailyUsagePct = Math.round((reviewCountToday / DAILY_REVIEW_LIMIT) * 100);
  const successRate = totalReviews > 0 ? Math.round((completedCount / totalReviews) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <BarChart2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage & Insights</h1>
          <p className="text-muted-foreground">Your personal analytics and review performance overview.</p>
        </div>
      </div>

      {/* Daily Quota */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <CardTitle>Daily Quota</CardTitle>
          </div>
          <CardDescription>You can analyze up to {DAILY_REVIEW_LIMIT} PRs per day. Resets at midnight UTC.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Used today</span>
            <span className="font-bold tabular-nums">
              {reviewCountToday} / {DAILY_REVIEW_LIMIT}
            </span>
          </div>
          <Progress value={dailyUsagePct} className="h-3" />
          <div className="flex items-center gap-2">
            {reviewCountToday >= DAILY_REVIEW_LIMIT ? (
              <Badge variant="destructive">Limit Reached — Resets Tomorrow</Badge>
            ) : (
              <Badge variant="success">{DAILY_REVIEW_LIMIT - reviewCountToday} reviews remaining today</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lifetime Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Reviews",
            value: totalReviews,
            icon: GitPullRequest,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Completed",
            value: completedCount,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Failed",
            value: failedCount,
            icon: XCircle,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
          },
          {
            label: "In Progress",
            value: pendingCount,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-3xl font-black tabular-nums">{stat.value}</span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base">Avg Quality Score</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black mb-3 tabular-nums">{avgScore}%</div>
            <Progress value={avgScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Across all completed reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-500" />
              <CardTitle className="text-base">Lines Analyzed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black mb-3 tabular-nums">
              {totalLines >= 1000
                ? `${(totalLines / 1000).toFixed(1)}k`
                : totalLines}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total lines of code reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-base">Success Rate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black mb-3 tabular-nums">{successRate}%</div>
            <Progress value={successRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Reviews that completed without errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Focus Areas (informational) */}
      <Card>
        <CardHeader>
          <CardTitle>What We Look For</CardTitle>
          <CardDescription>
            Behind the scenes, we test your code against these three key areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                label: "Performance",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                desc: "We make sure your code won't slow down when your app gets popular. We look for heavy database queries and slow loops.",
              },
              {
                icon: ShieldCheck,
                label: "Security",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                desc: "We check if your code is safe from common attacks, like missing validation or accidentally exposed secrets.",
              },
              {
                icon: Code2,
                label: "Code Quality",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                desc: "We ensure your code is clean, easy to read, and follows modern best practices so your team can maintain it easily.",
              },
            ].map((area) => (
              <div key={area.label} className="flex gap-4 p-4 rounded-xl border bg-muted/20">
                <div className={`p-2 rounded-lg h-fit ${area.bg}`}>
                  <area.icon className={`w-5 h-5 ${area.color}`} />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">{area.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{area.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
