import { auth, currentUser } from "@clerk/nextjs/server";
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

type ReviewScoreShape = {
  score?: number;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  // 1. Auth check
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // 2. Get email from Clerk
  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

  // 3. Find or create user in DB
  let user;
  try {
    user = await prisma.user.upsert({
      where: { clerkId: userId! },
      update: {},
      create: {
        clerkId: userId!,
        email: userEmail,
      },
    });
  } catch (err) {
    console.error("=== DB ERROR ===", err);
    throw err;
  }

  // 4. Resolve search params
  const { status, sort } = await searchParams;

  // 5. Dynamic filter
  const whereClause = {
    userId: user.id,
    ...(status ? { status } : {}),
  };

  // 6. Order
  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  // 7. Fetch reviews
  let reviews;
  try {
    reviews = await prisma.review.findMany({
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
  } catch (err) {
    console.error("=== REVIEWS FETCH ERROR ===", err);
    throw err;
  }

  // 8. Score sort — JS level since score is inside JSON field
  if (sort === "score") {
    reviews = reviews.sort((a, b) => {
      const scoreA = (a.result as ReviewScoreShape | null)?.score ?? 0;
      const scoreB = (b.result as ReviewScoreShape | null)?.score ?? 0;
      return scoreB - scoreA;
    });
  }

  // 9. Daily usage count
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let reviewCountToday = 0;
  try {
    reviewCountToday = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    });
  } catch (err) {
    console.error("=== COUNT ERROR ===", err);
  }

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

          <Suspense fallback={<div>Loading filters...</div>}>
            <FilterBar currentStatus={status} currentSort={sort} />
          </Suspense>

          <ReviewList reviews={reviews} />
        </main>
      </div>
    </div>
  );
}
