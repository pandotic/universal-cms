"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/ssr";
import { AuditLogViewer } from "@pandotic/admin-ui";
import { adminConfig } from "@/config/admin-config";

export default function AuditLogPage() {
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!adminConfig.features.auditLog) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-400">Feature Disabled</p>
        <p className="mt-1 text-sm text-amber-400/70">
          Audit logging is not enabled in your configuration.
        </p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <AuditLogViewer
      supabase={supabase}
      limit={100}
    />
  );
}
