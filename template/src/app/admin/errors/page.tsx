"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Badge,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
  CardContent,
} from "@pandotic/universal-cms/components/ui";
import { Bug, AlertTriangle, Filter, CheckCircle } from "lucide-react";

type Severity = "error" | "warning" | "info";

interface ErrorEntry {
  id: string;
  message: string;
  severity: Severity;
  category: string;
  stack_trace: string;
  resolved: boolean;
  created_at: string;
}

const SEVERITY_VARIANT: Record<Severity, "destructive" | "secondary" | "outline"> = {
  error: "destructive",
  warning: "secondary",
  info: "outline",
};

const SEVERITY_ICON: Record<Severity, typeof AlertTriangle> = {
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Bug,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [resolvedFilter, setResolvedFilter] = useState<"all" | "resolved" | "unresolved">("all");

  useEffect(() => {
    fetch("/api/admin/errors")
      .then((res) => res.json())
      .then((json) => {
        setErrors(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredErrors = useMemo(() => {
    return errors.filter((entry) => {
      const matchesSeverity = severityFilter === "all" || entry.severity === severityFilter;
      const matchesResolved =
        resolvedFilter === "all" ||
        (resolvedFilter === "resolved" && entry.resolved) ||
        (resolvedFilter === "unresolved" && !entry.resolved);
      return matchesSeverity && matchesResolved;
    });
  }, [errors, severityFilter, resolvedFilter]);

  function toggleResolved(id: string) {
    const entry = errors.find((e) => e.id === id);
    if (!entry) return;
    const newResolved = !entry.resolved;
    fetch(`/api/admin/errors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: newResolved }),
    })
      .then((res) => {
        if (res.ok) {
          setErrors((prev) =>
            prev.map((e) => (e.id === id ? { ...e, resolved: newResolved } : e))
          );
        }
      })
      .catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-foreground-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Error Log</h1>
        <p className="text-foreground-secondary">
          Monitor and resolve application errors and warnings.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-foreground-secondary">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <Select
          value={severityFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSeverityFilter(e.target.value as Severity | "all")
          }
        >
          <option value="all">All Severities</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </Select>
        <Select
          value={resolvedFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setResolvedFilter(e.target.value as "all" | "resolved" | "unresolved")
          }
        >
          <option value="all">All Status</option>
          <option value="unresolved">Unresolved</option>
          <option value="resolved">Resolved</option>
        </Select>
      </div>

      {/* Table / Empty State */}
      {filteredErrors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-12 w-12 text-foreground-tertiary" />
            <h3 className="mt-4 text-lg font-semibold">No errors found</h3>
            <p className="mt-1 text-sm text-foreground-secondary">
              {errors.length === 0
                ? "No errors have been logged yet."
                : "No errors match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredErrors.map((entry) => {
                const Icon = SEVERITY_ICON[entry.severity];
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant={SEVERITY_VARIANT[entry.severity]}>
                        <Icon className="mr-1 h-3 w-3" />
                        {entry.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate font-medium">{entry.message}</p>
                    </TableCell>
                    <TableCell className="text-foreground-secondary">
                      {entry.category}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-foreground-secondary">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell>
                      {entry.resolved ? (
                        <Badge variant="success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline">Unresolved</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleResolved(entry.id)}
                      >
                        {entry.resolved ? "Unresolve" : "Resolve"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
