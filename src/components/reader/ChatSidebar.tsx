import { type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BookChatThread, ChatPrompt, LocalChatMessage } from "@/lib/readerTypes";
import type { Highlight } from "@/lib/tauri";
import { Sparkles, Check, PanelRightClose, PlusSquare, History, MessageSquare, X, Eraser, Trash2, MapPin, BookOpen, Feather, Quote, Lightbulb } from "lucide-react";
import { ChatModelSelector } from "./ChatModelSelector";
import { ChatThreadItem } from "./ChatThreadItem";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInputArea } from "./ChatInputArea";

type ChatSidebarProps = {
  contextHint: string;
  messages: LocalChatMessage[];
  prompts: ChatPrompt[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onPromptSelect: (value: string) => void;
  onSend: () => void;
  onNewChat?: () => void;
  chatSending: boolean;
  chatInputRef: RefObject<HTMLTextAreaElement | null>;
  currentModel: string;
  availableModels: string[];
  onModelChange: (model: string) => void;
  modelsLoading: boolean;
  onCollapse: () => void;
  threads: BookChatThread[] | undefined;
  currentThreadId: number | null;
  onSelectThread: (id: number | null) => void;
  onDeleteThread?: (id: number) => void;
  onRenameThread?: (id: number, title: string) => void;
  onClearDefaultChat?: () => void;
  onClearThreadChat?: (id: number) => void;
  onDeleteMessage?: (id: number) => void;
  placeholder?: string;
  isHighlightContext?: boolean;
  attachedContext?: Highlight[];
  onRemoveContext?: (id: number) => void;
  onCitationClick?: (index: number, snippet?: string) => void;
};

export default function ChatSidebar({
  contextHint,
  messages,
  prompts,
  chatInput,
  onChatInputChange,
  onPromptSelect,
  onSend,
  onNewChat,
  chatSending,
  chatInputRef,
  currentModel,
  availableModels,
  onModelChange,
  modelsLoading,
  onCollapse,
  threads = [],
  currentThreadId,
  onSelectThread,
  onDeleteThread,
  onRenameThread,
  onClearDefaultChat,
  onClearThreadChat,
  onDeleteMessage,
  placeholder = "Ask about the text...",
  isHighlightContext = false,
  attachedContext = [],
  onRemoveContext,
  onCitationClick,
}: ChatSidebarProps) {
  return (
    <aside className="min-h-0 flex flex-col">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-card to-background shadow-xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-2 border-b border-border/30 bg-gradient-to-r from-muted/40 via-transparent to-muted/20 px-4 py-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onCollapse}
              title="Collapse right panel"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
            {onNewChat && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                onClick={onNewChat}
                disabled={chatSending}
                title="Start new chat thread"
              >
                <PlusSquare className="h-4 w-4" />
              </Button>
            )}
            {onSelectThread && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    title="Chat history"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-2">
                  <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Chat History
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    <div
                      className={cn(
                        "group flex items-center gap-1 rounded-md px-2 py-2 text-xs hover:bg-muted",
                        currentThreadId === null && "bg-muted font-medium"
                      )}
                    >
                      <button
                        onClick={() => onSelectThread(null)}
                        className="flex-1 text-left"
                      >
                        Default Chat
                      </button>
                      {onClearDefaultChat && currentThreadId === null && messages.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClearDefaultChat();
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                          title="Clear default chat"
                        >
                          <Eraser className="h-3 w-3" />
                        </button>
                      )}
                      {currentThreadId === null && <Check className="h-3 w-3 shrink-0" />}
                    </div>
                    {threads.map((thread) => (
                      <div
                        key={thread.id}
                        className={cn(
                          "group flex flex-col gap-0.5 rounded-md px-2 py-2 text-xs hover:bg-muted",
                          currentThreadId === thread.id && "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {onRenameThread ? (
                            <ChatThreadItem
                              title={thread.title}
                              onRename={(newTitle) => onRenameThread(thread.id, newTitle)}
                            />
                          ) : (
                            <button
                              onClick={() => onSelectThread(thread.id)}
                              className="flex-1 text-left truncate font-medium"
                            >
                              {thread.title}
                            </button>
                          )}
                          {thread.last_cfi && (
                            <MapPin className="h-2.5 w-2.5 text-primary/60" />
                          )}
                          {onClearThreadChat && currentThreadId === thread.id && messages.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onClearThreadChat(thread.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                              title="Clear thread messages"
                            >
                              <Eraser className="h-3 w-3" />
                            </button>
                          )}
                          {onDeleteThread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteThread(thread.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                              title="Delete thread"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          {currentThreadId === thread.id && <Check className="h-3 w-3 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(thread.created_at).toLocaleDateString()} {new Date(thread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
              chatSending 
                ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/10" 
                : (isHighlightContext ? "bg-gradient-to-br from-primary/10 to-accent/10" : "bg-gradient-to-br from-muted to-muted/50")
            )}>
              {chatSending && (
                <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping" />
              )}
              {isHighlightContext ? (
                <MessageSquare className={cn(
                  "h-4 w-4 transition-colors",
                  chatSending ? "text-primary" : "text-primary/70"
                )} />
              ) : (
                <Sparkles className={cn(
                  "h-4 w-4 transition-colors",
                  chatSending ? "text-primary" : "text-muted-foreground"
                )} />
              )}
            </div>
            <div>
              <h2 className="font-serif text-[15px] font-semibold tracking-tight">AI Assistant</h2>
              <p className="text-[11px] text-muted-foreground/70">{contextHint}</p>
            </div>
          </div>

          <ChatModelSelector
            currentModel={currentModel}
            availableModels={availableModels}
            onModelChange={onModelChange}
            modelsLoading={modelsLoading}
            disabled={chatSending}
          />
        </div>

        {/* Quick prompts */}
        {prompts.length > 0 && (
          <div className="shrink-0 flex flex-wrap gap-2 px-4 py-3">
            {prompts.map((prompt, index) => {
              const icons = [BookOpen, Quote, Lightbulb, Feather];
              const Icon = icons[index % icons.length];
              return (
                <Button
                  key={prompt.label}
                  variant="ghost"
                  size="sm"
                  className="group h-8 gap-2 rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/30 px-3 text-xs font-medium shadow-sm transition-all duration-200 hover:border-primary/40 hover:from-primary/5 hover:to-primary/10 hover:shadow-md"
                  onClick={() => {
                    onPromptSelect(prompt.prompt);
                    chatInputRef.current?.focus();
                  }}
                  disabled={chatSending}
                  type="button"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                  {prompt.label}
                </Button>
              );
            })}
          </div>
        )}

        <ChatMessageList 
          messages={messages} 
          chatSending={chatSending} 
          onDeleteMessage={onDeleteMessage} 
          onCitationClick={onCitationClick}
        />

        {/* Context Shelf */}
        {attachedContext.length > 0 && (
          <div className="shrink-0 flex flex-wrap gap-1.5 px-3 py-2 border-t border-border/20 bg-muted/20">
            {attachedContext.map((h: any) => (
              <div
                key={h.id}
                className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 group"
              >
                <MessageSquare className="h-3 w-3 text-primary/70" />
                <span className="text-[10px] font-medium text-primary max-w-[120px] truncate">
                  {h.text}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveContext?.(h.id)}
                  className="rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                  title="Remove context"
                >
                  <X className="h-2.5 w-2.5 text-primary/70" />
                </button>
              </div>
            ))}
          </div>
        )}

        <ChatInputArea 
          chatInput={chatInput} 
          onChatInputChange={onChatInputChange} 
          onSend={onSend} 
          chatSending={chatSending} 
          chatInputRef={chatInputRef} 
          placeholder={placeholder}
        />
      </div>
    </aside>
  );
}