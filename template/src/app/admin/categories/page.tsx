"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
} from "@pandotic/universal-cms/components/ui";
import { FolderTree } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((json) => {
        setCategories(json.data ?? []);
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
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-foreground-secondary">
          Organize your content with categories and tags.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FolderTree className="h-12 w-12 text-foreground-tertiary" />
          <h3 className="mt-4 text-lg font-semibold">Coming Soon</h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            Category management is being built. Check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
