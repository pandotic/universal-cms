"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  AlertTriangle, BarChart3, Bot, Briefcase, ClipboardList,
  FileText, Flag, Globe, KeyRound, LayoutDashboard, ListChecks,
  Rocket, Search, Share2, ShoppingBag, Users, Wrench, Zap,
} from "lucide-react";

interface Property {
  id: string;
  name: string;
  slug: string;
  health_status: string;
}

const ROUTES = [
  { href: "/", label: "Overview", icon: LayoutDashboard, group: "Pages" },
  { href: "/fleet", label: "Fleet Matrix", icon: Globe, group: "Pages" },
  { href: "/properties", label: "Properties", icon: Globe, group: "Pages" },
  { href: "/skills", label: "Skills", icon: Zap, group: "Pages" },
  { href: "/skill-store", label: "Skill Store", icon: ShoppingBag, group: "Pages" },
  { href: "/agents", label: "Agents", icon: Bot, group: "Pages" },
  { href: "/playbooks", label: "Playbooks", icon: ListChecks, group: "Pages" },
  { href: "/modules", label: "Modules", icon: Wrench, group: "Pages" },
  { href: "/deployments", label: "Deployments", icon: ClipboardList, group: "Pages" },
  { href: "/cms/projects", label: "Projects", icon: Briefcase, group: "Pages" },
  { href: "/cms/content", label: "Pages & Blog", icon: FileText, group: "Pages" },
  { href: "/social", label: "Social", icon: Share2, group: "Pages" },
  { href: "/apis", label: "APIs & Usage", icon: BarChart3, group: "Pages" },
  { href: "/apis/keys", label: "API Keys", icon: KeyRound, group: "Pages" },
  { href: "/groups", label: "Groups", icon: Users, group: "Pages" },
  { href: "/users", label: "Users", icon: Users, group: "Pages" },
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList, group: "Pages" },
  { href: "/errors", label: "Errors", icon: AlertTriangle, group: "Pages" },
  { href: "/feature-flags", label: "Feature Flags", icon: Flag, group: "Pages" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Pages" },
  { href: "/fleet/onboard", label: "Add property", icon: Globe, group: "Actions" },
  { href: "/skills/deploy", label: "Deploy a skill", icon: Rocket, group: "Actions" },
  { href: "/skills/upload", label: "Upload skill", icon: Zap, group: "Actions" },
];

const HEALTH_DOT: Record<string, string> = {
  healthy: "bg-emerald-400",
  degraded: "bg-amber-400",
  down: "bg-red-500",
  unknown: "bg-zinc-600",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (open && !fetched) {
      fetch("/api/fleet/dashboard")
        .then((r) => r.json())
        .then((body) => {
          if (body.data?.properties) setProperties(body.data.properties);
          setFetched(true);
        })
        .catch(() => setFetched(true));
    }
  }, [open, fetched]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose(); else return;
      }
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="[&_[cmdk-root]]:w-full" loop>
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <Command.Input
              placeholder="Jump to page or property…"
              className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder-zinc-500"
              autoFocus
            />
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-zinc-500">
              No results found.
            </Command.Empty>

            {/* Properties */}
            {properties.length > 0 && (
              <Command.Group heading="Properties" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-500">
                {properties.slice(0, 8).map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`property ${p.name} ${p.slug}`}
                    onSelect={() => navigate(`/properties/${p.slug}`)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${HEALTH_DOT[p.health_status] ?? HEALTH_DOT.unknown}`} />
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-zinc-600">{p.slug}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Pages */}
            <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-500">
              {ROUTES.filter((r) => r.group === "Pages").map((r) => {
                const Icon = r.icon;
                return (
                  <Command.Item
                    key={r.href}
                    value={r.label}
                    onSelect={() => navigate(r.href)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                    {r.label}
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* Actions */}
            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-500">
              {ROUTES.filter((r) => r.group === "Actions").map((r) => {
                const Icon = r.icon;
                return (
                  <Command.Item
                    key={r.href}
                    value={r.label}
                    onSelect={() => navigate(r.href)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-violet-400" />
                    {r.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          <div className="border-t border-zinc-800 px-3 py-2 flex items-center gap-3 text-[10px] text-zinc-600">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> open</span>
            <span><kbd className="font-mono">esc</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
