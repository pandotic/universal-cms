// Writes session results back to the Hub DB.
//
// For long_form_writer: insert hub_content_pipeline row in qa_review +
// pending hub_content_qa_reviews row (mirrors long-form-writer-helper.ts
// --write semantics so the existing review flow keeps working).
//
// Then transitions hub_agent_runs.status = completed/failed and stamps
// completed_at + result.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClaimedRun } from "./poll.js";
import type { SessionResult } from "./session.js";
import type { LongFormPayload } from "./agents/long-form-writer.js";
import { log } from "./log.js";

const PIPELINE_TABLE = "hub_content_pipeline";
const QA_TABLE = "hub_content_qa_reviews";
const REVIEWER_AGENT = "marketing-skeptical-reviewer";

export async function persistLongFormResult(
  supabase: SupabaseClient,
  run: ClaimedRun,
  session: SessionResult,
  payload: LongFormPayload
): Promise<{ pipeline_id: string; qa_review_id: string }> {
  const { data: pipelineItem, error: insertErr } = await supabase
    .from(PIPELINE_TABLE)
    .insert({
      property_id: run.property_id,
      brief_id: null,
      channel: "blog",
      platform: null,
      content_type: "blog",
      title: payload.title,
      body: payload.body,
      excerpt: payload.excerpt,
      media_urls: [],
      hashtags: [],
      status: "qa_review",
      drafted_by_agent: run.agent_slug,
      qa_confidence: null,
      source_content_id: null,
      metadata: {
        ...(payload.metadata ?? {}),
        managed_agent_session_id: session.session_id,
        hub_agent_run_id: run.run_id,
      },
      created_by: run.agent_slug,
    })
    .select("id")
    .single();

  if (insertErr) throw insertErr;

  const { data: review, error: reviewErr } = await supabase
    .from(QA_TABLE)
    .insert({
      content_id: pipelineItem.id,
      content_table: PIPELINE_TABLE,
      reviewer_agent: REVIEWER_AGENT,
      overall_confidence: null,
      status: null,
      checks: null,
      suggested_fixes: [],
      human_override: false,
      override_reason: null,
    })
    .select("id")
    .single();

  if (reviewErr) throw reviewErr;

  return { pipeline_id: pipelineItem.id, qa_review_id: review.id };
}

export async function finalizeRun(
  supabase: SupabaseClient,
  run: ClaimedRun,
  session: SessionResult,
  outcome:
    | { status: "completed"; payload: Record<string, unknown> }
    | { status: "failed"; error: string }
): Promise<void> {
  const completedAt = new Date().toISOString();

  // Trim the events log — store metadata + recent events only, not the full
  // SSE history (some sessions emit hundreds of streaming token events).
  const recentEvents = session.events.slice(-25).map((ev) => ({
    id: ev.id,
    type: ev.type,
    created_at: ev.created_at,
  }));

  const updateBase: Record<string, unknown> = {
    status: outcome.status,
    completed_at: completedAt,
    session_id: session.session_id,
  };

  if (outcome.status === "completed") {
    updateBase.result = {
      ...(outcome.payload ?? {}),
      session_id: session.session_id,
      event_count: session.events.length,
      recent_events: recentEvents,
    };
    updateBase.error_message = null;
  } else {
    updateBase.error_message = outcome.error;
    updateBase.result = {
      session_id: session.session_id,
      event_count: session.events.length,
      recent_events: recentEvents,
      error: outcome.error,
    };
  }

  const { error } = await supabase
    .from("hub_agent_runs")
    .update(updateBase)
    .eq("id", run.run_id);

  if (error) {
    log.error("finalizeRun: update failed", {
      run_id: run.run_id,
      error: error.message,
    });
    throw error;
  }
}
