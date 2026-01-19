import { useState } from "react";
import { cn } from "@/lib/utils";
import { Brain, ChevronRight } from "lucide-react";

export function ChatReasoningTrace({ summary }: { summary: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-1.5 overflow-hidden rounded-lg border border-border/40 bg-muted/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-muted/50"
      >
        <Brain className="h-3.5 w-3.5 text-primary/70" />
        <span className="flex-1 text-[11px] font-medium text-muted-foreground">
          AI Reasoning
        </span>
        <ChevronRight
          className={cn(
            "h-3 w-3 text-muted-foreground/50 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
      </button>
      {isExpanded && (
        <div className="border-t border-border/20 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground/90">
          <div className="prose-sm prose-invert max-w-none">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}
