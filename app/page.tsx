import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Code2, ShieldCheck, Zap, GitPullRequest, Layers, Cpu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/brand/Logo";
import Footer from "@/components/layout/Footer";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
              <Link href="#technical" className="hover:text-primary transition-colors">Technical Stack</Link>
              <Link href="https://github.com/Shubham37204/Pr-Review-Agent" target="_blank" className="hover:text-primary transition-colors">GitHub</Link>
            </nav>
            <div className="h-6 w-px bg-border hidden md:block" />
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <Zap className="w-3 h-3" /> Powered by Advanced Agentic AI
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700">
                  ONE AGENT.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-blue-500">
                    SENIOR INSIGHTS.
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
                  Automate your security, scalability, and code quality reviews. 
                  Built for engineering teams that ship with confidence and recruiters 
                  looking for top-tier architectural depth.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <Link href="/sign-up">
                    <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                      Analyze My First PR <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="https://github.com/Shubham37204/Pr-Review-Agent" target="_blank">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold hover:bg-muted transition-colors">
                      <GitPullRequest className="mr-2 w-5 h-5" /> View on GitHub
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-4 pt-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">Built for</span> curious minds, developers & creators
                  </p>
                </div>
              </div>

              <div className="flex-1 relative animate-in zoom-in duration-1000">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-emerald-500/20 blur-3xl -z-10 rounded-full" />
                <div className="relative rounded-3xl border bg-card/50 backdrop-blur-sm p-4 shadow-2xl shadow-primary/10 overflow-hidden group">
                  <Image 
                    src="/pr_agent_landing_hero_asset_1776912883627.png" 
                    alt="AI PR Analysis Visualization" 
                    width={800} 
                    height={600}
                    className="rounded-2xl object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-8 right-8 p-4 bg-background/90 backdrop-blur rounded-xl border shadow-lg animate-bounce">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-xs font-bold uppercase tracking-tighter">Analyzing PR #124...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "AI Analysis Layers", value: "3+", icon: Layers },
                { label: "DeepMind Inspired", value: "100%", icon: Cpu },
                { label: "Avg Review Time", value: "<10s", icon: Zap },
                { label: "Scalable Core", value: "Active", icon: Globe },
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="inline-flex p-2 bg-background rounded-lg border mb-2">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Overview Section */}
        <section id="technical" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-20 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Engineering Excellence</h2>
              <h3 className="text-4xl md:text-5xl font-black tracking-tighter">Not another ChatGPT wrapper.</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                PR Review Agent is architected for production-grade reliability. 
                Instead of switching between multiple tools, everything lives here—from 
                asynchronous background processing to deep security audits.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-10 rounded-[2.5rem] border bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-bold mb-4 tracking-tight">Scalable Architecture</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizes BullMQ and Redis for asynchronous background processing, 
                  ensuring the main thread remains responsive even during heavy diff analysis.
                </p>
              </div>

              <div className="p-10 rounded-[2.5rem] border bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-bold mb-4 tracking-tight">Security Focused</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Automated detection of hardcoded secrets, insecure patterns, and 
                  OWASP vulnerabilities before code ever hits production.
                </p>
              </div>

              <div className="p-10 rounded-[2.5rem] border bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Code2 className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-bold mb-4 tracking-tight">Skill-Based Insights</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Evaluates code for type safety, SOLID principles, and cyclomatic 
                  complexity, providing feedback that improves overall code quality.
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