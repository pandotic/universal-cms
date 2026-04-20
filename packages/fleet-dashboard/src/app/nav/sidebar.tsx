"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Briefcase,
  CalendarClock,
  ChevronLeft,
  ClipboardList,
  ExternalLink,
  FileText,
  Flag,
  Globe,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  Megaphone,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    links: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/fleet", label: "Fleet Matrix", icon: Globe },
      { href: "/properties", label: "Properties", icon: Globe },
    ],
  },
  {
    label: "Team",
    links: [
      { href: "/team-hub", label: "Team Hub", icon: CalendarClock },
    ],
  },
  {
    label: "Build",
    links: [
      { href: "/skills", label: "Skills", icon: Zap },
      { href: "/skill-store", label: "Skill Store", icon: ShoppingBag },
      { href: "/agents", label: "Agents", icon: Bot },
      { href: "/playbooks", label: "Playbooks", icon: ListChecks },
      { href: "/modules", label: "Modules", icon: Wrench },
      { href: "/deployments", label: "Deployments", icon: ClipboardList },
    ],
  },
  {
    label: "Marketing",
    links: [
      { href: "/marketing-ops", label: "Dashboard", icon: Megaphone },
      { href: "/marketing-ops/brands", label: "Brands", icon: Globe },
      { href: "/marketing-ops/pipeline", label: "Content Pipeline", icon: ListChecks },
      { href: "/marketing-ops/link-building", label: "Link Building", icon: Link2 },
      { href: "/marketing-ops/qa", label: "QA & Reviews", icon: ShieldCheck },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/cms/projects", label: "Projects", icon: Briefcase },
      { href: "/cms/content", label: "Pages & Blog", icon: FileText },
      { href: "/social", label: "Social", icon: Share2 },
    ],
  },
  {
    label: "CMS Admin",
    links: [
      { href: "/cms/marketing-cms", label: "Marketing CMS", icon: Megaphone },
      { href: "/cms/app-admin", label: "App Admin", icon: LayoutDashboard },
      { href: "/cms/group-admin", label: "Group Admin", icon: ShieldCheck },
    ],
  },
  {
    label: "Tools",
    links: [
      { href: "/tools/promptkit", label: "PromptKit", icon: Sparkles },
      { href: "/tools/pmf-evaluator", label: "PMF Evaluator", icon: Wrench },
    ],
  },
  {
    label: "APIs",
    links: [
      { href: "/apis", label: "Services & Usage", icon: BarChart3 },
      { href: "/apis/keys", label: "Keys", icon: KeyRound },
    ],
  },
  {
    label: "Admin",
    links: [
      { href: "/groups", label: "Groups", icon: Users },
      { href: "/users", label: "Users", icon: Users },
      { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
      { href: "/errors", label: "Errors", icon: AlertTriangle },
      { href: "/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

interface Props {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }: Props) {
  const pathname = usePathname();
  const width = collapsed ? "w-14" : "w-64";

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex ${width} flex-col border-r border-zinc-800 bg-zinc-950 transition-[width,transform] duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-zinc-800 px-3">
          {collapsed ? (
            <button onClick={onToggleCollapse} className="flex w-full items-center justify-center rounded-md p-1 hover:bg-zinc-800" title="Expand sidebar">
              <Image src="/images/pandologo.avif" alt="Hub" width={24} height={24} className="rounded-full" />
            </button>
          ) : (
            <div className="flex w-full items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={onClose}>
                <Image src="/images/pandologo.avif" alt="Pandotic Hub" width={24} height={24} className="rounded-full" />
                <span className="text-sm font-semibold tracking-tight text-white">Pandotic Hub</span>
              </Link>
              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleCollapse}
                  className="hidden rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white lg:block"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.links.map((link) => {
                  const active = !link.external && isActive(pathname, link.href);
                  const Icon = link.icon;
                  const className = `flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    collapsed ? "justify-center px-2" : ""
                  } ${
                    active
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`;
                  return (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={onClose}
                          title={collapsed ? link.label : undefined}
                          className={className}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="truncate">{link.label}</span>
                              <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-zinc-500" />
                            </>
                          )}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          onClick={onClose}
                          title={collapsed ? link.label : undefined}
                          className={className}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{link.label}</span>}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              {collapsed && <div className="my-2 border-t border-zinc-800/60" />}
            </div>
          ))}
        </nav>

      </aside>
    </>
  );
}
