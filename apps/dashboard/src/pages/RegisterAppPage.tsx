import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function RegisterAppPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    url: '',
    supabase_project_url: '',
    admin_deep_link_template: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: insertError } = await supabase
      .from('connected_apps')
      .insert({
        name: form.name,
        url: form.url,
        supabase_project_url: form.supabase_project_url || null,
        admin_deep_link_template: form.admin_deep_link_template || null,
        status: 'unknown',
      });

    if (insertError) {
      setError(insertError.message);
      setIsSubmitting(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Register New App</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="HomeDoc"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">App URL</label>
          <input
            type="url"
            required
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://app.homedoc.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supabase Project URL</label>
          <input
            type="url"
            value={form.supabase_project_url}
            onChange={(e) => setForm({ ...form, supabase_project_url: e.target.value })}
            placeholder="https://abc123.supabase.co"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Deep Link Template</label>
          <input
            type="text"
            value={form.admin_deep_link_template}
            onChange={(e) => setForm({ ...form, admin_deep_link_template: e.target.value })}
            placeholder="https://app.homedoc.com/admin"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL to deep-link into this app&apos;s admin panel. Defaults to {'{url}/admin'}.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {isSubmitting ? 'Registering...' : 'Register App'}
        </button>
      </form>
    </div>
  );
}
