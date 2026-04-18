import Link from "next/link";
import { AlertTriangle, CheckCircle2, Play, RefreshCcw, XCircle, type LucideIcon } from "lucide-react";

interface Props {
  down: number;
  outdated: number;
  failed: number;
  planned: number;
}

type Item = { label: string; count: number; tone: string; href: string; Icon: LucideIcon };

export function AttentionStrip({ down, outdated, failed, planned }: Props) {
  const items: Item[] = [
    { label: "Health issues", count: down, tone: "text-red-300 ring-red-500/30 bg-red-500/10 hover:bg-red-500/20", href: "/?lens=ops", Icon: XCircle },
    { label: "Packages out of date", count: outdated, tone: "text-amber-300 ring-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20", href: "/?lens=developer", Icon: RefreshCcw },
    { label: "Skill failures", count: failed, tone: "text-rose-300 ring-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20", href: "/skills/matrix", Icon: AlertTriangle },
    { label: "Marketing tasks pending", count: planned, tone: "text-cyan-300 ring-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20", href: "/?lens=marketing", Icon: Play },
  ];

  if (items.every((i) => i.count === 0)) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Fleet looks clean — nothing needs attention right now.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`flex items-center justify-between rounded-lg px-4 py-3 ring-1 ring-inset transition-colors ${item.tone}`}
        >
          <div>
            <div className="text-2xl font-semibold tabular-nums">{item.count}</div>
            <div className="text-xs opacity-80">{item.label}</div>
          </div>
          <item.Icon className="h-5 w-5 opacity-60" />
        </Link>
      ))}
    </div>
  );
}
