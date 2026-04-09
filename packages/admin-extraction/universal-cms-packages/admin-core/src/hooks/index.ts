/**
 * React hooks for the universal admin system.
 *
 * These provide convenient access to RBAC checks, admin tier detection,
 * and common admin data needs.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SupabaseClientAdapter, AdminTierInfo, UserRole, FeatureFlag, AdminSetting } from '../types/index.js';
import { isPlatformAdmin, detectAdminTier, getUserRoles } from '../rbac/index.js';
import { getFeatureFlags, isFeatureEnabled, getAdminSettingsByCategory } from '../services/index.js';

// ---------------------------------------------------------------------------
// useAdminTier — detect the current user's admin tier
// ---------------------------------------------------------------------------

export function useAdminTier(
  supabase: SupabaseClientAdapter,
  userId: string | undefined,
): { tier: AdminTierInfo | null; isLoading: boolean } {
  const [tier, setTier] = useState<AdminTierInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!userId || hasChecked.current) return;
    hasChecked.current = true;

    detectAdminTier(supabase, userId)
      .then(setTier)
      .catch(() => setTier(null))
      .finally(() => setIsLoading(false));
  }, [supabase, userId]);

  return { tier, isLoading };
}

// ---------------------------------------------------------------------------
// useIsPlatformAdmin
// ---------------------------------------------------------------------------

export function useIsPlatformAdmin(
  supabase: SupabaseClientAdapter,
  userId: string | undefined,
): { isAdmin: boolean | null; isLoading: boolean } {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!userId || hasChecked.current) return;
    hasChecked.current = true;

    isPlatformAdmin(supabase, userId)
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
      .finally(() => setIsLoading(false));
  }, [supabase, userId]);

  return { isAdmin, isLoading };
}

// ---------------------------------------------------------------------------
// useUserRoles
// ---------------------------------------------------------------------------

export function useUserRoles(
  supabase: SupabaseClientAdapter,
  userId: string | undefined,
): { roles: UserRole[]; isLoading: boolean; refresh: () => void } {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await getUserRoles(supabase, userId);
      setRoles(data);
    } catch {
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => { load(); }, [load]);

  return { roles, isLoading, refresh: load };
}

// ---------------------------------------------------------------------------
// useFeatureFlag
// ---------------------------------------------------------------------------

export function useFeatureFlag(
  supabase: SupabaseClientAdapter,
  flagKey: string,
  context?: { userId?: string; orgId?: string; roleType?: string },
): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    isFeatureEnabled(supabase, flagKey, context)
      .then(setEnabled)
      .catch(() => setEnabled(false));
  }, [supabase, flagKey, context?.userId, context?.orgId, context?.roleType]);

  return enabled;
}

// ---------------------------------------------------------------------------
// useFeatureFlags — list all flags (for admin UI)
// ---------------------------------------------------------------------------

export function useFeatureFlags(
  supabase: SupabaseClientAdapter,
): { flags: FeatureFlag[]; isLoading: boolean; refresh: () => void } {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFeatureFlags(supabase);
      setFlags(data);
    } catch {
      setFlags([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  return { flags, isLoading, refresh: load };
}

// ---------------------------------------------------------------------------
// useAdminSettings
// ---------------------------------------------------------------------------

export function useAdminSettings(
  supabase: SupabaseClientAdapter,
  category: string,
): { settings: AdminSetting[]; isLoading: boolean; refresh: () => void } {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminSettingsByCategory(supabase, category);
      setSettings(data);
    } catch {
      setSettings([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, category]);

  useEffect(() => { load(); }, [load]);

  return { settings, isLoading, refresh: load };
}
