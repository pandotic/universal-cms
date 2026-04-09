import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function BootstrapAdminPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBootstrap = async () => {
    if (!user) {
      setResult({ success: false, message: 'You must be signed in first. Sign up via Supabase Auth, then return here.' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('bootstrap_first_admin');
      if (error) {
        setResult({ success: false, message: error.message });
      } else {
        setResult({
          success: true,
          message: data
            ? 'You are now a platform admin! Redirecting to the admin panel...'
            : 'A platform admin already exists. This bootstrap is only for first-time setup.',
        });
      }
    } catch (err) {
      setResult({ success: false, message: String(err) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <ShieldCheck className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Bootstrap Admin</h1>
          <p className="text-sm text-gray-500 mt-2">
            This sets the first signed-in user as the platform administrator.
            It only works once — when no admin exists yet.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          {!user && (
            <div className="bg-yellow-50 text-yellow-800 text-sm px-4 py-3 rounded-lg">
              You need to sign in first. Create an account through Supabase Auth, then come back here.
            </div>
          )}

          {result && (
            <div className={`text-sm px-4 py-3 rounded-lg ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.message}
            </div>
          )}

          <button
            onClick={handleBootstrap}
            disabled={isLoading || !user}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Bootstrapping...' : 'Bootstrap Admin'}
          </button>

          {result?.success && (
            <Link
              to="/admin"
              className="block text-center text-sm text-blue-600 hover:underline mt-2"
            >
              Go to Admin Panel
            </Link>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
