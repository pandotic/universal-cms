import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { SupabaseClientAdapter } from '../../../admin/index.js';
import { isPlatformAdmin } from '../../../admin/index.js';

export interface PlatformAdminRouteProps {
  children: React.ReactNode;
  supabase: SupabaseClientAdapter;
  /** Current authenticated user, or null if not logged in */
  user: { id: string } | null;
  /** Whether auth state is still loading */
  authLoading: boolean;
  /** If true, bypass all admin checks (dev mode) */
  devMode?: boolean;
  /** Route to redirect to if not authenticated */
  loginRoute?: string;
  /** Route to redirect to if not authorized */
  fallbackRoute?: string;
}

export function PlatformAdminRoute({
  children,
  supabase,
  user,
  authLoading,
  devMode = false,
  loginRoute = '/login',
  fallbackRoute = '/',
}: PlatformAdminRouteProps) {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current || authLoading) return;

    if (devMode) {
      setIsAdmin(true);
      setIsChecking(false);
      hasChecked.current = true;
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setIsChecking(false);
      hasChecked.current = true;
      return;
    }

    isPlatformAdmin(supabase, user.id)
      .then((result) => {
        setIsAdmin(result);
        setIsChecking(false);
        hasChecked.current = true;
      })
      .catch(() => {
        setIsAdmin(false);
        setIsChecking(false);
        hasChecked.current = true;
      });
  }, [user, authLoading, supabase, devMode]);

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user && !devMode) {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={loginRoute} state={{ from: fullPath }} replace />;
  }

  if (isAdmin === false && !devMode) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}
