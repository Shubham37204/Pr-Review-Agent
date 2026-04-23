import React from "react";
import { Bot } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 group cursor-pointer" aria-label="PR Review Agent Home">
      <div className="bg-primary p-1.5 rounded-lg group-hover:scale-110 transition-transform">
        <Bot className="w-6 h-6 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold tracking-tight">
        PR Review <span className="text-primary">Agent</span>
      </span>
    </div>
  );
}
