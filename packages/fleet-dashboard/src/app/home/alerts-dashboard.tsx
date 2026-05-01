"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpCircle,
  Bug,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  HeartPulse,
  Inbox,
  XCircle,
  Zap,
} from "lucide-react";
import { useActiveTodos } from "@/hooks/team-hub/useTodos";
import { useOpenIssues } from "@/hooks/team-hub/useIssues";
import { useTeamUser } from "@/hooks/team-hub/useTeamUser";
import { ActivityFeed } from "./activity-feed";
import { relativeTime } from "./matrix-utils";
import type { ActiveTodo, OpenIssue } from "@/lib/team-hub/types";
import type { DashboardData } from "./types";

interface ErrorEntry {
  id: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  category: string;
  created_at: string;
  url: string | null;
  component: string | null;
}

const SEVERITY_TEXT: Record<string, string> = {
  critical: "text-red-400",
  error: "text-orange-400",
  warning: "text-amber-400",
  info: "text-blue-400",
};

export function AlertsDashboard() {
  const { teamUser } = useTeamUser();
  const todosQuery = useActiveTodos();
  const issuesQuery = useOpenIssues();

  const [fleet, setFleet] = useState<DashboardData | null>(null);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [errorsLoaded, setErrorsLoaded] = useState(false);
  const [fleetLoaded, setFleetLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fleet/dashboard")
      .then((r) => r.json())
      .then((body) => { if (!cancelled && body.data) setFleet(body.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setFleetLoaded(true); });
    fetch("/api/errors?resolved=false&limit=20")
      .then((r) => r.json())
      .then((body) => { if (!cancelled && body.data) setErrors(body.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setErrorsLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const myTodos = useMemo<ActiveTodo[]>(() => {
    const all = todosQuery.data ?? [];
    if (!teamUser) return all;
    return all.filter((t) => t.owner_id === teamUser.id);
  }, [todosQuery.data, teamUser]);

  const otherTodos = useMemo<ActiveTodo[]>(() => {
    const all = todosQuery.data ?? [];
    if (!teamUser) return [];
    return all.filter((t) => t.owner_id !== teamUser.id);
  }, [todosQuery.data, teamUser]);

  const issues = (issuesQuery.data ?? []) as OpenIssue[];

  const fleetAlerts = useMemo(() => {
    if (!fleet) return null;
    const propertiesById = new Map(fleet.properties.map((p) => [p.id, p]));
    const downOrDegraded = fleet.properties.filter(
      (p) => p.health_status === "down" || p.health_status === "degraded",
    );
    const outdated = fleet.packageDeployments
      .filter(
        (d) =>
          d.installed_version &&
          d.latest_version &&
          d.installed_version !== d.latest_version &&
          !d.pinned,
      )
      .map((d) => ({
        ...d,
        property_name: propertiesById.get(d.property_id)?.name ?? "—",
        property_slug: propertiesById.get(d.property_id)?.slug ?? "",
      }));
    const failedSkills = fleet.skillCounts
      .filter((s) => s.failed > 0)
      .map((s) => ({
        ...s,
        property_name: propertiesById.get(s.property_id)?.name ?? "—",
        property_slug: propertiesById.get(s.property_id)?.slug ?? "",
      }));
    return { downOrDegraded, outdated, failedSkills };
  }, [fleet]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Alerts</h1>
          <p className="mt-1 text-sm text-zinc-400">
            What needs your attention right now — across the fleet, your team, and the codebase.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/fleet"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Open Fleet Matrix
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          <MyTodosCard todos={myTodos} loading={todosQuery.isLoading} signedIn={!!teamUser} />
          <OpenIssuesCard issues={issues} loading={issuesQuery.isLoading} />
          <PropertyHealthCard
            properties={fleetAlerts?.downOrDegraded ?? []}
            loading={!fleetLoaded}
          />
          <OutdatedPackagesCard
            items={fleetAlerts?.outdated ?? []}
            loading={!fleetLoaded}
          />
          <FailedSkillsCard
            items={fleetAlerts?.failedSkills ?? []}
            loading={!fleetLoaded}
          />
          <RecentErrorsCard errors={errors} loading={!errorsLoaded} />
          {otherTodos.length > 0 && (
            <TeamTodosCard todos={otherTodos} loading={todosQuery.isLoading} />
          )}
        </div>

        <aside>
          <ActivityFeed />
        </aside>
      </div>
    </div>
  );
}

// ─── Card shell ──────────────────────────────────────────────────────────

function Card({
  title,
  count,
  Icon,
  href,
  hrefLabel,
  empty,
  loading,
  children,
}: {
  title: string;
  count: number;
  Icon: React.ComponentType<{ className?: string }>;
  href?: string;
  hrefLabel?: string;
  empty: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Icon className="h-4 w-4 text-zinc-500" />
          {title}
          {count > 0 && (
            <span className="ml-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
              {count}
            </span>
          )}
        </div>
        {href && (
          <Link href={href} className="text-xs text-zinc-500 hover:text-zinc-300">
            {hrefLabel ?? "View all"} →
          </Link>
        )}
      </div>
      <div className="flex-1">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 w-full animate-pulse rounded bg-zinc-800" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="flex items-center gap-2 px-4 py-6 text-xs text-zinc-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
            {empty}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800/50">{children}</ul>
        )}
      </div>
    </div>
  );
}

// ─── Cards ───────────────────────────────────────────────────────────────

function MyTodosCard({ todos, loading, signedIn }: { todos: ActiveTodo[]; loading: boolean; signedIn: boolean }) {
  return (
    <Card
      title={signedIn ? "My open todos" : "Open todos"}
      count={todos.length}
      Icon={Inbox}
      href="/team-hub/todos"
      empty={signedIn ? "Nothing assigned to you." : "No open todos."}
      loading={loading}
    >
      {todos.slice(0, 5).map((t) => (
        <li key={t.id} className="px-4 py-2.5 text-sm">
          <Link href="/team-hub/todos" className="block hover:text-white">
            <p className={`text-zinc-300 leading-snug ${t.is_overdue ? "text-amber-300" : ""}`}>
              {t.description}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
              {t.due_date && (
                <span className={t.is_overdue ? "text-amber-400" : ""}>
                  due {new Date(t.due_date).toLocaleDateString()}
                </span>
              )}
              {!signedIn && t.owner_short && <span>· {t.owner_short}</span>}
              <span>· {t.source}</span>
            </div>
          </Link>
        </li>
      ))}
    </Card>
  );
}

function TeamTodosCard({ todos, loading }: { todos: ActiveTodo[]; loading: boolean }) {
  return (
    <Card
      title="Team todos"
      count={todos.length}
      Icon={ClipboardList}
      href="/team-hub/todos"
      empty="Team is clear."
      loading={loading}
    >
      {todos.slice(0, 5).map((t) => (
        <li key={t.id} className="px-4 py-2.5 text-sm">
          <p className="text-zinc-300 leading-snug">{t.description}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
            {t.owner_short && <span>{t.owner_short}</span>}
            {t.due_date && (
              <span className={t.is_overdue ? "text-amber-400" : ""}>
                · due {new Date(t.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </li>
      ))}
    </Card>
  );
}

function OpenIssuesCard({ issues, loading }: { issues: OpenIssue[]; loading: boolean }) {
  const urgent = issues.filter((i) => i.priority === "urgent").length;
  return (
    <Card
      title="Open issues"
      count={issues.length}
      Icon={CircleAlert}
      href="/team-hub/issues"
      empty="No open issues."
      loading={loading}
    >
      {issues.slice(0, 5).map((i) => (
        <li key={i.id} className="px-4 py-2.5 text-sm">
          <Link href="/team-hub/issues" className="block hover:text-white">
            <p className="text-zinc-300 leading-snug">{i.title}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
              <span className={priorityClass(i.priority)}>{i.priority}</span>
              {i.submitter_short && <span>· {i.submitter_short}</span>}
              <span>· {relativeTime(i.created_at)}</span>
            </div>
          </Link>
        </li>
      )) /* render blank trailing space when there are urgent items so eye lands quickly */ }
      {urgent > 0 && issues.length > 5 && (
        <li className="px-4 py-2 text-xs text-amber-400">
          {urgent} urgent in total →
        </li>
      )}
    </Card>
  );
}

function PropertyHealthCard({
  properties,
  loading,
}: {
  properties: { id: string; name: string; slug: string; health_status: string }[];
  loading: boolean;
}) {
  return (
    <Card
      title="Health alerts"
      count={properties.length}
      Icon={HeartPulse}
      href="/fleet?lens=overview"
      empty="All properties healthy."
      loading={loading}
    >
      {properties.slice(0, 5).map((p) => (
        <li key={p.id} className="px-4 py-2.5 text-sm">
          <Link href={`/properties/${p.slug}`} className="flex items-center justify-between hover:text-white">
            <span className="text-zinc-300">{p.name}</span>
            <span
              className={`text-xs ${
                p.health_status === "down" ? "text-red-400" : "text-amber-400"
              }`}
            >
              {p.health_status}
            </span>
          </Link>
        </li>
      ))}
    </Card>
  );
}

function OutdatedPackagesCard({
  items,
  loading,
}: {
  items: {
    package_name: string;
    installed_version: string | null;
    latest_version: string | null;
    property_name: string;
    property_slug: string;
  }[];
  loading: boolean;
}) {
  return (
    <Card
      title="Outdated packages"
      count={items.length}
      Icon={ArrowUpCircle}
      href="/fleet?lens=developer"
      empty="Everything up to date."
      loading={loading}
    >
      {items.slice(0, 5).map((d, idx) => (
        <li key={`${d.property_slug}-${d.package_name}-${idx}`} className="px-4 py-2.5 text-sm">
          <Link href={`/properties/${d.property_slug}`} className="block hover:text-white">
            <p className="text-zinc-300 leading-snug">{d.property_name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
              <span className="font-mono">{shortPkg(d.package_name)}</span>
              <span>
                <span className="text-zinc-400">{d.installed_version}</span>
                <span className="mx-1">→</span>
                <span className="text-amber-400">{d.latest_version}</span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </Card>
  );
}

function FailedSkillsCard({
  items,
  loading,
}: {
  items: { property_id: string; property_name: string; property_slug: string; failed: number; outdated: number }[];
  loading: boolean;
}) {
  const totalFailed = items.reduce((n, s) => n + s.failed, 0);
  return (
    <Card
      title="Failed skills"
      count={totalFailed}
      Icon={Zap}
      href="/skills/matrix"
      empty="No skill failures."
      loading={loading}
    >
      {items.slice(0, 5).map((s) => (
        <li key={s.property_id} className="px-4 py-2.5 text-sm">
          <Link href="/skills/matrix" className="flex items-center justify-between hover:text-white">
            <span className="text-zinc-300">{s.property_name}</span>
            <span className="text-xs text-red-400">{s.failed} failed</span>
          </Link>
        </li>
      ))}
    </Card>
  );
}

function RecentErrorsCard({ errors, loading }: { errors: ErrorEntry[]; loading: boolean }) {
  return (
    <Card
      title="Unresolved errors"
      count={errors.length}
      Icon={Bug}
      href="/errors"
      empty="No unresolved errors."
      loading={loading}
    >
      {errors.slice(0, 5).map((e) => (
        <li key={e.id} className="px-4 py-2.5 text-sm">
          <Link href="/errors" className="block hover:text-white">
            <p className="truncate text-zinc-300 leading-snug">{e.message}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
              <span className={SEVERITY_TEXT[e.severity] ?? "text-zinc-500"}>{e.severity}</span>
              <span>· {e.category}</span>
              <span>· {relativeTime(e.created_at)}</span>
            </div>
          </Link>
        </li>
      ))}
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function priorityClass(p: OpenIssue["priority"]) {
  if (p === "urgent") return "text-red-400";
  if (p === "discuss") return "text-amber-400";
  return "text-zinc-500";
}

function shortPkg(name: string) {
  return name.replace("@pandotic/", "").replace("@universal-cms/", "");
}
