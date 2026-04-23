import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import ReviewList from "@/components/review/ReviewList";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History as HistoryIcon } from "lucide-react";

export default async function HistoryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) redirect("/dashboard");

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
      result: true,
    },
  });

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

      <Card>
        <CardHeader>
          <CardTitle>Past Analyses</CardTitle>
          <CardDescription>
            You have performed {reviews.length} total reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewList reviews={reviews} />
        </CardContent>
      </Card>
    </div>
  );
}
