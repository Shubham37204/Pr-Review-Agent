import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma/client";
import ReviewList from "@/components/review/ReviewList";
import PRInputForm from "@/components/review/PRInputForm";
import FilterBar from "@/components/review/FilterBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Activity, Code, History, Star } from "lucide-react";

const DAILY_REVIEW_LIMIT = 10;

interface DashboardSearchParams {
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  sort?: "newest" | "oldest" | "score";
}

type ReviewScoreShape = {
  score?: number;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

  const user = await prisma.user.upsert({
    where: { clerkId: userId! },
    update: {},
    create: {
      clerkId: userId!,
      email: userEmail,
    },
  });

  const { status, sort } = await searchParams;

  const whereClause = {
    userId: user.id,
    ...(status ? { status } : {}),
  };

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [reviews, totalReviews, reviewCountToday] = await Promise.all([
    prisma.review.findMany({
      where: whereClause,
      orderBy,
      select: {
        id: true,
        status: true,
        prUrl: true,
        prTitle: true,
        linesCount: true,
        chunksCount: true,
        createdAt: true,
        updatedAt: true,
        result: true,
      },
    }),
    prisma.review.count({
      where: { userId: user.id },
    }),
    prisma.review.count({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    }),
  ]);

  let finalReviews = reviews;

  if (sort === "score") {
    finalReviews = [...reviews].sort((a, b) => {
      const scoreA = (a.result as ReviewScoreShape | null)?.score ?? 0;
      const scoreB = (b.result as ReviewScoreShape | null)?.score ?? 0;
      return scoreB - scoreA;
    });
  }

  const completedReviews = finalReviews.filter(r => r.status === "COMPLETED");
  const avgScore = completedReviews.length > 0 
    ? Math.round(completedReviews.reduce((acc, r) => acc + ((r.result as ReviewScoreShape)?.score || 0), 0) / completedReviews.length)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engineering Dashboard</h1>
          <p className="text-muted-foreground">Monitor your PR review insights and quality trends.</p>
        </div>
        <PRInputForm />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Daily Usage" 
          value={`${reviewCountToday} / ${DAILY_REVIEW_LIMIT}`} 
          icon={Activity}
          description="Reviews performed today"
          trend={{ value: `${Math.round((reviewCountToday / DAILY_REVIEW_LIMIT) * 100)}%`, positive: reviewCountToday < DAILY_REVIEW_LIMIT }}
        />
        <StatCard 
          title="Total Reviews" 
          value={totalReviews} 
          icon={History}
          description="Lifetime PR scans"
        />
        <StatCard 
          title="Avg Quality Score" 
          value={`${avgScore}%`} 
          icon={Star}
          description="Based on last 50 reviews"
          className="text-primary"
        />
        <StatCard 
          title="Lines Analyzed" 
          value={finalReviews.reduce((acc, r) => acc + (r.linesCount || 0), 0).toLocaleString()} 
          icon={Code}
          description="Total code footprint"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewCharts />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Reviews</h2>
          <Suspense fallback={<div className="h-10 w-48 bg-muted animate-pulse rounded-md" />}>
            <FilterBar currentStatus={status} currentSort={sort} />
          </Suspense>
        </div>
        
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <ReviewList reviews={reviews} />
        </div>
      </div>
    </div>
  );
}
