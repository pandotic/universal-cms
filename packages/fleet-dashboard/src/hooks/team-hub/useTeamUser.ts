"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/team-hub/types";

export function useTeamUser() {
  const supabase = createClient();
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAuthUserId(data.user?.id ?? null);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ["team-hub-user", authUserId],
    enabled: !!authUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authUserId!)
        .maybeSingle();
      if (error) throw error;
      return (data as User | null) ?? null;
    },
  });

  const teamUser = data ?? null;
  const loading = authLoading || (!!authUserId && queryLoading);

  return {
    teamUser,
    authUserId,
    loading,
    isMember: !!teamUser,
  };
}
