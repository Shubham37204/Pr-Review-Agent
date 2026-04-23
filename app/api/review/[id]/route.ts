import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/logger";

interface ReviewResponse {
  id: string;
  status: string;
  prUrl: string;
  prTitle: string | null;
  linesCount: number | null;
  chunksCount: number | null;
  createdAt: Date;
  result?: unknown;
  errorMessage?: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let reviewId: string | undefined;
  try {
    // 1. Auth check
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get reviewId from params
    const { id } = await params;
    reviewId = id;

    // 3. Fetch review from DB
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        status: true,
        result: true,
        linesCount: true,
        chunksCount: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        prUrl: true,
        prTitle: true,
      },
    });

    // 4. Not found
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // 5. Ownership check
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || review.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 6. Build response based on status
    const responseData: ReviewResponse = {
      id: review.id,
      status: review.status,
      prUrl: review.prUrl,
      prTitle: review.prTitle,
      linesCount: review.linesCount,
      chunksCount: review.chunksCount,
      createdAt: review.createdAt,
    };

    if (review.status === "COMPLETED") {
      responseData.result = review.result;
    }

    if (review.status === "FAILED") {
      responseData.errorMessage = "Review processing failed. Please try again.";
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    logger.error("GET /api/review/[id] failed", {
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
