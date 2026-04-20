import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlatformAdminRoute } from '@pandotic/universal-cms/components/admin';
import type { SupabaseClientAdapter } from '@pandotic/universal-cms/admin';
import { supabase } from './lib/supabaseClient';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { BootstrapAdminPage } from './pages/BootstrapAdminPage';
import { ConnectedAppsPage } from './pages/ConnectedAppsPage';
import { RegisterAppPage } from './pages/RegisterAppPage';
import { AdminPage } from './pages/AdminPage';
import { PMFEvaluatorPage } from './pages/PMFEvaluatorPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function AdminRouteWrapper() {
  const { user, isLoading } = useAuth();
  const sb = supabase as unknown as SupabaseClientAdapter;

  return (
    <PlatformAdminRoute
      supabase={sb}
      user={user ? { id: user.id } : null}
      authLoading={isLoading}
      loginRoute="/login"
      fallbackRoute="/dashboard"
    >
      <AdminPage />
    </PlatformAdminRoute>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/bootstrap-admin" element={<BootstrapAdminPage />} />

        {/* Authenticated routes with shared layout */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<ConnectedAppsPage />} />
          <Route path="/dashboard/register" element={<RegisterAppPage />} />
          <Route path="/admin" element={<AdminRouteWrapper />} />
        </Route>

        {/* Full-bleed layout for embedded tools */}
        <Route element={<RequireAuth><AppLayout fullBleed /></RequireAuth>}>
          <Route path="/dashboard/tools/pmf-evaluator" element={<PMFEvaluatorPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
