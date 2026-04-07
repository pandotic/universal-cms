"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@pandotic/universal-cms/components/ui";
import { FileText, Image, Users, Activity } from "lucide-react";

interface DashboardStats {
  contentPages: number;
  mediaFiles: number;
  activeUsers: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_title: string;
    created_at: string;
  }>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((json) => setStats(json.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-foreground-secondary">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-foreground-secondary">Overview of your CMS.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Content Pages
            </CardTitle>
            <FileText className="h-4 w-4 text-foreground-tertiary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats?.contentPages ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Media Files
            </CardTitle>
            <Image className="h-4 w-4 text-foreground-tertiary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats?.mediaFiles ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-foreground-tertiary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats?.activeUsers ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Recent Activity
            </CardTitle>
            <Activity className="h-4 w-4 text-foreground-tertiary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {stats?.recentActivity?.length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.recentActivity?.length ? (
            <p className="py-8 text-center text-sm text-foreground-secondary">
              No recent activity.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border border-border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {entry.action}{" "}
                      <span className="text-foreground-secondary">
                        {entry.entity_type}
                      </span>
                    </p>
                    <p className="text-xs text-foreground-tertiary">
                      {entry.entity_title}
                    </p>
                  </div>
                  <span className="text-xs text-foreground-tertiary">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
