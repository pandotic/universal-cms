export interface ConnectedApp {
  id: string;
  name: string;
  url: string;
  supabase_project_url: string;
  admin_deep_link_template: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  last_health_check: string | null;
  created_at: string;
  updated_at: string;
}
