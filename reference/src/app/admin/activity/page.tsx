"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Badge,
  Select,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
  CardContent,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import { Activity, Filter, Clock } from "lucide-react";

// TODO: Wire to GET /api/admin/activity for data
// Sample data shape:
// const sampleActivity: ActivityEntry[] = [
//   { id: "1", timestamp: "2025-12-15T14:30:00Z", user_email: "admin@example.com", action: "create", entity_type: "content_page", entity_title: "Getting Started Guide", details: "Created new guide page" },
//   { id: "2", timestamp: "2025-12-15T13:00:00Z", user_email: "editor@example.com", action: "publish", entity_type: "review", entity_title: "Acme Corp Review", details: "Published review" },
// ];

type ActionType = "create" | "update" | "delete" | "publish" | "archive";
type EntityType = "content_page" | "review" | "listicle" | "media" | "user" | "setting" | "affiliate" | "certification";

interface ActivityEntry {
  id: string;
  timestamp: string;
  user_email: string;
  action: ActionType;
  entity_type: EntityType;
  entity_title: string;
  details: string;
}

const ACTION_VARIANT: Record<ActionType, "success" | "secondary" | "destructive" | "default" | "outline"> = {
  create: "success",
  update: "secondary",
  delete: "destructive",
  publish: "default",
  archive: "outline",
};

const ACTION_LABELS: Record<ActionType, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  publish: "Published",
  archive: "Archived",
};

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  content_page: "Content Page",
  review: "Review",
  listicle: "Listicle",
  media: "Media",
  user: "User",
  setting: "Setting",
  affiliate: "Affiliate",
  certification: "Certification",
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PAGE_SIZE = 20;

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<EntityType | "all">("all");
  const [actionFilter, setActionFilter] = useState<ActionType | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch("/api/admin/activity")
      .then((res) => res.json())
      .then((json) => { setEntries(json.data ?? []); })
      .catch(() => { /* silently handle - empty list is fine */ })
      .finally(() => setLoading(false));
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesEntity =
        entityFilter === "all" || entry.entity_type === entityFilter;
      const matchesAction =
        actionFilter === "all" || entry.action === actionFilter;
      const matchesDateFrom =
        !dateFrom || new Date(entry.timestamp) >= new Date(dateFrom);
      const matchesDateTo =
        !dateTo || new Date(entry.timestamp) <= new Date(dateTo + "T23:59:59Z");
      return matchesEntity && matchesAction && matchesDateFrom && matchesDateTo;
    });
  }, [entries, entityFilter, actionFilter, dateFrom, dateTo]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  function loadMore() {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">
          Track all changes and actions across the admin panel.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Filters:
          </span>
        </div>
        <Select
          value={entityFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setEntityFilter(e.target.value as EntityType | "all")
          }
        >
          <option value="all">All Entity Types</option>
          {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={actionFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setActionFilter(e.target.value as ActionType | "all")
          }
        >
          <option value="all">All Actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDateFrom(e.target.value)
            }
            className="w-auto"
            placeholder="From"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDateTo(e.target.value)
            }
            className="w-auto"
            placeholder="To"
          />
        </div>
      </div>

      {/* Table / Empty State */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No activity found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {entries.length === 0
                ? "Activity will appear here as changes are made."
                : "No entries match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity Title</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatRelativeTime(entry.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.user_email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[entry.action]}>
                        {ACTION_LABELS[entry.action]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ENTITY_TYPE_LABELS[entry.entity_type]}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm font-medium">
                      {entry.entity_title}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                      {entry.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore}>
                Load More ({filteredEntries.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
