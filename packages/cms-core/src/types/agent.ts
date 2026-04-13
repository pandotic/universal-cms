// ─── Agent Workflows Types ────────────────────────────────────────────────────
// Automated tasks and monitoring per property (SEO audits, broken links, etc.).
// Used by the Pandotic Hub to configure and monitor agent runs.

export type AgentType =
  | "seo_audit"
  | "broken_links"
  | "dependency_update"
  | "content_freshness"
  | "ssl_monitor"
  | "custom";

export type AgentRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentTrigger = "schedule" | "manual" | "webhook";

export interface HubAgent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  agent_type: AgentType;
  config: Record<string, unknown>; // JSON config specific to agent_type
  enabled: boolean;
  schedule: string | null; // Cron expression (e.g., "0 0 * * 0" for weekly)
  property_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type HubAgentInsert = Omit<
  HubAgent,
  "id" | "created_at" | "updated_at"
>;

export type HubAgentUpdate = Partial<
  Omit<HubAgent, "id" | "property_id" | "created_by" | "created_at">
>;

export interface HubAgentRun {
  id: string;
  agent_id: string;
  status: AgentRunStatus;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown> | null; // JSON result payload
  error_message: string | null;
  triggered_by: AgentTrigger;
  property_id: string;
  created_at: string;
}

export type HubAgentRunInsert = Omit<HubAgentRun, "id" | "created_at">;

export type HubAgentRunUpdate = Partial<
  Omit<HubAgentRun, "id" | "agent_id" | "property_id" | "triggered_by" | "created_at">
>;

export interface AgentFilters {
  propertyId?: string;
  agentType?: AgentType;
  enabled?: boolean;
}

export interface AgentRunFilters {
  agentId?: string;
  status?: AgentRunStatus;
  limit?: number;
  offset?: number;
}
