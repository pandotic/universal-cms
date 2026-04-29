"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContentPageEditor } from "@pandotic/universal-cms/components/admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function NewContentPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return (
    <ContentPageEditor
      supabase={supabase}
      onSave={(page) => router.replace(`/admin/content/${page.id}`)}
      onCancel={() => router.replace("/admin/content")}
    />
  );
}
