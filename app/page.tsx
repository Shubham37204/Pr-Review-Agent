import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, GitPullRequest, Zap, ShieldCheck, Code2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/brand/Logo";
import Footer from "@/components/layout/Footer";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#technical" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="https://github.com/Shubham37204/Pr-Review-Agent" target="_blank" className="hover:text-foreground transition-colors">GitHub</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="font-semibold shadow-md shadow-primary/25 px-5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left — copy */}
            <div className="flex-1 space-y-7 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                <Zap className="w-3 h-3" /> AI Code Review
              </span>

              <div className="space-y-2">
                <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight text-foreground">
                  One agent.
                </h1>
                <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight text-primary">
                  Senior insights.
                </h1>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                Paste a GitHub PR URL and get a full engineering-grade review — covering{" "}
                <Link href="#features" className="text-primary underline-offset-2 hover:underline">scalability</Link>,{" "}
                <Link href="#features" className="text-primary underline-offset-2 hover:underline">security</Link>, and{" "}
                <Link href="#features" className="text-primary underline-offset-2 hover:underline">code quality</Link>{" "}
                — in under 10 seconds. No switching tabs, no manual review.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="h-12 px-8 font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform">
                    Start for free <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="h-12 px-6 font-semibold">
                    See features <ChevronDown className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center lg:justify-start gap-3 pt-1">
                <div className="flex -space-x-2">
                  {["A","B","C","D"].map((l, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-black text-primary">
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Built for <span className="font-semibold text-foreground">curious minds</span>, developers &amp; creators
                </p>
              </div>
            </div>

            {/* Right — visual */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-75" />
                {/* Mock terminal card */}
                <div className="relative rounded-2xl border bg-card shadow-2xl shadow-black/5 overflow-hidden">
                  {/* Terminal top bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-mono text-muted-foreground">PR Analysis — score: 87/100</span>
                  </div>
                  <div className="p-6 font-mono text-sm space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-500 font-bold shrink-0">✔</span>
                      <div>
                        <p className="font-semibold text-foreground">Scalability</p>
                        <p className="text-xs text-muted-foreground mt-0.5">No blocking sync calls detected. Queue usage is optimal.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-amber-500 font-bold shrink-0">⚠</span>
                      <div>
                        <p className="font-semibold text-foreground">Security</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Hardcoded API key found in <code className="bg-muted px-1 rounded">config.ts:14</code>. Use env vars.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-500 font-bold shrink-0">✔</span>
                      <div>
                        <p className="font-semibold text-foreground">Code Quality</p>
                        <p className="text-xs text-muted-foreground mt-0.5">SOLID principles followed. Type coverage: 94%.</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Overall Score</span>
                        <span className="font-black text-primary text-lg">87 / 100</span>
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "87%" }} />
                      </div>
                    </div>
                  </div>
                  {/* Live pulse badge */}
                  <div className="absolute top-16 right-4 flex items-center gap-1.5 bg-background border rounded-full px-3 py-1 shadow-md text-xs font-semibold">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Analyzing PR #124
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="border-y bg-card/60">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "< 10s", label: "Avg review time" },
                { value: "3", label: "AI analysis layers" },
                { value: "100%", label: "Free to start" },
                { value: "10k+", label: "Lines analyzed" },
              ].map((s) => (
                <div key={s.label} className="space-y-1">
                  <p className="text-3xl font-black text-primary tabular-nums">{s.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="rounded-2xl border bg-card p-8 md:p-12 flex flex-col md:flex-row gap-10">
            <div className="flex-1 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">About</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Not another ChatGPT wrapper.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                PR Review Agent is built for engineers who actually care about production quality. Instead of copy-pasting code into a chat box, you get structured, actionable feedback tied to specific files and line numbers. Purpose-built, not a blank chat box.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 shrink-0">
              {[
                { value: "3+", label: "AI analysis layers" },
                { value: "100%", label: "Free to start" },
                { value: "< 10s", label: "Avg response" },
                { value: "Open", label: "Source code" },
              ].map((s) => (
                <div key={s.label} className="bg-muted/50 rounded-xl p-5 text-center">
                  <p className="text-2xl font-black text-primary tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="max-w-6xl mx-auto px-6 pb-20">
          <div className="text-center mb-14 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Features</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">What you can do here</h2>
            <p className="text-muted-foreground">Sign in to access all features — no credit card needed</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Zap,
                iconBg: "bg-amber-50 dark:bg-amber-900/20",
                iconColor: "text-amber-500",
                title: "Scalability Audit",
                desc: "Identifies blocking sync calls, N+1 queries, and patterns that will fail at 10k users. Get queue suggestions automatically.",
                highlight: "auto-queue suggestions",
              },
              {
                icon: ShieldCheck,
                iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
                iconColor: "text-emerald-500",
                title: "Security Scan",
                desc: "Detects hardcoded secrets, missing input validation, and OWASP Top 10 vulnerabilities before code hits production.",
                highlight: "OWASP Top 10 coverage",
              },
              {
                icon: Code2,
                iconBg: "bg-blue-50 dark:bg-blue-900/20",
                iconColor: "text-blue-500",
                title: "Code Quality Score",
                desc: "Evaluates SOLID principles, TypeScript coverage, and naming conventions. Returns a 0–100 quality score per chunk.",
                highlight: "0–100 quality score",
              },
              {
                icon: GitPullRequest,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
                title: "Auto Webhook Review",
                desc: "Configure a GitHub webhook and every new PR is automatically queued for review — zero manual steps.",
                highlight: "zero manual steps",
              },
              {
                icon: ArrowRight,
                iconBg: "bg-rose-50 dark:bg-rose-900/20",
                iconColor: "text-rose-500",
                title: "Score Comparison",
                desc: "Re-review a PR after fixing issues and see the exact improvement. Track how your code evolves over iterations.",
                highlight: "track improvements",
              },
              {
                icon: Zap,
                iconBg: "bg-violet-50 dark:bg-violet-900/20",
                iconColor: "text-violet-500",
                title: "BullMQ Background Jobs",
                desc: "Large PRs are chunked and processed asynchronously — the UI never blocks. Built on Redis for reliability.",
                highlight: "never blocks the UI",
              },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border bg-card p-6 hover:shadow-lg hover:shadow-black/5 transition-all hover:-translate-y-0.5">
                <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-5`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc.replace(f.highlight, "")}
                  <span className={`font-semibold ${f.iconColor}`}>{f.highlight}</span>
                  {"."}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="technical" className="bg-foreground text-background">
          <div className="max-w-6xl mx-auto px-6 py-20 text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Ready to review smarter?
            </h2>
            <p className="text-lg opacity-70 max-w-xl mx-auto">
              Start for free. No credit card. No setup. Just paste a PR URL and see what a senior engineer sees.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-13 px-10 font-bold bg-primary text-white hover:bg-primary/90 shadow-2xl mt-4">
                Analyze My First PR <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}