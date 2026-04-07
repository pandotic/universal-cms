// Types for the AI chat interface

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolResults?: ToolResultDisplay[];
  timestamp: string;
}

export interface ToolResultDisplay {
  toolName: string;
  success: boolean;
  summary: string;
  data?: Record<string, unknown>;
  link?: { label: string; href: string };
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

/** SSE event types sent from server to client */
export type SSEEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; toolName: string; toolId: string }
  | { type: "tool_result"; toolName: string; toolId: string; result: ToolResultDisplay }
  | { type: "done" }
  | { type: "error"; message: string };
