import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma/client";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ReviewList from "@/components/review/ReviewList";
import PRInputForm from "@/components/review/PRInputForm";
import FilterBar from "@/components/review/FilterBar";

const DAILY_REVIEW_LIMIT = 10;

interface DashboardSearchParams {
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  sort?: "newest" | "oldest" | "score";
}

// Local type for score extraction only — does not conflict with exported ReviewResult
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

  const user = await prisma.user.findUnique({
    where: { clerkId: userId! },
  });
  if (!user) redirect("/sign-in");

  const { status, sort } = await searchParams;

  const whereClause = {
    userId: user.id,
    ...(status ? { status } : {}),
  };

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  // Fetch result field only when needed for score sorting
  // Avoids loading full AI review JSON for every card in list view
  let reviews = await prisma.review.findMany({
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
      ...(sort === "score" ? { result: true } : {}),
    },
  });

  // Score sort — JS level since score is inside JSON field
  if (sort === "score") {
    reviews = reviews.sort((a, b) => {
      const scoreA = (a.result as ReviewScoreShape | null)?.score ?? 0;
      const scoreB = (b.result as ReviewScoreShape | null)?.score ?? 0;
      return scoreB - scoreA;
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewCountToday = await prisma.review.count({
    where: { userId: user.id, createdAt: { gte: today } },
  });

  return (
    <div>
      <Navbar />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={{ padding: "20px", flex: 1 }}>
          <h1>Your Reviews</h1>

          <PRInputForm />

          <p>
            Usage today: {reviewCountToday} / {DAILY_REVIEW_LIMIT}
          </p>

          {/* Suspense required for useSearchParams inside FilterBar */}
          <Suspense fallback={<div>Loading filters...</div>}>
            <FilterBar currentStatus={status} currentSort={sort} />
          </Suspense>

          <ReviewList reviews={reviews} />
        </main>
      </div>
    </div>
  );
}
