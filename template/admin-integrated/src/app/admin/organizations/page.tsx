"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/ssr";
import { OrganizationManagementPanel } from "@pandotic/admin-ui";
import { adminConfig } from "@/config/admin-config";

export default function OrganizationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  if (!adminConfig.features.organizations) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-400">Feature Disabled</p>
        <p className="mt-1 text-sm text-amber-400/70">
          Organization management is not enabled in your configuration.
        </p>
      </div>
    );
  }

  return (
    <OrganizationManagementPanel
      supabase={supabase}
      currentUserId={userId}
    />
  );
}
