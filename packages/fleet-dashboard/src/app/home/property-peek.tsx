"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  CheckCircle2, ExternalLink, Github, Globe, Package,
  Settings, X, Zap,
} from "lucide-react";
import type { ByPropertyIndex, Property } from "./types";
import { cmsDeploy, healthMeta, needsUpgrade, ownershipClass, relativeTime, stageClass } from "./matrix-utils";

interface Props {
  property: Property | null;
  index: ByPropertyIndex;
  onClose: () => void;
}

export function PropertyPeek({ property, index, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visible = !!property;

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-200 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {property && <PeekContent property={property} index={index} onClose={onClose} />}
      </div>
    </>
  );
}

function PeekContent({ property, index, onClose }: { property: Property; index: ByPropertyIndex; onClose: () => void }) {
  const health = healthMeta(property.health_status);
  const deployments = index.deployMap.get(property.id) ?? [];
  const skills = index.skillMap.get(property.id);
  const marketing = index.mktMap.get(property.id) ?? [];
  const cms = cmsDeploy(deployments);
  const upgrade = needsUpgrade(cms);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-zinc-800 p-4">
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${health.dot}`} />
          <div>
            <h2 className="font-semibold text-white">{property.name}</h2>
            <p className="text-xs text-zinc-500">{property.slug}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Health" value={health.label} valueClass={health.text} />
          <StatCard label="Stage" value={property.business_stage} valueClass={stageClass(property.business_stage)} />
          <StatCard label="Modules" value={String(property.enabled_modules.length)} />
          <StatCard label="Last deploy" value={relativeTime(property.last_deploy_at)} />
        </div>

        {/* Ownership */}
        <Section title="Ownership">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${ownershipClass(property.ownership_type)}`}>
            {property.ownership_type}{property.client_name ? ` · ${property.client_name}` : ""}
          </span>
          {property.llc_entity && (
            <p className="mt-1 text-xs text-zinc-400">LLC: {property.llc_entity}</p>
          )}
        </Section>

        {/* CMS Package */}
        <Section title="CMS Package">
          {cms ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-zinc-200">{cms.installed_version}</p>
                {upgrade && (
                  <p className="text-xs text-amber-400">→ {cms.latest_version} available</p>
                )}
              </div>
              {upgrade && (
                <Link
                  href={`/fleet/deploy?properties=${property.id}`}
                  className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-300 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/20"
                >
                  Upgrade
                </Link>
              )}
              {!upgrade && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Not installed</p>
          )}
        </Section>

        {/* Skills */}
        {skills && (skills.active + skills.outdated + skills.failed) > 0 && (
          <Section title="Skills">
            <div className="flex gap-2 text-xs">
              {skills.active > 0 && <Chip label={`${skills.active} active`} tone="emerald" />}
              {skills.outdated > 0 && <Chip label={`${skills.outdated} outdated`} tone="amber" />}
              {skills.failed > 0 && <Chip label={`${skills.failed} failed`} tone="red" />}
            </div>
          </Section>
        )}

        {/* Marketing */}
        {marketing.length > 0 && (
          <Section title="Marketing services">
            <div className="space-y-1">
              {marketing.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{m.service_type}</span>
                  <span className={m.status === "active" ? "text-emerald-400" : "text-zinc-500"}>{m.status}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Modules */}
        {property.enabled_modules.length > 0 && (
          <Section title="Enabled modules">
            <div className="flex flex-wrap gap-1.5">
              {property.enabled_modules.map((m) => (
                <span key={m} className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  {m}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Links */}
        <Section title="Links">
          <div className="space-y-1.5">
            {property.url && (
              <a href={property.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
                <Globe className="h-3.5 w-3.5" /> {property.url}
                <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
              </a>
            )}
            {property.github_repo && (
              <a href={`https://github.com/${property.github_repo}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
                <Github className="h-3.5 w-3.5" /> {property.github_repo}
                <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
              </a>
            )}
          </div>
        </Section>
      </div>

      {/* Footer actions */}
      <div className="border-t border-zinc-800 p-4 flex gap-2">
        <Link
          href={`/properties/${property.slug}`}
          className="flex-1 rounded-md bg-zinc-800 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-700"
        >
          Full detail
        </Link>
        <Link
          href={`/properties/${property.slug}/agents`}
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Agents
        </Link>
        <Link
          href={`/skills/deploy?properties=${property.id}`}
          className="rounded-md bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-400"
        >
          Deploy
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, valueClass = "text-zinc-200" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-sm font-medium ${valueClass}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone: "emerald" | "amber" | "red" }) {
  const cls = {
    emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
    red: "bg-red-500/10 text-red-300 ring-red-500/30",
  }[tone];
  return <span className={`rounded px-1.5 py-0.5 ring-1 ring-inset ${cls}`}>{label}</span>;
}
