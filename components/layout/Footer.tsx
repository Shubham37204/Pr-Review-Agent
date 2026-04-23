import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-card/50 py-6 mt-8">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground text-center md:text-left">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>PR Review Agent</strong> — AI-powered code reviews. Built with Next.js, Prisma, and Groq.
          </span>
        </div>
      </div>
    </footer>
  );
}
