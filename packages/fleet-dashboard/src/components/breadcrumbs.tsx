"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  fleet: "Fleet",
  properties: "Properties",
  skills: "Skills",
  "skill-store": "Skill Store",
  agents: "Agents",
  modules: "Modules",
  deployments: "Deployments",
  social: "Social",
  cms: "CMS",
  content: "Content",
  projects: "Projects",
  apis: "APIs",
  groups: "Groups",
  users: "Users",
  "audit-log": "Audit Log",
  "feature-flags": "Feature Flags",
  analytics: "Analytics",
  tools: "Tools",
  "pmf-evaluator": "PMF Evaluator",
  status: "Status",
  onboard: "Onboard",
  deploy: "Deploy",
  upload: "Upload",
  matrix: "Matrix",
  "brand-voice": "Brand Voice",
  generate: "Generate",
};

function label(segment: string) {
  // Look up known labels, otherwise title-case the segment
  return LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: label(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 px-4 py-2 text-xs text-zinc-500 border-b border-zinc-800/50">
      <Link href="/" className="hover:text-zinc-300 transition-colors">Hub</Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 shrink-0" />
          {crumb.isLast ? (
            <span className="text-zinc-300">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-zinc-300 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
