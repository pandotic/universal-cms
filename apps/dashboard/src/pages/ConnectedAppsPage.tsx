import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ExternalLink, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { ConnectedApp } from '../lib/types';

const STATUS_CONFIG = {
  healthy:  { icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-100',  label: 'Healthy' },
  degraded: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Degraded' },
  down:     { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-100',    label: 'Down' },
  unknown:  { icon: HelpCircle,    color: 'text-gray-600',   bg: 'bg-gray-100',   label: 'Unknown' },
};

export function ConnectedAppsPage() {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('connected_apps')
        .select('*')
        .order('name');

      if (!error && data) {
        setApps(data as ConnectedApp[]);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const openAdmin = (app: ConnectedApp) => {
    const url = app.admin_deep_link_template || `${app.url}/admin`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Connected Apps</h2>
          <p className="text-sm text-gray-500 mt-1">
            Oversight dashboard — deep-link into each app&apos;s admin panel.
          </p>
        </div>
        <Link
          to="/dashboard/register"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Register App
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connected apps yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Register your first app to see it here. Each app runs its own admin
            using the @universal-cms packages.
          </p>
          <Link
            to="/dashboard/register"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Register an app
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => {
            const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.unknown;
            const StatusIcon = status.icon;

            return (
              <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{app.url}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </div>
                </div>

                {app.last_health_check && (
                  <p className="text-xs text-gray-400 mb-4">
                    Last checked: {new Date(app.last_health_check).toLocaleString()}
                  </p>
                )}

                <button
                  onClick={() => openAdmin(app)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Admin
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
