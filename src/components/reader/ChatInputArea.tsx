import { type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import { Send } from "lucide-react";

type ChatInputAreaProps = {
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSend: () => void;
  chatSending: boolean;
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
};

export function ChatInputArea({
  chatInput,
  onChatInputChange,
  onSend,
  chatSending,
  chatInputRef,
  placeholder = "Ask about the text...",
}: ChatInputAreaProps) {
  return (
    <div className="shrink-0 border-t border-border/30 bg-gradient-to-t from-muted/20 to-transparent p-4">
      <PromptInput
        value={chatInput}
        onValueChange={onChatInputChange}
        onSubmit={onSend}
        isLoading={chatSending}
        className="rounded-2xl border-border/40 bg-background/80 shadow-lg backdrop-blur-sm transition-all focus-within:border-primary/30 focus-within:shadow-xl focus-within:shadow-primary/5"
      >
        <PromptInputTextarea
          ref={chatInputRef}
          placeholder={placeholder}
          className="min-h-[48px] text-sm placeholder:text-muted-foreground/50"
        />
        <PromptInputActions className="justify-between pt-2 border-t border-border/20 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <kbd className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[9px]">⌘</kbd>
            <span>+</span>
            <kbd className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[9px]">↵</kbd>
            <span className="ml-1">to send</span>
          </span>
          <PromptInputAction tooltip="Send message">
            <Button
              size="sm"
              onClick={onSend}
              disabled={chatSending || !chatInput.trim()}
              className="h-8 gap-2 rounded-xl bg-primary px-4 font-medium shadow-md transition-all hover:shadow-lg disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="text-xs">Send</span>
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
