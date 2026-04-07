"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  Link2,
  CheckCircle,
  X,
  RefreshCw,
  Search,
  AlertTriangle,
} from "lucide-react";

// ---------- Types ----------

interface LinkStat {
  pagePath: string;
  inboundCount: number;
  outboundCount: number;
}

interface LinkSuggestion {
  id: string;
  source_page: string;
  target_page: string;
  target_title: string | null;
  suggested_anchor: string | null;
  relevance_score: number;
  status: "pending" | "accepted" | "dismissed";
  created_at: string;
}

interface AnchorGroup {
  target_page: string;
  anchor_text: string;
  count: number;
}

// ---------- Helpers ----------

function StatusBadge({ inbound }: { inbound: number }) {
  if (inbound === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Orphan
      </span>
    );
  }
  if (inbound > 10) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        Hub
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
      Normal
    </span>
  );
}

function RelevanceBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-green-100 text-green-700"
      : score >= 50
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-600";
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", color)}>
      {score}
    </span>
  );
}

// ---------- Tab 1: Link Map ----------

function LinkMapTab() {
  const [stats, setStats] = useState<LinkStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/internal-links?view=stats")
      .then((r) => r.json())
      .then((j) => setStats(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = stats.filter((s) =>
    s.pagePath.toLowerCase().includes(search.toLowerCase())
  );

  const orphanCount = stats.filter((s) => s.inboundCount === 0).length;
  const hubCount = stats.filter((s) => s.inboundCount > 10).length;

  if (loading) {
    return (
      <CardContent className="py-12 text-center text-sm text-gray-500">
        Loading link map...
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0">
      {/* Summary row */}
      <div className="flex items-center gap-6 border-b px-4 py-3 text-sm text-gray-600">
        <span>
          <strong className="text-gray-900">{stats.length}</strong> pages tracked
        </span>
        <span>
          <strong className="text-red-600">{orphanCount}</strong> orphans
        </span>
        <span>
          <strong className="text-blue-600">{hubCount}</strong> hubs
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page Path</TableHead>
            <TableHead className="w-32 text-center">Inbound Links</TableHead>
            <TableHead className="w-32 text-center">Outbound Links</TableHead>
            <TableHead className="w-28">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-gray-500">
                {search ? "No pages match your filter." : "No link data recorded yet."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((stat) => (
              <TableRow key={stat.pagePath}>
                <TableCell className="font-mono text-sm">{stat.pagePath}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold",
                      stat.inboundCount === 0
                        ? "bg-red-100 text-red-700"
                        : stat.inboundCount > 10
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {stat.inboundCount}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold bg-gray-100 text-gray-700">
                    {stat.outboundCount}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge inbound={stat.inboundCount} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CardContent>
  );
}

// ---------- Tab 2: Suggestions ----------

function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "dismissed">("pending");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchSuggestions = useCallback(() => {
    setLoading(true);
    const params = statusFilter === "all" ? "" : `&status=${statusFilter}`;
    fetch(`/api/admin/internal-links?view=suggestions${params}`)
      .then((r) => r.json())
      .then((j) => setSuggestions(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleAction = (id: string, status: "accepted" | "dismissed") => {
    setActioningId(id);
    fetch(`/api/admin/internal-links/suggestions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then(() => {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status } : s))
        );
      })
      .catch(() => {})
      .finally(() => setActioningId(null));
  };

  const handleGenerate = () => {
    setGenerating(true);
    fetch("/api/admin/internal-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-suggestions" }),
    })
      .then((r) => r.json())
      .then(() => fetchSuggestions())
      .catch(() => {})
      .finally(() => setGenerating(false));
  };

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  return (
    <CardContent className="p-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-1.5">
          {(["all", "pending", "accepted", "dismissed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === f
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-orange-200 px-1 text-orange-800">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={generating}
          className="ml-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", generating && "animate-spin")} />
          {generating ? "Generating..." : "Generate Suggestions"}
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading suggestions...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Page</TableHead>
              <TableHead>Target Page</TableHead>
              <TableHead>Suggested Anchor</TableHead>
              <TableHead className="w-28 text-center">Relevance</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suggestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-gray-500">
                  No suggestions found. Try generating suggestions first.
                </TableCell>
              </TableRow>
            ) : (
              suggestions.map((s) => (
                <TableRow
                  key={s.id}
                  className={cn(s.status !== "pending" && "opacity-60")}
                >
                  <TableCell className="font-mono text-xs">{s.source_page}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{s.target_page}</div>
                    {s.target_title && (
                      <div className="text-xs text-gray-500 mt-0.5">{s.target_title}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.suggested_anchor ?? <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <RelevanceBadge score={s.relevance_score} />
                  </TableCell>
                  <TableCell>
                    {s.status === "pending" ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(s.id, "accepted")}
                          disabled={actioningId === s.id}
                          className="h-7 px-2 text-green-600 hover:bg-green-50 hover:text-green-700"
                          title="Accept"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(s.id, "dismissed")}
                          disabled={actioningId === s.id}
                          className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                          title="Dismiss"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium",
                          s.status === "accepted"
                            ? "text-green-600"
                            : "text-gray-400"
                        )}
                      >
                        {s.status === "accepted" ? (
                          <><CheckCircle className="h-3.5 w-3.5" /> Accepted</>
                        ) : (
                          <><X className="h-3.5 w-3.5" /> Dismissed</>
                        )}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </CardContent>
  );
}

// ---------- Tab 3: Anchor Text ----------

function AnchorTextTab() {
  const [groups, setGroups] = useState<AnchorGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/internal-links?view=anchors")
      .then((r) => r.json())
      .then((j) => setGroups(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <CardContent className="py-12 text-center text-sm text-gray-500">
        Loading anchor text data...
      </CardContent>
    );
  }

  // Group by target_page
  const byPage = new Map<string, AnchorGroup[]>();
  for (const g of groups) {
    if (!byPage.has(g.target_page)) byPage.set(g.target_page, []);
    byPage.get(g.target_page)!.push(g);
  }

  const overOptimizedCount = groups.filter((g) => g.count > 3).length;

  return (
    <CardContent className="p-0">
      {overOptimizedCount > 0 && (
        <div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{overOptimizedCount}</strong> anchor text
            {overOptimizedCount === 1 ? " variation is" : " variations are"} used
            more than 3 times (over-optimization risk).
          </span>
        </div>
      )}

      {byPage.size === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          No anchor text data recorded yet.
        </div>
      ) : (
        <div className="divide-y">
          {Array.from(byPage.entries()).map(([targetPage, anchors]) => {
            const sorted = [...anchors].sort((a, b) => b.count - a.count);
            return (
              <div key={targetPage} className="px-4 py-4">
                <div className="mb-2 font-mono text-xs font-semibold text-gray-700">
                  {targetPage}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sorted.map((a, i) => (
                    <span
                      key={i}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs",
                        a.count > 3
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : "border-gray-200 bg-gray-50 text-gray-700"
                      )}
                      title={a.count > 3 ? "Over-optimization warning: used more than 3 times" : ""}
                    >
                      {a.anchor_text}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                          a.count > 3
                            ? "bg-amber-200 text-amber-900"
                            : "bg-gray-200 text-gray-600"
                        )}
                      >
                        {a.count}
                      </span>
                      {a.count > 3 && (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardContent>
  );
}

// ---------- Main Page ----------

export default function InterlinkingPage() {
  const [activeTab, setActiveTab] = useState("link-map");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Internal Link Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visualize your internal link graph, surface orphan pages, and manage
          link suggestions to improve crawlability and SEO equity distribution.
        </p>
      </div>

      {/* Overview KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Link2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Link Map</p>
              <p className="text-xs text-gray-400 mt-0.5">Track inbound / outbound</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-orange-50 p-2.5">
              <RefreshCw className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Suggestions</p>
              <p className="text-xs text-gray-400 mt-0.5">AI-free opportunity finder</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Anchor Text</p>
              <p className="text-xs text-gray-400 mt-0.5">Over-optimization warnings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="link-map">Link Map</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="anchor-text">Anchor Text</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent value="link-map">
            <LinkMapTab />
          </TabsContent>

          <TabsContent value="suggestions">
            <SuggestionsTab />
          </TabsContent>

          <TabsContent value="anchor-text">
            <AnchorTextTab />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
