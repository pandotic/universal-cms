"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Zap,
  FileText,
  Bot,
  KeyRound,
  Wrench,
  Users,
  ClipboardList,
  Flag,
  BarChart3,
  ShoppingBag,
  Share2,
  X,
  type LucideIcon,
} from "lucide-react";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
};

type NavGroup = {
  label: string;
  links: NavLink[];
};

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
    label: "Build",
    links: [
      { href: "/skills", label: "Skills", icon: Zap },
      { href: "/skill-store", label: "Skill Store", icon: ShoppingBag },
      { href: "/agents", label: "Agents", icon: Bot },
      { href: "/modules", label: "Modules", icon: Wrench },
      { href: "/deployments", label: "Deployments", icon: ClipboardList },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/cms/projects", label: "Projects", icon: FileText },
      { href: "/cms/content", label: "Pages & Blog", icon: FileText },
      { href: "/social", label: "Social", icon: Share2 },
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
      { href: "/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <Image
              src="/images/pandologo.avif"
              alt="Pandotic Hub"
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-sm font-semibold tracking-tight text-white">
              Pandotic Hub
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.links.map((link) => {
                  const active = isActive(pathname, link.href);
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                          active
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{link.label}</span>
                        {link.badge !== undefined && (
                          <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/30">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <Link
            href="/tools/pmf-evaluator"
            onClick={onClose}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
          >
            <Wrench className="h-3.5 w-3.5" />
            PMF Evaluator
          </Link>
        </div>
      </aside>
    </>
  );
}
