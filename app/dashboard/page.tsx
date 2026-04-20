import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ReviewList from "@/components/review/ReviewList";
import PRInputForm from "@/components/review/PRInputForm";

const DAILY_REVIEW_LIMIT = 10;

export default async function DashboardPage() {
  // 1. Auth check
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // 2. Find user in DB
  const user = await prisma.user.findUnique({
    where: { clerkId: userId! },
  });
  if (!user) redirect("/sign-in");

  // 3. Fetch reviews without result field (too heavy for list view)
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      prUrl: true,
      prTitle: true,
      linesCount: true,
      chunksCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div>
      <Navbar />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={{ padding: "20px", flex: 1 }}>
          <h1>Your Reviews</h1>

          {/* Client component — handles input state and POST /api/review */}
          <PRInputForm />

          {/* Usage counter */}
          <p>
            Usage today: {user.usageCount} / {DAILY_REVIEW_LIMIT}
          </p>

          {/* Reviews list — passes typed reviews down */}
          <ReviewList reviews={reviews} />
        </main>
      </div>
    </div>
  );
}
