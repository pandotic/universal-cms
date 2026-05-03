// Pandotic Media Runner — main loop.
//
// Long-running Node worker. Polls hub_agent_runs for pending runs,
// dispatches to the matching agent handler, runs the Managed Agents
// session, and persists results.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadConfig } from "./config.js";
import { log, setLogLevel } from "./log.js";
import { ManagedAgentsClient } from "./managed-agents-client.js";
import { claimNextRun } from "./poll.js";
import { runSession } from "./session.js";
import {
  buildLongFormKickoff,
  extractLongFormPayload,
} from "./agents/long-form-writer.js";
import { persistLongFormResult, finalizeRun } from "./persist.js";

let shuttingDown = false;

function installShutdownHandlers(): void {
  for (const sig of ["SIGTERM", "SIGINT"] as const) {
    process.on(sig, () => {
      if (shuttingDown) return;
      shuttingDown = true;
      log.info("shutdown signal received — draining current run", { signal: sig });
    });
  }
  process.on("uncaughtException", (err) => {
    log.error("uncaughtException", { error: err.message, stack: err.stack });
    shuttingDown = true;
    setTimeout(() => process.exit(1), 250).unref();
  });
  process.on("unhandledRejection", (reason) => {
    log.error("unhandledRejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const config = loadConfig();
  setLogLevel(config.logLevel);

  log.info("media-runner booting", {
    poll_interval_ms: config.pollIntervalMs,
    agent_types: config.agentTypes,
    beta: config.anthropicBeta,
  });

  installShutdownHandlers();

  const supabase = createClient(config.hubSupabaseUrl, config.hubServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const client = new ManagedAgentsClient({
    apiKey: config.anthropicApiKey,
    beta: config.anthropicBeta,
  });

  while (!shuttingDown) {
    let run;
    try {
      run = await claimNextRun(supabase, config.agentTypes);
    } catch (err) {
      log.error("claimNextRun threw", {
        error: err instanceof Error ? err.message : String(err),
      });
      await sleep(config.pollIntervalMs);
      continue;
    }

    if (!run) {
      await sleep(config.pollIntervalMs);
      continue;
    }

    log.info("claimed run", {
      run_id: run.run_id,
      agent_type: run.agent_type,
      property_id: run.property_id,
    });

    try {
      await dispatch(supabase, client, run, config.maxStreamReconnects);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("dispatch threw", { run_id: run.run_id, error: msg });
      // Best-effort failure stamp so the row doesn't sit in 'running' forever.
      await supabase
        .from("hub_agent_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: msg,
        })
        .eq("id", run.run_id);
    }
  }

  log.info("media-runner exiting");
}

async function dispatch(
  supabase: SupabaseClient,
  client: ManagedAgentsClient,
  run: Awaited<ReturnType<typeof claimNextRun>>,
  maxReconnects: number
): Promise<void> {
  if (!run) return;

  // PR 2 only handles long_form_writer. PR 3 wires media_generator.
  if (run.agent_type !== "long_form_writer") {
    throw new Error(
      `unsupported agent_type for runner v0.1: ${run.agent_type}`
    );
  }

  const session = await runSession({
    client,
    supabase,
    run,
    buildKickoff: buildLongFormKickoff,
    maxReconnects,
  });

  if (session.status === "failed" || session.final_message_text == null) {
    await finalizeRun(supabase, run, session, {
      status: "failed",
      error: session.error_message ?? "session ended without producing a final message",
    });
    return;
  }

  let payload;
  try {
    payload = extractLongFormPayload(session.final_message_text);
  } catch (err) {
    await finalizeRun(supabase, run, session, {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const { pipeline_id, qa_review_id } = await persistLongFormResult(
    supabase,
    run,
    session,
    payload
  );

  await finalizeRun(supabase, run, session, {
    status: "completed",
    payload: {
      pipeline_id,
      qa_review_id,
      title: payload.title,
    },
  });

  log.info("run completed", {
    run_id: run.run_id,
    session_id: session.session_id,
    pipeline_id,
  });
}

main().catch((err) => {
  log.error("fatal", {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});
