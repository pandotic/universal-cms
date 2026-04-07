"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  MousePointerClick,
  Link2,
  Trophy,
  ExternalLink,
  Loader2,
} from "lucide-react";

// ---------- types ----------
interface ClickRecord {
  id: string;
  url: string;
  label: string | null;
  placement: string | null;
  clickCount: number;
  lastClicked: string;
}

type TimeRange = "7d" | "30d" | "90d";

// ---------- component ----------
export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState<ClickRecord[]>([]);
  const [stats, setStats] = useState({ totalClicks: 0, uniqueLinks: 0, topPlacement: "none" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setStats({
          totalClicks: json.data.totalClicks,
          uniqueLinks: json.data.uniqueLinks,
          topPlacement: json.data.topPlacement,
        });
        setClicks(json.data.clicks);
      }
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    { label: `Total Clicks (${range})`, value: stats.totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-blue-600 bg-blue-50" },
    { label: "Unique Links", value: stats.uniqueLinks.toString(), icon: Link2, color: "text-emerald-600 bg-emerald-50" },
    { label: "Top Placement", value: stats.topPlacement, icon: Trophy, color: "text-amber-600 bg-amber-50" },
  ];

  const ranges: { label: string; value: TimeRange }[] = [
    { label: "7 days", value: "7d" },
    { label: "30 days", value: "30d" },
    { label: "90 days", value: "90d" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Click Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Track affiliate and outbound link performance</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                range === r.value
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("rounded-lg p-2.5", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            Click Trends Chart
          </CardTitle>
          <CardDescription>
            Recharts line/bar chart will be rendered here. Install recharts and add a
            ResponsiveContainer with LineChart to visualize daily click trends over the
            selected time range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-400">Chart placeholder -- will use Recharts</p>
          </div>
        </CardContent>
      </Card>

      {/* Top clicked links table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clicked Links</CardTitle>
          <CardDescription>Highest-performing outbound links in the selected period</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead>Last Clicked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clicks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-gray-500">
                      <MousePointerClick className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      No click data recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  clicks.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-[200px] truncate font-mono text-xs">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {c.url}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="font-medium">{c.label ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{c.placement ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {c.clickCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(c.lastClicked).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
