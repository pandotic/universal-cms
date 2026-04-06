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
  Bug,
  CheckCircle,
  Trash2,
  Copy,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
  ChevronDown,
  ChevronUp,
  FileCode,
} from "lucide-react";

// ---------- types ----------
type Severity = 'info' | 'warning' | 'error' | 'critical';
type Category = 'runtime' | 'api' | 'ui' | 'build';

interface ErrorEntry {
  id: string;
  message: string;
  stack: string | null;
  url: string | null;
  component: string | null;
  severity: Severity;
  category: Category;
  fingerprint: string | null;
  count: number;
  user_agent: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- severity config ----------
const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  info:     { label: 'Info',     color: 'text-blue-700',   bgColor: 'bg-blue-100',   icon: Info },
  warning:  { label: 'Warning',  color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: AlertTriangle },
  error:    { label: 'Error',    color: 'text-orange-700', bgColor: 'bg-orange-100', icon: AlertCircle },
  critical: { label: 'Critical', color: 'text-red-700',    bgColor: 'bg-red-100',    icon: Zap },
};

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.error;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
      cfg.bgColor, cfg.color
    )}>
      <cfg.icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  const colors: Record<Category, string> = {
    runtime: 'bg-gray-100 text-gray-700',
    api: 'bg-purple-100 text-purple-700',
    ui: 'bg-indigo-100 text-indigo-700',
    build: 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      colors[category] ?? colors.runtime
    )}>
      {category}
    </span>
  );
}

// ---------- copy for Claude ----------
function formatForClaude(entry: ErrorEntry): string {
  return [
    `## Error Report`,
    ``,
    `**Severity:** ${entry.severity}`,
    `**Category:** ${entry.category}`,
    `**Count:** ${entry.count}`,
    `**First seen:** ${new Date(entry.created_at).toLocaleString()}`,
    `**Last updated:** ${new Date(entry.updated_at).toLocaleString()}`,
    entry.url ? `**URL:** ${entry.url}` : null,
    entry.component ? `**Component:** ${entry.component}` : null,
    entry.user_agent ? `**User Agent:** ${entry.user_agent}` : null,
    ``,
    `**Message:**`,
    `\`\`\``,
    entry.message,
    `\`\`\``,
    entry.stack ? [``, `**Stack Trace:**`, `\`\`\``, entry.stack, `\`\`\``].join('\n') : null,
    ``,
    `Please help me debug this error.`,
  ].filter((line) => line !== null).join('\n');
}

