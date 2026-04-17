import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubPlaybookRun,
  HubPlaybookRunStep,
  HubPlaybookTemplate,
  HubPlaybookTemplateStep,
  PlaybookRunWithProgress,
  PlaybookStatus,
} from "../types/playbooks";

// ─── Templates ──────────────────────────────────────────────────────────────

export async function listPlaybookTemplates(
  client: SupabaseClient,
): Promise<HubPlaybookTemplate[]> {
  const { data, error } = await client
    .from("hub_playbook_templates")
    .select("*")
    .order("category")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getPlaybookTemplate(
  client: SupabaseClient,
  slug: string,
): Promise<HubPlaybookTemplate & { steps: HubPlaybookTemplateStep[] }> {
  const { data, error } = await client
    .from("hub_playbook_templates")
    .select("*, steps:hub_playbook_template_steps(*)")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return { ...data, steps: (data.steps as HubPlaybookTemplateStep[]).sort((a, b) => a.position - b.position) };
}

// ─── Runs ────────────────────────────────────────────────────────────────────

export async function listPlaybookRuns(
  client: SupabaseClient,
  filters?: { propertyId?: string; status?: PlaybookStatus },
): Promise<HubPlaybookRun[]> {
  let q = client.from("hub_playbook_runs").select("*");
  if (filters?.propertyId) q = q.eq("property_id", filters.propertyId);
  if (filters?.status) q = q.eq("status", filters.status);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPlaybookRunWithProgress(
  client: SupabaseClient,
  runId: string,
): Promise<PlaybookRunWithProgress> {
  const { data, error } = await client
    .from("hub_playbook_runs")
    .select(`
      *,
      template:hub_playbook_templates(*),
      steps:hub_playbook_run_steps(
        *,
        template_step:hub_playbook_template_steps(*)
      )
    `)
    .eq("id", runId)
    .single();
  if (error) throw error;
  const steps = (data.steps ?? []) as PlaybookRunWithProgress["steps"];
  const required = steps.filter((s) => s.template_step.required);
  const done = required.filter((s) => s.status === "completed").length;
  return {
    ...data,
    template: data.template as HubPlaybookTemplate,
    steps,
    progress: required.length > 0 ? Math.round((done / required.length) * 100) : 0,
  };
}

export async function startPlaybookRun(
  client: SupabaseClient,
  templateId: string,
  propertyId: string,
  startedBy: string,
): Promise<HubPlaybookRun> {
  // Get template steps
  const { data: templateSteps, error: stepsErr } = await client
    .from("hub_playbook_template_steps")
    .select("id")
    .eq("template_id", templateId)
    .order("position");
  if (stepsErr) throw stepsErr;

  const { data: run, error: runErr } = await client
    .from("hub_playbook_runs")
    .insert({
      template_id: templateId,
      property_id: propertyId,
      status: "in_progress",
      started_by: startedBy,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (runErr) throw runErr;

  if (templateSteps && templateSteps.length > 0) {
    const { error: stepInsertErr } = await client.from("hub_playbook_run_steps").insert(
      templateSteps.map((s) => ({
        run_id: run.id,
        template_step_id: s.id,
        status: "not_started",
      })),
    );
    if (stepInsertErr) throw stepInsertErr;
  }

  return run;
}

export async function completePlaybookStep(
  client: SupabaseClient,
  runStepId: string,
  completedBy: string,
  notes?: string,
): Promise<void> {
  const { error } = await client
    .from("hub_playbook_run_steps")
    .update({
      status: "completed",
      completed_by: completedBy,
      completed_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq("id", runStepId);
  if (error) throw error;
}

export async function updatePlaybookRunStatus(
  client: SupabaseClient,
  runId: string,
  status: PlaybookStatus,
): Promise<void> {
  const { error } = await client
    .from("hub_playbook_runs")
    .update({
      status,
      ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", runId);
  if (error) throw error;
}
