import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Webhook,
  CheckCircle2,
  Copy,
  GitPullRequest,
  ShieldCheck,
  Zap,
  Terminal,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const WEBHOOK_URL = `${APP_URL}/api/webhook`;

export default async function WebhooksPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/dashboard");

  // Fetch reviews that were auto-triggered (no specific field, we'll show recent ones)
  const recentWebhookReviews = await prisma.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      prUrl: true,
      prTitle: true,
      status: true,
      createdAt: true,
    },
  });

  const isWebhookConfigured = !!process.env.GITHUB_WEBHOOK_SECRET;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Webhook className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GitHub Webhooks</h1>
          <p className="text-muted-foreground">
            Auto-trigger AI reviews the moment a PR is opened — zero manual input.
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <Card className={isWebhookConfigured ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}>
        <CardContent className="flex items-center gap-4 py-4">
          {isWebhookConfigured ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-bold text-sm">
              {isWebhookConfigured ? "Webhook Secret Configured" : "Webhook Secret Not Set"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isWebhookConfigured
                ? "Your server is ready to receive and verify GitHub webhook events."
                : "Set GITHUB_WEBHOOK_SECRET in your .env.local to enable webhook verification."}
            </p>
          </div>
          <Badge variant={isWebhookConfigured ? "success" : "warning"}>
            {isWebhookConfigured ? "Active" : "Setup Required"}
          </Badge>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>Event-driven, zero-config PR analysis pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-0 md:gap-0">
            {[
              {
                step: "01",
                icon: GitPullRequest,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                title: "PR Opened on GitHub",
                desc: "Developer opens or updates a pull request in your repository.",
              },
              {
                step: "02",
                icon: ShieldCheck,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                title: "HMAC Signature Verified",
                desc: "Our server verifies the request using SHA-256 HMAC to prevent spoofing.",
              },
              {
                step: "03",
                icon: Zap,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                title: "Review Auto-Queued",
                desc: "Job is pushed to BullMQ. Worker picks it up and runs the full AI analysis.",
              },
            ].map((step, i, arr) => (
              <div key={step.step} className="flex md:flex-col flex-row md:flex-1 gap-4 md:gap-0 items-start md:items-center relative">
                <div className="flex flex-col md:flex-row items-center md:w-full">
                  <div className="flex flex-col items-center md:flex-1">
                    <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center mb-0 md:mb-4`}>
                      <step.icon className={`w-7 h-7 ${step.color}`} />
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="hidden md:block h-px w-8 bg-border mx-2 flex-shrink-0" />
                  )}
                </div>
                <div className="md:text-center pb-6 md:pb-0 md:px-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Step {step.step}</p>
                  <p className="font-bold text-sm mb-1">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <CardTitle>Setup Instructions</CardTitle>
          </div>
          <CardDescription>Configure your GitHub repository to send events to this endpoint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook URL */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">1. Webhook Endpoint URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-4 py-3 rounded-lg font-mono border break-all">
                {WEBHOOK_URL}
              </code>
              <CopyButton text={WEBHOOK_URL} />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">2. GitHub Repository Settings</p>
            <ol className="space-y-3 text-sm">
              {[
                <>Go to your GitHub repo → <strong>Settings → Webhooks → Add webhook</strong></>,
                <>Set <strong>Payload URL</strong> to the endpoint above</>,
                <>Set <strong>Content type</strong> to <code className="text-xs bg-muted px-1.5 py-0.5 rounded">application/json</code></>,
                <>Set <strong>Secret</strong> to your <code className="text-xs bg-muted px-1.5 py-0.5 rounded">GITHUB_WEBHOOK_SECRET</code> value</>,
                <>Under events, select <strong>Pull requests</strong> only</>,
                <>Click <strong>Add webhook</strong> — done!</>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/settings/apps"
              target="_blank"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 w-3 h-3" /> Open GitHub Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Review Activity</CardTitle>
          <CardDescription>Latest reviews — including any auto-triggered by webhooks.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentWebhookReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {recentWebhookReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GitPullRequest className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {review.prTitle || review.prUrl.replace("https://github.com/", "")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Badge
                      variant={
                        review.status === "COMPLETED"
                          ? "success"
                          : review.status === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {review.status}
                    </Badge>
                    <Link href={`/review/${review.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
