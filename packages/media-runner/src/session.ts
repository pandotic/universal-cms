// Session execution loop. Implements the four key Managed Agents patterns:
//
//   Pattern 7: open SSE stream BEFORE sending the kickoff user_message.
//   Pattern 1: lossless reconnect — on SSE drop, fetch missed events via
//              listEvents({after: lastEventId}), dedupe, then resume tail.
//   Pattern 5: idle-break gate — break only on session.status_idle when
//              stop_reason.type !== 'requires_action'.
//   Pattern 9: host-side custom tools — handled in PR 3 (gemini/heygen).

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ManagedAgentsClient,
  ManagedAgentsApiError,
  type SessionEvent,
} from "./managed-agents-client.js";
import type { ClaimedRun } from "./poll.js";
import { log } from "./log.js";

export interface SessionResult {
  session_id: string;
  status: "completed" | "failed";
  events: SessionEvent[];
  final_message_text: string | null;
  error_message: string | null;
}

interface RunSessionOpts {
  client: ManagedAgentsClient;
  supabase: SupabaseClient;
  run: ClaimedRun;
  buildKickoff: (run: ClaimedRun) => string;
  maxReconnects: number;
}

export async function runSession(opts: RunSessionOpts): Promise<SessionResult> {
  const { client, supabase, run, buildKickoff, maxReconnects } = opts;

  // 1. Create session referencing the persisted Managed Agent ID.
  const session = await client.createSession({
    agent: run.managed_agent_id,
    metadata: {
      hub_run_id: run.run_id,
      property_id: run.property_id,
      agent_slug: run.agent_slug,
    },
  });

  log.info("session created", {
    session_id: session.id,
    run_id: run.run_id,
    agent: run.managed_agent_id,
  });

  // Persist session_id immediately so a crashed runner can resume.
  await supabase
    .from("hub_agent_runs")
    .update({ session_id: session.id })
    .eq("id", run.run_id);

  // 2. Pattern 7: open the SSE stream BEFORE sending the kickoff.
  let stream = await client.openEventStream(session.id);
  log.debug("stream opened", { session_id: session.id });

  // 3. Send kickoff user_message via createSession-like endpoint? No — sessions
  //    take inputs[] on creation. Since we already created without inputs,
  //    push the kickoff via POST /v1/sessions/{id}/inputs (per beta spec).
  //    Encapsulate via the client; for the pilot we treat sendInput as a
  //    direct fetch call.
  const kickoffText = buildKickoff(run);
  await client.sendUserMessage(session.id, kickoffText);
  log.debug("kickoff sent", { session_id: session.id, len: kickoffText.length });

  // 4. Drain the stream. On SSE error, do Pattern 1 reconnect.
  const seenIds = new Set<string>();
  const events: SessionEvent[] = [];
  let lastEventId: string | undefined;
  let reconnects = 0;
  let finalMessageText: string | null = null;
  let terminalReason: "completed" | "failed" | null = null;
  let errorMessage: string | null = null;

  drain: while (true) {
    try {
      for await (const ev of stream.events) {
        if (seenIds.has(ev.id)) continue;
        seenIds.add(ev.id);
        events.push(ev);
        lastEventId = ev.id;

        // Capture latest assistant text — we'll use it as the final result
        // when the session goes idle.
        if (ev.type === "agent.message") {
          const data = ev.data as { text?: string; content?: Array<{ text?: string }> };
          if (typeof data.text === "string") {
            finalMessageText = data.text;
          } else if (Array.isArray(data.content)) {
            const joined = data.content
              .map((c) => (typeof c.text === "string" ? c.text : ""))
              .filter((s) => s.length > 0)
              .join("\n");
            if (joined.length > 0) finalMessageText = joined;
          }
        }

        // Pattern 5: idle-break gate.
        if (ev.type === "session.status_idle") {
          const stopReason = (ev.data?.stop_reason ?? null) as
            | { type?: string }
            | null;
          if (stopReason?.type === "requires_action") {
            // Tool use pending. PR 2 doesn't dispatch any host-side tools,
            // but if the model requests one anyway we don't break — wait for
            // the next idle. PR 3 will handle the tool here.
            log.debug("idle requires_action — waiting for next idle", {
              session_id: session.id,
            });
            continue;
          }
          terminalReason = stopReason?.type === "end_turn" ? "completed" : "failed";
          if (terminalReason === "failed") {
            errorMessage = `session ended with stop_reason=${stopReason?.type ?? "unknown"}`;
          }
          break drain;
        }

        if (ev.type === "session.status_failed") {
          terminalReason = "failed";
          errorMessage =
            ((ev.data?.error as { message?: string })?.message ?? null) ??
            "session.status_failed without error.message";
          break drain;
        }
      }
      // Stream returned cleanly without a terminal event — confirm via REST
      // before treating as success (defensive against truncated SSE bodies).
      const live = await client.getSession(session.id);
      if (live.status === "completed" || live.status === "idle") {
        terminalReason = "completed";
      } else if (live.status === "failed" || live.status === "cancelled") {
        terminalReason = "failed";
        errorMessage = `session ended with status=${live.status}`;
      } else {
        // Still running — fall through to reconnect.
        throw new Error("stream closed mid-run");
      }
      break drain;
    } catch (err) {
      // Pattern 1: lossless reconnect.
      stream.close();
      reconnects++;
      if (reconnects > maxReconnects) {
        terminalReason = "failed";
        errorMessage =
          err instanceof Error
            ? `stream reconnect limit reached: ${err.message}`
            : "stream reconnect limit reached";
        break drain;
      }
      log.warn("stream dropped — reconnecting", {
        session_id: session.id,
        attempt: reconnects,
        last_event_id: lastEventId,
        error: err instanceof Error ? err.message : String(err),
      });

      // Backfill anything we missed via REST.
      try {
        const missed = await client.listEvents({
          session_id: session.id,
          after: lastEventId,
        });
        for (const ev of missed.data) {
          if (seenIds.has(ev.id)) continue;
          seenIds.add(ev.id);
          events.push(ev);
          lastEventId = ev.id;
        }
        log.debug("backfilled missed events", {
          session_id: session.id,
          count: missed.data.length,
        });
      } catch (backfillErr) {
        log.warn("backfill listEvents failed — continuing with SSE only", {
          session_id: session.id,
          error:
            backfillErr instanceof Error
              ? backfillErr.message
              : String(backfillErr),
        });
      }

      // Reopen with last-event-id so the server can replay.
      const backoff = Math.min(500 * 2 ** (reconnects - 1), 5000);
      await sleep(backoff);
      try {
        stream = await client.openEventStream(session.id, {
          lastEventId,
        });
      } catch (reopenErr) {
        if (reopenErr instanceof ManagedAgentsApiError && reopenErr.status === 404) {
          terminalReason = "failed";
          errorMessage = `session ${session.id} not found on reconnect`;
          break drain;
        }
        // Treat as another drop and let the loop retry until limit.
        log.warn("stream reopen failed", {
          session_id: session.id,
          error:
            reopenErr instanceof Error ? reopenErr.message : String(reopenErr),
        });
        continue;
      }
    }
  }

  stream.close();

  return {
    session_id: session.id,
    status: terminalReason ?? "failed",
    events,
    final_message_text: finalMessageText,
    error_message: errorMessage,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
