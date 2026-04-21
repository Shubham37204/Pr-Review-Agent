import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { fetchPRData } from "@/lib/github/fetchPR";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let reviewId: string | undefined;

  try {
    // 1. Auth check
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Await params
    const resolvedParams = await params;
    reviewId = resolvedParams.id;

    if (!reviewId) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    // 3. Fetch review from DB
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        prUrl: true,
        status: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // 4. Ownership check
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user || review.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. Status check
    if (review.status !== "COMPLETED" && review.status !== "PROCESSING") {
      return NextResponse.json(
        { error: "Diff not available for this review status" },
        { status: 400 },
      );
    }

    // 6. Fetch PR data
    const prData = await fetchPRData(review.prUrl);

    const response = NextResponse.json({
      diff: prData.diff,
      filesChanged: prData.filesChanged,
      additions: prData.additions,
      deletions: prData.deletions,
    });

    // 7. Cache header
    response.headers.set("Cache-Control", "private, max-age=3600");

    return response;
  } catch (error) {
    console.error("Error fetching diff:", {
      reviewId,
      url: req.url,
      error,
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
