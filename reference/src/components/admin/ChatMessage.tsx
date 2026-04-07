"use client";

import type { ToolResultDisplay } from "@/lib/ai/types";
import { ChatToolResult } from "./ChatToolResult";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolResults?: ToolResultDisplay[];
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  toolResults,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-blue-100 text-blue-600" : "bg-surface-tertiary text-foreground-secondary"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-lg px-3 py-2 text-sm ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-surface-tertiary text-foreground"
          } ${isUser ? "max-w-[85%] ml-auto" : "max-w-full"}`}
        >
          <div className="whitespace-pre-wrap break-words">{content}</div>
          {isStreaming && !content && (
            <span className="inline-flex gap-1">
              <span className="animate-pulse">.</span>
              <span className="animate-pulse delay-100">.</span>
              <span className="animate-pulse delay-200">.</span>
            </span>
          )}
        </div>

        {toolResults && toolResults.length > 0 && (
          <div className="mt-1 space-y-1">
            {toolResults.map((result, i) => (
              <ChatToolResult key={i} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
