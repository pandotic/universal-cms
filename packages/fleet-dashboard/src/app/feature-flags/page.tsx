"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { FeatureFlagPanel } from "@universal-cms/admin-ui";
import { adminConfig } from "@/config/admin-config";

export default function FeatureFlagsPage() {
  const [userId, setUserId] = useState<string>("");
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );

    client.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setSupabase(client);
      }
    });
  }, []);

  if (!userId || !supabase) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!adminConfig.features.featureFlags) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-400">Feature Disabled</p>
        <p className="mt-1 text-sm text-amber-400/70">Feature flag management is not enabled in this configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Feature Flags</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage feature rollouts, targeting, and gradual deployments</p>
      </div>

      <FeatureFlagPanel supabase={supabase} currentUserId={userId} />
    </div>
  );
}
