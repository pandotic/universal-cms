"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { EntityManagementPanel } from "@universal-cms/admin-ui";
import { propertyAdapter } from "@/lib/adapters/property-adapter";
import { adminConfig } from "@/config/admin-config";

export default function PropertiesPage() {
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
    setSupabase(client);
  }, []);

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!adminConfig.features.properties) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-400">Feature Disabled</p>
        <p className="mt-1 text-sm text-amber-400/70">Property management is not enabled in this configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Properties</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage registered properties, sites, and apps</p>
      </div>

      <EntityManagementPanel supabase={supabase} adapter={propertyAdapter} pageSize={25} />
    </div>
  );
}
