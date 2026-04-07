"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/shadcn";
import {
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LinkCheck {
  id: string;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  status_code: number | null;
  is_internal: boolean;
  is_broken: boolean;
  redirect_target: string | null;
  last_checked_at: string;
  first_broken_at: string | null;
}

interface NotFoundLog {
  id: string;
  url: string;
  referrer: string | null;
  user_agent: string | null;
  count: number;
  first_seen_at: string;
  last_seen_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(code: number | null) {
  if (!code) {
    return (
      <Badge className="bg-gray-100 text-gray-600 text-xs">Unknown</Badge>
    );
  }
  if (code >= 400) {
    return (
      <Badge className="bg-red-100 text-red-700 text-xs">{code}</Badge>
    );
  }
  if (code >= 300) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 text-xs">{code}</Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-700 text-xs">{code}</Badge>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LinksPage() {
  const [activeTab, setActiveTab] = useState("broken");
  const [brokenLinks, setBrokenLinks] = useState<LinkCheck[]>([]);
  const [notFoundLogs, setNotFoundLogs] = useState<NotFoundLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningCrawl, setRunningCrawl] = useState(false);
  const [crawlMsg, setCrawlMsg] = useState<string | null>(null);
  const [createRedirectFor, setCreateRedirectFor] = useState<LinkCheck | null>(null);

  const loadBrokenLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/link-check?broken=true&limit=200");
      const json = await res.json();
      setBrokenLinks(json.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const load404Logs = useCallback(async () => {
    setLoading(true);
    try {
      // 404 logs are fetched via the link-check endpoint with a dedicated API call
      // We'll use the admin link-check API which returns not_found_log when ?type=404
      // For now fetch from a dedicated endpoint (we expose it via the same admin area)
      const res = await fetch("/api/admin/link-check?type=404&limit=200");
      const json = await res.json();
      // The link-check GET returns link_checks; 404 logs come from a separate query
      // Use the dedicated 404 admin query
      const res2 = await fetch("/api/admin/404-log");
      if (res2.ok) {
        const j2 = await res2.json();
        setNotFoundLogs(j2.data ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "broken") loadBrokenLinks();
    if (activeTab === "404") load404Logs();
  }, [activeTab, loadBrokenLinks, load404Logs]);

  async function runCrawl() {
    setRunningCrawl(true);
    setCrawlMsg(null);
    try {
      const res = await fetch("/api/admin/link-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const json = await res.json();
      setCrawlMsg(json.message ?? "Crawl started");
    } catch {
      setCrawlMsg("Failed to start crawl");
    } finally {
      setRunningCrawl(false);
    }
  }

  async function createRedirectFromBroken(link: LinkCheck) {
    // Navigate to redirects page with pre-filled from
    const from = link.target_url.startsWith("/") ? link.target_url : new URL(link.target_url).pathname;
    window.location.href = `/admin/seo/redirects?from=${encodeURIComponent(from)}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Link Health</h1>
          <p className="text-muted-foreground mt-1">
            Monitor broken links and 404 errors across the site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {crawlMsg && (
            <span className="text-sm text-muted-foreground">{crawlMsg}</span>
          )}
          <Button
            onClick={runCrawl}
            disabled={runningCrawl}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${runningCrawl ? "animate-spin" : ""}`} />
            {runningCrawl ? "Starting…" : "Run Check"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="broken">
            Broken Links
            {brokenLinks.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {brokenLinks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="404">404 Monitor</TabsTrigger>
        </TabsList>

        {/* Broken Links tab */}
        <TabsContent value="broken" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Broken Links</CardTitle>
              <CardDescription>
                Links that returned a 4xx/5xx response or timed out during the last crawl.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : brokenLinks.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No broken links found. Run a check to scan the site.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source Page</TableHead>
                        <TableHead>Broken Link</TableHead>
                        <TableHead>Anchor Text</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Last Checked</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brokenLinks.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell className="font-mono text-xs">
                            <a
                              href={link.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-blue-600 inline-flex items-center gap-1"
                            >
                              {truncate(link.source_url, 40)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px]">
                            <span className="text-red-600 break-all">
                              {truncate(link.target_url, 50)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {link.anchor_text ? truncate(link.anchor_text, 30) : (
                              <span className="text-gray-400 italic">—</span>
                            )}
                          </TableCell>
                          <TableCell>{statusBadge(link.status_code)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                link.is_internal
                                  ? "bg-blue-100 text-blue-700 text-xs"
                                  : "bg-purple-100 text-purple-700 text-xs"
                              }
                            >
                              {link.is_internal ? "Internal" : "External"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {fmtDate(link.last_checked_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createRedirectFromBroken(link)}
                              className="inline-flex items-center gap-1 text-xs"
                            >
                              <ArrowRight className="h-3 w-3" />
                              Redirect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 404 Monitor tab */}
        <TabsContent value="404" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">404 Monitor</CardTitle>
              <CardDescription>
                Pages that returned 404 to real visitors, sorted by hit count.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : notFoundLogs.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No 404s logged yet. They are captured automatically when visitors hit missing pages.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>Hits</TableHead>
                        <TableHead>Referrer</TableHead>
                        <TableHead>First Seen</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notFoundLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs text-red-600 max-w-[220px]">
                            <span className="break-all">{log.url}</span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                log.count >= 50
                                  ? "bg-red-100 text-red-800"
                                  : log.count >= 10
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {log.count}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[160px]">
                            {log.referrer ? (
                              <span className="break-all">{truncate(log.referrer, 50)}</span>
                            ) : (
                              <span className="italic text-gray-400">Direct</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {fmtDate(log.first_seen_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {fmtDate(log.last_seen_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.location.href = `/admin/seo/redirects?from=${encodeURIComponent(log.url)}`;
                              }}
                              className="inline-flex items-center gap-1 text-xs"
                            >
                              <ArrowRight className="h-3 w-3" />
                              Fix
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
