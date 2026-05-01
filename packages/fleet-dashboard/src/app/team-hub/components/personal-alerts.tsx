"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTeamUser } from "@/hooks/team-hub/useTeamUser";
import { AlertCircle, CheckSquare, Target, Calendar } from "lucide-react";

interface PersonalItem {
  id: string;
  title: string;
  type: "issue" | "todo" | "initiative";
  priority?: string;
  stage?: string;
  dueDate?: string;
}

export function PersonalAlerts() {
  const { teamUser } = useTeamUser();
  const [items, setItems] = useState<PersonalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamUser) return;

    const supabase = createClient();
    const fetchPersonalItems = async () => {
      try {
        const [issuesRes, todosRes, initiativesRes] = await Promise.all([
          supabase
            .from("issues")
            .select("id, title, priority")
            .eq("status", "open")
            .limit(3),
          supabase
            .from("todos")
            .select("id, description, due_date, owner_id")
            .eq("status", "open")
            .eq("owner_id", teamUser.id)
            .limit(3),
          supabase
            .from("hub_initiatives")
            .select("id, name, stage")
            .eq("owner_id", teamUser.id)
            .neq("stage", "archived")
            .limit(2),
        ]);

        const personalItems: PersonalItem[] = [
          ...(issuesRes.data ?? []).slice(0, 2).map((i) => ({
            id: i.id,
            title: i.title,
            type: "issue" as const,
            priority: i.priority,
          })),
          ...(todosRes.data ?? []).map((t) => ({
            id: t.id,
            title: t.description,
            type: "todo" as const,
            dueDate: t.due_date,
          })),
          ...(initiativesRes.data ?? []).map((init) => ({
            id: init.id,
            title: init.name,
            type: "initiative" as const,
            stage: init.stage,
          })),
        ];

        setItems(personalItems);
      } catch (error) {
        console.error("Failed to fetch personal items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalItems();
  }, [teamUser]);

  const grouped = useMemo(() => {
    return {
      issues: items.filter((i) => i.type === "issue"),
      todos: items.filter((i) => i.type === "todo"),
      initiatives: items.filter((i) => i.type === "initiative"),
    };
  }, [items]);

  if (loading) {
    return (
      <div
        className="space-y-2 animate-pulse"
        style={{ color: "var(--text-tertiary)" }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-8 rounded"
            style={{ background: "var(--bg-tertiary)" }}
          />
        ))}
      </div>
    );
  }

  const hasItems =
    grouped.issues.length > 0 ||
    grouped.todos.length > 0 ||
    grouped.initiatives.length > 0;

  if (!hasItems) {
    return (
      <div style={{ color: "var(--text-tertiary)" }} className="text-sm">
        ✓ All caught up
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.issues.length > 0 && (
        <div>
          <div
            className="text-xs font-semibold mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Issues
          </div>
          <div className="space-y-1">
            {grouped.issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/team-hub/issues?highlight=${issue.id}`}
                className="block text-sm truncate px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                {issue.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {grouped.todos.length > 0 && (
        <div>
          <div
            className="text-xs font-semibold mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <CheckSquare className="h-3 w-3 inline mr-1" />
            Your To-Dos
          </div>
          <div className="space-y-1">
            {grouped.todos.map((todo) => (
              <Link
                key={todo.id}
                href={`/team-hub/todos?highlight=${todo.id}`}
                className="block text-sm truncate px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                {todo.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {grouped.initiatives.length > 0 && (
        <div>
          <div
            className="text-xs font-semibold mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <Target className="h-3 w-3 inline mr-1" />
            Your Initiatives
          </div>
          <div className="space-y-1">
            {grouped.initiatives.map((init) => (
              <Link
                key={init.id}
                href={`/team-hub/initiatives?highlight=${init.id}`}
                className="block text-sm truncate px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                {init.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
