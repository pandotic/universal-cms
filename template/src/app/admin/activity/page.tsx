"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "@pandotic/universal-cms/components/ui";
import { Activity, Filter, Clock } from "lucide-react";

type ActionType = "create" | "update" | "delete" | "publish" | "archive";
type EntityType = "content_page" | "review" | "media" | "user" | "setting";

interface ActivityEntry {
  id: string;
  user_name: string;
  action: ActionType;
  entity_type: EntityType;
  entity_title: string;
  details: string;
  created_at: string;
}

const PAGE_SIZE = 20;

const ACTION_VARIANT: Record<ActionType, "default" | "success" | "destructive" | "secondary" | "outline"> = {
  create: "success",
  update: "secondary",
  delete: "destructive",
  publish: "default",
  archive: "outline",
};

const ENTITY_LABELS: Record<EntityType, string> = {
  content_page: "Content Page",
  review: "Review",
  media: "Media",
  user: "User",
  setting: "Setting",
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
      .then((json) => {
        setEntries(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesEntity = entityFilter === "all" || entry.entity_type === entityFilter;
      const matchesAction = actionFilter === "all" || entry.action === actionFilter;
      const entryDate = new Date(entry.created_at);
      const matchesFrom = !dateFrom || entryDate >= new Date(dateFrom);
      const matchesTo = !dateTo || entryDate <= new Date(dateTo + "T23:59:59");
      return matchesEntity && matchesAction && matchesFrom && matchesTo;
    });
  }, [entries, entityFilter, actionFilter, dateFrom, dateTo]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

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
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-foreground-secondary">
          Track all actions performed across the system.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-foreground-secondary">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <Select
          value={entityFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setEntityFilter(e.target.value as EntityType | "all")
          }
        >
          <option value="all">All Entities</option>
          <option value="content_page">Content Pages</option>
          <option value="review">Reviews</option>
          <option value="media">Media</option>
          <option value="user">Users</option>
          <option value="setting">Settings</option>
        </Select>
        <Select
          value={actionFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setActionFilter(e.target.value as ActionType | "all")
          }
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="publish">Publish</option>
          <option value="archive">Archive</option>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDateFrom(e.target.value)
          }
          className="w-auto"
          placeholder="From"
        />
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

      {/* Table / Empty State */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-foreground-tertiary" />
            <h3 className="mt-4 text-lg font-semibold">No activity found</h3>
            <p className="mt-1 text-sm text-foreground-secondary">
              {entries.length === 0
                ? "Activity will appear here as actions are performed."
                : "No activity matches your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Time
                    </div>
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-foreground-secondary">
                      {formatRelativeTime(entry.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.user_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[entry.action]}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground-secondary">
                      {ENTITY_LABELS[entry.entity_type]}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.entity_title}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-foreground-tertiary">
                      {entry.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Load More ({filteredEntries.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
