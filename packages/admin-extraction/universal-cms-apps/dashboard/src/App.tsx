import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConnectedAppsPage } from './pages/ConnectedAppsPage';
import { RegisterAppPage } from './pages/RegisterAppPage';

/**
 * Universal CMS Dashboard
 *
 * This is an oversight dashboard, NOT a remote control plane.
 *
 * Design decision: Each connected app runs its own admin panel using
 * the @universal-cms packages. This dashboard provides a bird's-eye
 * view of all connected apps with health status and deep-links into
 * each app's own admin UI.
 *
 * Why not remote control?
 * - Each app has its own Supabase project with its own auth
 * - Cross-app writes would require service-role keys for every app
 * - Deep-linking preserves each app's auth boundary
 * - Simpler security model: read-only oversight + navigation
 *
 * Future: v2 may add cross-app analytics aggregation, but writes
 * will always happen within each app's own admin.
 */
export function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Universal CMS</h1>
          <nav className="flex gap-4">
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Apps</a>
            <a href="/register" className="text-sm text-gray-600 hover:text-gray-900">Register App</a>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<ConnectedAppsPage />} />
          <Route path="/register" element={<RegisterAppPage />} />
        </Routes>
      </main>
    </div>
  );
}
