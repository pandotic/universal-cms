"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  CalendarClock,
  AlertCircle,
  CheckSquare,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SectionCounts {
  issues: number;
  todos: number;
  initiatives: number;
}

const SECTIONS = [
  { href: "/team-hub", icon: CalendarClock, label: "Meetings" },
  { href: "/team-hub/issues", icon: AlertCircle, label: "Issues" },
  { href: "/team-hub/todos", icon: CheckSquare, label: "To-Dos" },
  { href: "/team-hub/initiatives", icon: Target, label: "Initiatives" },
];

export function TeamHubSidebar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<SectionCounts>({
    issues: 0,
    todos: 0,
    initiatives: 0,
  });

  useEffect(() => {
    const supabase = createClient();
    const userId = typeof window !== "undefined" ? localStorage.getItem("auth_user_id") : null;

    const fetchCounts = async () => {
      try {
        const [issuesRes, todosRes, initiativesRes] = await Promise.all([
          supabase
            .from("issues")
            .select("id", { count: "exact", head: true })
            .eq("status", "open"),
          supabase
            .from("todos")
            .select("id", { count: "exact", head: true })
            .eq("status", "open"),
          supabase
            .from("hub_initiatives")
            .select("id", { count: "exact", head: true })
            .neq("stage", "archived"),
        ]);

        setCounts({
          issues: issuesRes.count ?? 0,
          todos: todosRes.count ?? 0,
          initiatives: initiativesRes.count ?? 0,
        });
      } catch (error) {
        console.error("Failed to fetch counts:", error);
      }
    };

    fetchCounts();
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-300 lg:relative lg:z-auto lg:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-default)",
        }}
      >
        {/* Header with toggle */}
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <button
            onClick={onToggle}
            className="flex items-center gap-2 font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Team Hub
          </button>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-zinc-700 rounded"
          >
            ✕
          </button>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1 p-3">
          {SECTIONS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            const count = counts[label.toLowerCase() as keyof SectionCounts];
            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-700"
                    : "hover:bg-zinc-800"
                }`}
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span
                    className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs"
                    style={{ color: "#fca5a5" }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
