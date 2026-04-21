import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { addReviewJob } from "@/lib/queue/addJob";
import crypto from "crypto";

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET!;

// ✅ Verify GitHub signature
async function verifyGitHubSignature(
  req: NextRequest,
  rawBody: string,
): Promise<boolean> {
  try {
    const signature = req.headers.get("x-hub-signature-256");

    if (!signature) return false;

    const computedHash = crypto
      .createHmac("sha256", GITHUB_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const expectedSignature = `sha256=${computedHash}`;

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    // Prevent length mismatch crash
    if (sigBuffer.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let reviewId: string | undefined;

  try {
    // 1. Raw body
    const rawBody = await req.text();

    // 2. Verify signature
    const isValid = await verifyGitHubSignature(req, rawBody);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Event type
    const event = req.headers.get("x-github-event");

    if (event !== "pull_request") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    // 4. Parse payload
    const payload = JSON.parse(rawBody);

    // 5. Action filtering
    const action = payload.action;

    if (action !== "opened" && action !== "synchronize") {
      return NextResponse.json({ message: "Action ignored" }, { status: 200 });
    }

    // 6. Extract PR data
    const prUrl: string = payload.pull_request.html_url;

    // 7. Find user (simplified)
    const user = await prisma.user.findFirst({
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "No user found for repo" },
        { status: 200 },
      );
    }

    // 8. Prevent duplicate processing
    const existingReview = await prisma.review.findFirst({
      where: {
        prUrl,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
      select: { id: true },
    });

    if (existingReview) {
      return NextResponse.json(
        { message: "Review already in progress" },
        { status: 200 },
      );
    }

    // 9. Create review + enqueue job (transaction-safe)
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        prUrl,
        status: "PENDING",
      },
      select: { id: true },
    });

    reviewId = review.id;

    try {
      await addReviewJob({
        reviewId,
        prUrl,
        userId: user.id,
        userEmail: user.email,
      });
    } catch (queueError) {
      // rollback if queue fails
      await prisma.review.delete({
        where: { id: reviewId },
      });

      throw queueError;
    }

    // 10. Success response
    return NextResponse.json(
      {
        message: "Review queued",
        reviewId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Webhook error:", {
      reviewId,
      error,
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
