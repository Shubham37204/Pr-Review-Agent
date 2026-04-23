import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma/client";
import ReviewList from "@/components/review/ReviewList";
import FilterBar from "@/components/review/FilterBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History as HistoryIcon } from "lucide-react";

export const dynamic = "force-dynamic";

interface HistorySearchParams {
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  sort?: "newest" | "oldest" | "score";
}

type ReviewScoreShape = {
  score?: number;
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<HistorySearchParams>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) redirect("/dashboard");

  const { status, sort } = await searchParams;

  const whereClause = {
    userId: user.id,
    ...(status ? { status } : {}),
  };

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const reviews = await prisma.review.findMany({
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
  });

  let finalReviews = reviews;

  if (sort === "score") {
    finalReviews = [...reviews].sort((a, b) => {
      const scoreA = (a.result as ReviewScoreShape | null)?.score ?? 0;
      const scoreB = (b.result as ReviewScoreShape | null)?.score ?? 0;
      return scoreB - scoreA;
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <HistoryIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review History</h1>
          <p className="text-muted-foreground">A complete audit log of all your analyzed pull requests.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Suspense fallback={<div className="h-10 w-48 bg-muted animate-pulse rounded-md" />}>
          <FilterBar currentStatus={status} currentSort={sort} />
        </Suspense>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Past Analyses</CardTitle>
          <CardDescription>
            Showing {finalReviews.length} reviews matching your filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewList reviews={finalReviews} />
        </CardContent>
      </Card>
    </div>
  );
}
