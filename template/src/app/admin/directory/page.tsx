"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
} from "@pandotic/universal-cms/components/ui";
import { BookOpen } from "lucide-react";

interface DirectoryEntry {
  id: string;
  name: string;
  slug: string;
}

export default function DirectoryPage() {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/directory")
      .then((res) => res.json())
      .then((json) => {
        setEntries(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-2xl font-bold tracking-tight">Directory</h1>
        <p className="text-foreground-secondary">
          Browse and manage entity listings in your directory.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="h-12 w-12 text-foreground-tertiary" />
          <h3 className="mt-4 text-lg font-semibold">Coming Soon</h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            The entity directory is being built. Check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
