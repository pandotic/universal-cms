export type PlaybookStepType =
  | "manual"
  | "deploy_skill"
  | "upgrade_cms"
  | "run_agent"
  | "open_url";

export type PlaybookStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface HubPlaybookTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HubPlaybookTemplateStep {
  id: string;
  template_id: string;
  position: number;
  title: string;
  description: string | null;
  step_type: PlaybookStepType;
  step_config: Record<string, unknown>;
  required: boolean;
  created_at: string;
}

export interface HubPlaybookRun {
  id: string;
  template_id: string;
  property_id: string;
  status: PlaybookStatus;
  started_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HubPlaybookRunStep {
  id: string;
  run_id: string;
  template_step_id: string;
  status: PlaybookStatus;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface PlaybookRunWithProgress extends HubPlaybookRun {
  template: HubPlaybookTemplate;
  steps: (HubPlaybookRunStep & { template_step: HubPlaybookTemplateStep })[];
  progress: number; // 0-100
}
