import { Button } from "@/components/ui/button";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import { Message, MessageAvatar, MessageContent, MessageAction } from "@/components/ui/message";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { Trash2, Feather, Quote } from "lucide-react";
import type { LocalChatMessage } from "@/lib/readerTypes";

type ChatMessageListProps = {
  messages: LocalChatMessage[];
  chatSending: boolean;
  onDeleteMessage?: (id: number) => void;
  onCitationClick?: (index: number, snippet?: string) => void;
};

export function ChatMessageList({
  messages,
  chatSending,
  onDeleteMessage,
  onCitationClick,
}: ChatMessageListProps) {
  return (
    <ChatContainerRoot className="flex-1 min-h-0">
      <ChatContainerContent className="gap-6 p-4">
        {messages.length ? (
          <>
            {messages.map((message: any) => {
              const isUser = message.role === "user";
              return (
                <div key={message.id} className="group/msg relative">
                  <Message
                    className={cn(isUser && "flex-row-reverse")}
                  >
                    <MessageAvatar
                      src=""
                      alt={isUser ? "You" : "Assistant"}
                      fallback={isUser ? "U" : "✦"}
                      className={cn(
                        "h-8 w-8 text-[10px] font-black rounded-none shadow-none border-2",
                        isUser 
                          ? "bg-[#E02E2E] text-white border-[#E02E2E]" 
                          : "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                      )}
                    />
                    <div className={cn("flex max-w-[85%] flex-col", isUser && "items-end")}>
                      <MessageContent
                        markdown={!isUser}
                        onCitationClick={message.onCitationClick ?? onCitationClick}
                        className={cn(
                          "w-full text-xs font-medium leading-relaxed py-3 px-4 shadow-none rounded-none border-2",
                          isUser 
                            ? "bg-[#E02E2E]/5 border-[#E02E2E] text-foreground" 
                            : "bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/20 text-foreground"
                        )}
                      >
                        {message.content}
                      </MessageContent>
                    </div>
                  </Message>
                  {onDeleteMessage && (
                    <div className={cn(
                      "absolute -top-2 opacity-0 group-hover/msg:opacity-100 transition-all duration-200",
                      isUser ? "left-10" : "right-10"
                    )}>
                      <MessageAction
                        tooltip="Delete message"
                        side="top"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-none bg-background border-2 border-black/20 dark:border-white/20 text-muted-foreground hover:bg-red-500 hover:text-white hover:border-red-500"
                          onClick={() => {
                            const confirmed = message.role === 'assistant' 
                              ? window.confirm("Are you sure you want to delete this AI response?")
                              : true;
                            if (confirmed) {
                              onDeleteMessage(Number(message.id));
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </MessageAction>
                    </div>
                  )}
                </div>
              );
            })}
            {chatSending && (
              <Message>
                <MessageAvatar
                  src=""
                  alt="Assistant"
                  fallback="✦"
                  className="h-8 w-8 text-[10px] font-black rounded-none bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-none"
                />
                <div className="rounded-none py-3 px-4 bg-black/5 dark:bg-white/5 border-2 border-black/20 dark:border-white/20 shadow-none">
                  <Loader variant="loading-dots" size="sm" text="Thinking" className="font-bold uppercase tracking-widest text-[10px]" />
                </div>
              </Message>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center py-12">
            <div className="relative text-center max-w-[280px]">
              {/* Icon with sharp Bauhaus box */}
              <div className="relative mx-auto mb-8 h-20 w-20">
                <div className="absolute inset-0 border-4 border-black dark:border-white" />
                <div className="absolute inset-2 border-2 border-black/20 dark:border-white/20" />
                <div className="absolute inset-4 flex items-center justify-center bg-[#E02E2E]">
                  <Feather className="h-8 w-8 text-white" />
                </div>
              </div>
              
              {/* Typography */}
              <h3 className="mb-3 font-sans text-sm font-black uppercase tracking-tighter text-foreground">
                LITERARY ASSISTANT
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed text-muted-foreground">
                EXPLORE DEEPER INTERPRETATIONS OF THE TEXT.
              </p>
              
              {/* Geometric divider */}
              <div className="mx-auto mt-8 flex items-center justify-center gap-4">
                <div className="h-1 w-12 bg-black dark:bg-white" />
                <Quote className="h-4 w-4 text-[#E02E2E] fill-current" />
                <div className="h-1 w-12 bg-black dark:bg-white" />
              </div>
            </div>
          </div>
        )}
        <ChatContainerScrollAnchor />
      </ChatContainerContent>
    </ChatContainerRoot>
  );
}
