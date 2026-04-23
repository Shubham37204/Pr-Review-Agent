import Link from "next/link";
import { GitPullRequest, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PR Review Agent. Built for engineering excellence.
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              href="https://github.com/Shubham37204/Pr-Review-Agent" 
              target="_blank"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>GitHub</span>
            </Link>
            <Link 
              href="mailto:contact@example.com" 
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
