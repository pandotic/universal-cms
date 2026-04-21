/**
 * Pure functions that derive the weekly Fleet review agenda from live
 * `hub_properties` + `hub_initiatives` data. Flag rules live here so
 * they're self-documenting and independently testable — the UI is a
 * thin renderer over the output.
 */

import type { HubProperty } from "../types/hub";
import type { HubInitiative } from "../types/initiatives";

export type FlagSeverity = "info" | "warn" | "critical";

export interface FleetAttentionFlag {
  kind: "property" | "initiative";
  id: string;
  slug: string | null;
  name: string;
  reason: string;
  severity: FlagSeverity;
  href: string;
  owner_id?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / DAY_MS);
}

function daysUntil(ymd: string | null): number | null {
  if (!ymd) return null;
  const then = new Date(`${ymd}T00:00:00`).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((then - Date.now()) / DAY_MS);
}

/**
 * Flag rules for fleet properties. A property lands on the weekly
 * agenda if any of these are true:
 *   1. health_status is degraded or down
 *   2. kill_switch is on
 *   3. there are unacked agent errors in the last 24h
 *   4. there's content waiting for QA
 *   5. the property is active and hasn't been deployed in 14+ days
 *   6. package_version is drifted from target
 */
export function deriveFleetAttention(
  properties: HubProperty[],
): FleetAttentionFlag[] {
  const flags: FleetAttentionFlag[] = [];

  for (const p of properties) {
    if (p.status === "archived" || p.status === "paused") continue;

    const base = {
      kind: "property" as const,
      id: p.id,
      slug: p.slug,
      name: p.name,
      href: `/properties/${p.slug}`,
    };

    if (p.health_status === "down") {
      flags.push({ ...base, reason: "health: down", severity: "critical" });
      continue;
    }
    if (p.health_status === "degraded") {
      flags.push({ ...base, reason: "health: degraded", severity: "warn" });
      continue;
    }
    if (p.kill_switch) {
      flags.push({ ...base, reason: "kill switch on", severity: "critical" });
      continue;
    }
    if (p.agent_errors_24h_count > 0) {
      flags.push({
        ...base,
        reason: `${p.agent_errors_24h_count} agent error${p.agent_errors_24h_count === 1 ? "" : "s"} in the last 24h`,
        severity: "warn",
      });
      continue;
    }
    if (p.content_pending_review_count > 0) {
      flags.push({
        ...base,
        reason: `${p.content_pending_review_count} content item${p.content_pending_review_count === 1 ? "" : "s"} awaiting review`,
        severity: "info",
      });
      continue;
    }
    const deployAge = daysSince(p.last_deploy_at);
    if (p.status === "active" && deployAge !== null && deployAge >= 14) {
      flags.push({
        ...base,
        reason: `last deploy ${deployAge} days ago`,
        severity: "info",
      });
      continue;
    }
    if (
      p.package_version &&
      p.target_package_version &&
      p.package_version !== p.target_package_version
    ) {
      flags.push({
        ...base,
        reason: `package ${p.package_version} → ${p.target_package_version}`,
        severity: "info",
      });
    }
  }

  return flags;
}

/**
 * Flag rules for initiatives. An initiative lands on the agenda if:
 *   1. stage is "stalled"
 *   2. stage is "active" and it hasn't been touched in 7+ days
 *   3. starts_on is within the next 14 days (upcoming event)
 *   4. next_step_due is within the next 7 days (due soon)
 *   5. next_step_due has already passed
 */
export function deriveInitiativeReview(
  initiatives: HubInitiative[],
): FleetAttentionFlag[] {
  const flags: FleetAttentionFlag[] = [];

  for (const i of initiatives) {
    if (
      i.stage === "archived" ||
      i.stage === "won" ||
      i.stage === "lost" ||
      i.stage === "complete"
    ) {
      continue;
    }

    const base = {
      kind: "initiative" as const,
      id: i.id,
      slug: i.slug,
      name: i.name,
      href: `/initiatives/${i.slug}`,
      owner_id: i.owner_id,
    };

    if (i.stage === "stalled") {
      flags.push({ ...base, reason: "stalled", severity: "warn" });
      continue;
    }

    const updateAge = daysSince(i.last_update_at);
    if (i.stage === "active" && updateAge !== null && updateAge >= 7) {
      flags.push({
        ...base,
        reason: `no update in ${updateAge} days`,
        severity: "warn",
      });
      continue;
    }

    const daysToStart = daysUntil(i.starts_on);
    if (daysToStart !== null && daysToStart >= 0 && daysToStart <= 14) {
      flags.push({
        ...base,
        reason:
          daysToStart === 0
            ? "starts today"
            : `starts in ${daysToStart} day${daysToStart === 1 ? "" : "s"}`,
        severity: daysToStart <= 3 ? "warn" : "info",
      });
      continue;
    }

    const daysToNext = daysUntil(i.next_step_due);
    if (daysToNext !== null) {
      if (daysToNext < 0) {
        flags.push({
          ...base,
          reason: `next step ${Math.abs(daysToNext)} day${Math.abs(daysToNext) === 1 ? "" : "s"} overdue`,
          severity: "critical",
        });
        continue;
      }
      if (daysToNext <= 7) {
        flags.push({
          ...base,
          reason:
            daysToNext === 0
              ? "next step due today"
              : `next step in ${daysToNext} day${daysToNext === 1 ? "" : "s"}`,
          severity: daysToNext <= 2 ? "warn" : "info",
        });
        continue;
      }
    }

    if (i.stage === "idea") {
      flags.push({
        ...base,
        reason: "idea stage — define owner + next step",
        severity: "info",
      });
    }
  }

  return flags;
}
