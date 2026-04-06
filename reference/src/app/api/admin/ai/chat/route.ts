import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin, apiError } from "@/lib/api/auth";
import { getCmsTools } from "@/lib/ai/tools";
import { executeTool } from "@/lib/ai/tool-executor";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import type { SSEEvent } from "@/lib/ai/types";

function sendSSE(
  controller: ReadableStreamDefaultController,
  event: SSEEvent
) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 503 }
    );
  }

  let body: { messages: Anthropic.MessageParam[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const tools = getCmsTools();
  const systemPrompt = buildSystemPrompt();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let currentMessages: Anthropic.MessageParam[] = [...body.messages];
        let loopCount = 0;
        const maxLoops = 10; // safety limit

        while (loopCount < maxLoops) {
          loopCount++;

          // Call Claude with streaming
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            tools,
          });

          // Process response content blocks
          const toolUseBlocks: Anthropic.ContentBlockParam[] = [];

          for (const block of response.content) {
            if (block.type === "text") {
              sendSSE(controller, { type: "text_delta", text: block.text });
            } else if (block.type === "tool_use") {
              // Notify client that a tool is being called
              sendSSE(controller, {
                type: "tool_start",
                toolName: block.name,
                toolId: block.id,
              });

              // Execute the tool
              try {
                const { raw, display } = await executeTool(
                  block.name,
                  block.input as Record<string, unknown>
                );

                sendSSE(controller, {
                  type: "tool_result",
                  toolName: block.name,
                  toolId: block.id,
                  result: display,
                });

                // Collect for the next iteration
                toolUseBlocks.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify(raw),
                });
              } catch (err) {
                const errorMsg =
                  err instanceof Error ? err.message : "Tool execution failed";
                sendSSE(controller, {
                  type: "tool_result",
                  toolName: block.name,
                  toolId: block.id,
                  result: {
                    toolName: block.name,
                    success: false,
                    summary: errorMsg,
                  },
                });

                toolUseBlocks.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify({ error: errorMsg }),
                  is_error: true,
                });
              }
            }
          }

          // If no tool calls were made, we're done
          if (toolUseBlocks.length === 0) break;

          // Continue the loop with tool results
          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: response.content },
            { role: "user", content: toolUseBlocks },
          ];
        }

        sendSSE(controller, { type: "done" });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        sendSSE(controller, { type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
