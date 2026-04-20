"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Lazy singleton browser Supabase client for Team Hub code.
 *
 * Team-hub's original codebase imports `supabase` as a top-level module-scoped
 * singleton (`import { supabase } from '@/lib/team-hub/supabase'`). Fleet-dashboard
 * uses a factory (`createClient()` from `@/lib/supabase/client`). This shim
 * keeps the team-hub call sites unchanged while sharing fleet-dashboard's
 * cookie-based auth session so the same sign-in covers both surfaces.
 */
export const supabase = createClient();