// ---------- extract relevant file from stack trace ----------
function extractFilePath(stack: string | null): string | null {
  if (!stack) return null;
  // Match patterns like: at Component (./src/components/Foo.tsx:12:34)
  // or webpack-internal:///./src/app/bar/page.tsx
  const patterns = [
    /\((?:\.\/|\/)?([^)]+\.(?:tsx?|jsx?)):\d+:\d+\)/,
    /at\s+(?:\.\/|\/)?([^\s:]+\.(?:tsx?|jsx?)):\d+:\d+/,
    /webpack-internal:\/\/\/(?:\.\/)?([^\s"]+\.(?:tsx?|jsx?))/,
    /(?:^|\s)([./]?(?:src|pages|app|components|lib)[^\s:]+\.(?:tsx?|jsx?)):\d+/m,
  ];
  for (const re of patterns) {
    const match = stack.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

// ---------- ClaudePromptPanel ----------
function ClaudePromptPanel({ entry }: { entry: ErrorEntry }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const suggestedFile = extractFilePath(entry.stack);
  const claudePrompt = formatForClaude(entry);

  const handleCopy = () => {
    navigator.clipboard.writeText(claudePrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Hide Details" : "View Details"}
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          {/* Stack trace */}
          {entry.stack && (
            <div>
              <p className="mb-1 text-xs font-semibold text-gray-600">Full Stack Trace</p>
              <pre className="max-h-48 overflow-auto rounded bg-gray-900 p-2.5 text-xs text-gray-100 whitespace-pre-wrap break-all">
                {entry.stack}
              </pre>
            </div>
          )}

          {/* Suggested file */}
          {suggestedFile && (
            <div className="flex items-center gap-2 rounded border border-blue-100 bg-blue-50 px-3 py-2">
              <FileCode className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
              <div>
                <p className="text-xs font-medium text-blue-800">Suggested file to inspect:</p>
                <code className="mt-0.5 block font-mono text-xs text-blue-700">{suggestedFile}</code>
              </div>
            </div>
          )}

          {/* Claude prompt */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">Claude Prompt (ready to paste)</p>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {copied ? (
                  <><CheckCircle className="h-3 w-3 text-green-500" /> Copied</>
                ) : (
                  <><Copy className="h-3 w-3" /> Copy</>
                )}
              </button>
            </div>
            <pre className="max-h-64 overflow-auto rounded bg-gray-900 p-2.5 text-xs text-gray-100 whitespace-pre-wrap break-all">
              {claudePrompt}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- component ----------
export default function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'open' | 'resolved' | 'all'>('open');
  const [activeSeverity, setActiveSeverity] = useState<'all' | Severity>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchErrors = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/errors?limit=200')
      .then((res) => res.json())
      .then((json) => { setErrors(json.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  const filteredErrors = errors.filter((e) => {
    const resolvedMatch =
      activeTab === 'all' ? true :
      activeTab === 'open' ? !e.resolved_at :
      !!e.resolved_at;
    const severityMatch = activeSeverity === 'all' || e.severity === activeSeverity;
    return resolvedMatch && severityMatch;
  });

  const openCount = errors.filter((e) => !e.resolved_at).length;
  const criticalCount = errors.filter((e) => !e.resolved_at && e.severity === 'critical').length;

  const handleResolve = (id: string) => {
    setErrors((prev) => prev.map((e) => e.id === id ? { ...e, resolved_at: new Date().toISOString() } : e));
    fetch(`/api/admin/errors/${id}`, { method: 'PUT' }).catch(() => {});
  };

  const handleDelete = (id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
    fetch(`/api/admin/errors/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleCopyForClaude = (entry: ErrorEntry) => {
    const text = formatForClaude(entry);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  const statCards = [
    { label: 'Total Errors', value: errors.length, icon: Bug, color: 'text-gray-600 bg-gray-50' },
    { label: 'Open', value: openCount, icon: AlertCircle, color: 'text-orange-600 bg-orange-50' },
    { label: 'Critical Open', value: criticalCount, icon: Zap, color: 'text-red-600 bg-red-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Error Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor, triage, and resolve client-side and server-side errors
        </p>
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

      {/* Severity filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Severity:</span>
        {(['all', 'critical', 'error', 'warning', 'info'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setActiveSeverity(sev)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeSeverity === sev
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {sev === 'all' ? 'All' : SEVERITY_CONFIG[sev].label}
          </button>
        ))}
      </div>

      {/* Tabs + Table */}
      <Card>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="open">
                  Open
                  {openCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-orange-200 px-1.5 py-0.5 text-xs font-semibold text-orange-800">
                      {openCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          {(['open', 'resolved', 'all'] as const).map((tab) => (
            <TabsContent key={tab} value={tab}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Severity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-20">Category</TableHead>
                      <TableHead className="w-16 text-center">Count</TableHead>
                      <TableHead className="w-40">URL</TableHead>
                      <TableHead className="w-32">First Seen</TableHead>
                      <TableHead className="w-36">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredErrors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-gray-500">
                          No errors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredErrors.map((entry) => {
                        const isExpanded = expandedId === entry.id;
                        return (
                          <TableRow key={entry.id} className={cn(entry.resolved_at && "opacity-60")}>
                            <TableCell>
                              <SeverityBadge severity={entry.severity} />
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                className="text-left hover:text-blue-600 w-full"
                              >
                                <span className="block truncate font-medium text-sm">
                                  {entry.message}
                                </span>
                              </button>
                              {isExpanded && (
                                <div className="mt-2 space-y-2">
                                  {entry.component && (
                                    <p className="text-xs text-gray-500">Component: <span className="font-mono">{entry.component}</span></p>
                                  )}
                                  {entry.user_agent && (
                                    <p className="text-xs text-gray-500 truncate">UA: {entry.user_agent}</p>
                                  )}
                                  <ClaudePromptPanel entry={entry} />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <CategoryBadge category={entry.category} />
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={cn(
                                "inline-flex items-center justify-center rounded-full w-6 h-6 text-xs font-semibold",
                                entry.count > 10 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                              )}>
                                {entry.count}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500 max-w-[10rem]">
                              {entry.url ? (
                                <span className="truncate block" title={entry.url}>
                                  {entry.url.replace(/^https?:\/\/[^/]+/, '')}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {new Date(entry.created_at).toLocaleString(undefined, {
                                month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {!entry.resolved_at && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleResolve(entry.id)}
                                    className="h-7 px-2 text-green-600 hover:bg-green-50 hover:text-green-700"
                                    title="Mark resolved"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyForClaude(entry)}
                                  className="h-7 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                  title="Copy for Claude"
                                >
                                  {copiedId === entry.id ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(entry.id)}
                                  className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}
