import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Code2, ShieldCheck, Zap, GitPullRequest } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/brand/Logo";
import Footer from "@/components/layout/Footer";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-4 bg-linear-to-b from-background to-muted/50">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Automate Your Code Reviews <br />
              <span className="text-primary">With Intelligence</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              The AI-powered PR Review Agent that thinks like a senior engineer. 
              Get actionable feedback on scalability, security, and performance in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="px-8 text-lg h-14">
                  Start Free Review <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="https://github.com/Shubham37204/Pr-Review-Agent" target="_blank">
                <Button size="lg" variant="outline" className="px-8 text-lg h-14">
                  <GitPullRequest className="mr-2 w-5 h-5" /> Star on GitHub
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Technical Overview for Recruiters */}
        <section className="py-24 px-4 border-y bg-background">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Recruiter-Friendly Project Overview</h2>
              <p className="text-muted-foreground">Built with high-level engineering principles in mind.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Scalable Architecture</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizes BullMQ and Redis for asynchronous background processing, ensuring the main thread remains responsive even during heavy diff analysis.
                </p>
              </div>

              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Security Focused</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automated detection of hardcoded secrets, insecure patterns, and OWASP vulnerabilities before code ever hits production.
                </p>
              </div>

              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Skill-Based Insights</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Evaluates code for type safety, SOLID principles, and cyclomatic complexity, providing feedback that improves overall code quality.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ / GitHub Section */}
        <section className="py-24 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-xl border">
                <h4 className="font-bold mb-2">How does GitHub integration work?</h4>
                <p className="text-muted-foreground">
                  Simply paste your PR URL. The agent fetches the diff using the GitHub REST API and performs a chunked analysis to handle large changes efficiently.
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border">
                <h4 className="font-bold mb-2">Can I use this for private repos?</h4>
                <p className="text-muted-foreground">
                  Currently, it supports public repositories. Private repo support via GitHub App installation is on the roadmap.
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border">
                <h4 className="font-bold mb-2">How do I contact support?</h4>
                <p className="text-muted-foreground">
                  You can reach out via GitHub Issues or email us at contact@example.com for any technical queries.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}