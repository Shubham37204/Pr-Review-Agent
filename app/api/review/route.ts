import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { addReviewJob } from "@/lib/queue/addJob";

const ReviewRequestSchema = z.object({
  prUrl: z
    .string()
    .url()
    .regex(
      /github\.com\/[^/]+\/[^/]+\/pull\/\d+/,
      "Must be a valid GitHub PR URL",
    ),
  forceReview: z.boolean().optional().default(false),
});

const DAILY_REVIEW_LIMIT = 10;

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

    // 2. Validate body
    const body = await req.json();
    const parsed = ReviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { prUrl, forceReview } = parsed.data;

    // 3. Find or create user
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: userEmail,
      },
    });

    // Returns 409 Conflict — correct HTTP semantic for "resource already exists"
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        prUrl,
        status: { in: ["COMPLETED", "PENDING", "PROCESSING"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true },
    });

    if (existingReview && !forceReview) {
      return NextResponse.json(
        {
          existingReviewId: existingReview.id,
          status: existingReview.status,
          message: "PR already reviewed",
        },
        { status: 409 },
      );
    }

    // 4. Daily limit check
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reviewCountToday = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    });

    if (reviewCountToday >= DAILY_REVIEW_LIMIT) {
      return NextResponse.json(
        { error: "Daily review limit reached" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(DAILY_REVIEW_LIMIT),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(new Date().setUTCHours(24, 0, 0, 0)),
            "Retry-After": "86400",
          },
        },
      );
    }

    // 5. Create review record
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        prUrl,
        status: "PENDING",
      },
    });

    // 6. Enqueue job — rollback on failure
    try {
      await addReviewJob({
        reviewId: review.id,
        prUrl,
        userId: user.id,
        userEmail,
      });
    } catch (queueErr) {
      await prisma.review.delete({ where: { id: review.id } });
      throw queueErr;
    }

    // 7. Return 202 with rate limit headers
    const remaining = DAILY_REVIEW_LIMIT - (reviewCountToday + 1);

    return NextResponse.json(
      { reviewId: review.id, message: "Review queued" },
      {
        status: 202,
        headers: {
          "X-RateLimit-Limit": String(DAILY_REVIEW_LIMIT),
          "X-RateLimit-Remaining": String(Math.max(0, remaining)),
          "X-RateLimit-Reset": String(new Date().setUTCHours(24, 0, 0, 0)),
        },
      },
    );
  } catch (error) {
    console.error("Error in POST /api/review:", { url: req.url, error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
