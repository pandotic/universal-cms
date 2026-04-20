import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Shield, LogOut, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useIsPlatformAdmin } from '@pandotic/universal-cms/admin';
import { supabase } from '../lib/supabaseClient';
import type { SupabaseClientAdapter } from '@pandotic/universal-cms/admin';

export function AppLayout({ fullBleed = false }: { fullBleed?: boolean }) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsPlatformAdmin(
    supabase as unknown as SupabaseClientAdapter,
    user?.id,
  );
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Universal CMS</h1>
          <nav className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 text-sm ${isActive('/dashboard') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              to="/dashboard/tools/pmf-evaluator"
              className={`flex items-center gap-1.5 text-sm ${isActive('/dashboard/tools') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Wrench className="h-4 w-4" />
              Tools
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 text-sm ${isActive('/admin') ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}

            <span className="text-xs text-gray-400 hidden sm:inline">
              {user?.email}
            </span>

            <button
              onClick={signOut}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>

      <main className={fullBleed ? '' : 'max-w-7xl mx-auto px-6 py-8'}>
        <Outlet />
      </main>
    </div>
  );
}
