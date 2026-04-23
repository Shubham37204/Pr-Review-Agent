import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma/client";
import PRInputForm from "@/components/review/PRInputForm";
import { StatCard } from "@/components/dashboard/StatCard";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { ActivityFeed, type Activity } from "@/components/dashboard/ActivityFeed";
import { Activity as ActivityIcon, Code, History, Star, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engineering Dashboard</h1>
          <p className="text-muted-foreground">Monitor your PR review insights and quality trends.</p>
        </div>
        <PRInputForm />
      </div>

      <Suspense 
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50 mb-4" />
            <p className="text-muted-foreground animate-pulse">Gathering insights...</p>
          </div>
        }
      >
        <DashboardContent userId={userId} searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({ 
  userId, 
  searchParamsPromise 
}: { 
  userId: string;
  searchParamsPromise: Promise<DashboardSearchParams>;
}) {
  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email: userEmail,
    },
  });

  const searchParams = await searchParamsPromise;
  const { status, sort } = searchParams;

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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Daily Usage" 
          value={`${reviewCountToday} / ${DAILY_REVIEW_LIMIT}`} 
          icon={ActivityIcon}
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
          <OverviewCharts reviews={finalReviews} />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed activities={finalReviews.slice(0, 8).map(review => ({
            id: review.id,
            type: review.status.toLowerCase(),
            title: review.status === "COMPLETED" ? "Review Completed" : `Review ${review.status.charAt(0) + review.status.slice(1).toLowerCase()}`,
            description: review.status === "COMPLETED" 
              ? `${review.prTitle || "PR Analysis"} scored ${(review.result as ReviewScoreShape)?.score}/100`
              : `Analysis for ${review.prTitle || "PR Analysis"} is ${review.status.toLowerCase()}`,
            time: formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }),
            status: review.status === "COMPLETED" ? "completed" : (review.status === "FAILED" ? "flagged" : "processing")
          } as Activity))} />
        </div>
      </div>
    </>
  );
}
