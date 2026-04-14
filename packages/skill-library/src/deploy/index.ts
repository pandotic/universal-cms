// ─── Deploy Adapters ──────────────────────────────────────────────────────
// Platform-specific adapters for executing skills against different site types.
// The Hub manages state; adapters handle the actual execution handoff.

import type {
  DeployAdapter,
  DeployContext,
  DeployResult,
  DeployTargetType,
} from "../types/index";

// ─── Universal CMS Adapter ───────────────────────────────────────────────
// For sites running @pandotic/universal-cms — calls the site's API directly.

export const universalCmsAdapter: DeployAdapter = {
  targetType: "universal_cms",

  async execute(context: DeployContext): Promise<DeployResult> {
    const startTime = Date.now();
    const { property, config, skill } = context;
    const apiUrl = `${property.url.replace(/\/$/, "")}/api/skills/execute`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.api_key ? { Authorization: `Bearer ${config.api_key}` } : {}),
        },
        body: JSON.stringify({
          skill_slug: skill.slug,
          config,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          success: false,
          error: `API returned ${response.status}: ${body}`,
          metrics: { duration_ms: Date.now() - startTime },
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        metrics: { duration_ms: Date.now() - startTime },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        metrics: { duration_ms: Date.now() - startTime },
      };
    }
  },

  async validate(context: DeployContext): Promise<boolean> {
    const { property } = context;
    try {
      const response = await fetch(
        `${property.url.replace(/\/$/, "")}/api/skills/health`,
        { method: "GET" }
      );
      return response.ok;
    } catch {
      return false;
    }
  },
};

// ─── WordPress Adapter ───────────────────────────────────────────────────
// For WordPress sites — calls via WP REST API or a lightweight plugin endpoint.

export const wordpressAdapter: DeployAdapter = {
  targetType: "wordpress",

  async execute(context: DeployContext): Promise<DeployResult> {
    const startTime = Date.now();
    const { property, config, skill } = context;
    const apiUrl = `${property.url.replace(/\/$/, "")}/wp-json/pandotic/v1/skills/execute`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.wp_application_password
            ? { Authorization: `Basic ${config.wp_application_password}` }
            : {}),
        },
        body: JSON.stringify({
          skill_slug: skill.slug,
          config,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          success: false,
          error: `WP API returned ${response.status}: ${body}`,
          metrics: { duration_ms: Date.now() - startTime },
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        metrics: { duration_ms: Date.now() - startTime },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        metrics: { duration_ms: Date.now() - startTime },
      };
    }
  },

  async validate(context: DeployContext): Promise<boolean> {
    const { property } = context;
    try {
      const response = await fetch(
        `${property.url.replace(/\/$/, "")}/wp-json/pandotic/v1/skills/health`,
        { method: "GET" }
      );
      return response.ok;
    } catch {
      return false;
    }
  },
};

// ─── Webhook Adapter ─────────────────────────────────────────────────────
// Generic adapter for static sites or custom targets — fires a webhook.

export const webhookAdapter: DeployAdapter = {
  targetType: "custom",

  async execute(context: DeployContext): Promise<DeployResult> {
    const startTime = Date.now();
    const { config, skill, deployment } = context;
    const webhookUrl = config.webhook_url as string | undefined;

    if (!webhookUrl) {
      return {
        success: false,
        error: "No webhook_url configured for this deployment",
        metrics: { duration_ms: Date.now() - startTime },
      };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.webhook_secret
            ? { "X-Webhook-Secret": config.webhook_secret as string }
            : {}),
        },
        body: JSON.stringify({
          skill_slug: skill.slug,
          deployment_id: deployment.id,
          config,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          success: false,
          error: `Webhook returned ${response.status}: ${body}`,
          metrics: { duration_ms: Date.now() - startTime },
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        metrics: { duration_ms: Date.now() - startTime },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        metrics: { duration_ms: Date.now() - startTime },
      };
    }
  },

  async validate(context: DeployContext): Promise<boolean> {
    const { config } = context;
    return typeof config.webhook_url === "string" && config.webhook_url.length > 0;
  },
};

// ─── Adapter Registry ─────────────────────────────────────────────────────

const adapters: Record<DeployTargetType, DeployAdapter> = {
  universal_cms: universalCmsAdapter,
  wordpress: wordpressAdapter,
  static: webhookAdapter,
  custom: webhookAdapter,
};

export function getAdapter(targetType: DeployTargetType): DeployAdapter {
  const adapter = adapters[targetType];
  if (!adapter) {
    throw new Error(`No deploy adapter registered for target type: ${targetType}`);
  }
  return adapter;
}

export function registerAdapter(
  targetType: DeployTargetType,
  adapter: DeployAdapter
): void {
  adapters[targetType] = adapter;
}
