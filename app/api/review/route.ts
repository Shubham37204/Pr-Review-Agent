import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { addReviewJob } from "@/lib/queue/addJob";

// Zod schema — validate input strictly
const ReviewRequestSchema = z.object({
  prUrl: z
    .string()
    .url()
    .regex(
      /github\.com\/[^/]+\/[^/]+\/pull\/\d+/,
      "Must be a valid GitHub PR URL",
    ),
});

// Rate limit config
const DAILY_REVIEW_LIMIT = 10;

export async function POST(req: NextRequest) {
  try {
    // 1. Get userId from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

    // 2. Parse & validate request body
    const body = await req.json();

    const parsed = ReviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { prUrl } = parsed.data;

    // 3. Find or create user
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: userEmail,
      },
    });

    // 4. Check daily usage limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reviewCountToday = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
        },
      },
    });

    if (reviewCountToday >= DAILY_REVIEW_LIMIT) {
      return NextResponse.json(
        { error: "Daily review limit reached" },
        { status: 429 },
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

    // 6. Add job to queue
    try {
      await addReviewJob({
        reviewId: review.id,
        prUrl,
        userId: user.id,
        userEmail,
      });
    } catch (queueErr) {
      await prisma.review.delete({ where: { id: review.id } });
      throw queueErr; // caught by outer try/catch → 500
    }

    // 7. Return 202 Accepted
    return NextResponse.json(
      {
        reviewId: review.id,
        message: "Review queued",
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Error in POST /api/review:", {
      url: req.url,
      error,
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
