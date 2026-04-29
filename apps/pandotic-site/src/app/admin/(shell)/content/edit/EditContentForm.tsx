"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContentPageEditor } from "@pandotic/universal-cms/components/admin";
import { getContentPageById } from "@pandotic/universal-cms/data/content";
import type { ContentPage } from "@pandotic/universal-cms/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function EditContentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [page, setPage] = useState<ContentPage | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing page id.");
      return;
    }
    let cancelled = false;
    getContentPageById(supabase, id)
      .then((row) => {
        if (!cancelled) setPage(row);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, id]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }
  if (page === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }
  if (page === null) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-foreground-secondary">Page not found.</p>
      </div>
    );
  }

  return (
    <ContentPageEditor
      page={page}
      supabase={supabase}
      onSave={() => router.replace("/admin/content")}
      onCancel={() => router.replace("/admin/content")}
    />
  );
}
