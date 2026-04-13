import Link from "next/link";
import { ArrowRight, Users, Lock, Flag, Activity } from "lucide-react";
import { getEnabledFeatures } from "@/config/admin-config";

export default function Home() {
  const enabledFeatures = getEnabledFeatures();

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Integrated</h1>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Go to Admin <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <section className="mb-12">
          <h2 className="mb-4 text-4xl font-bold">
            Example: @pandotic/admin-ui Integration
          </h2>
          <p className="mb-8 text-lg text-zinc-400">
            This template demonstrates how to integrate the admin-ui package
            into your Next.js application with selective features enabled.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Feature Card - Users */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <Users className="mb-3 h-6 w-6 text-blue-400" />
              <h3 className="mb-2 font-semibold">User Management</h3>
              <p className="text-sm text-zinc-400">
                Create, suspend, and manage users across your platform.
              </p>
              <p
                className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  enabledFeatures.includes("users")
                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                    : "bg-zinc-800 text-zinc-500 ring-zinc-700"
                }`}
              >
                {enabledFeatures.includes("users") ? "✓ Enabled" : "Disabled"}
              </p>
            </div>

            {/* Feature Card - Organizations */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <Lock className="mb-3 h-6 w-6 text-purple-400" />
              <h3 className="mb-2 font-semibold">Organizations</h3>
              <p className="text-sm text-zinc-400">
                Multi-tenant organization and group management with role-based
                access.
              </p>
              <p
                className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  enabledFeatures.includes("organizations")
                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                    : "bg-zinc-800 text-zinc-500 ring-zinc-700"
                }`}
              >
                {enabledFeatures.includes("organizations")
                  ? "✓ Enabled"
                  : "Disabled"}
              </p>
            </div>

            {/* Feature Card - Feature Flags */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <Flag className="mb-3 h-6 w-6 text-orange-400" />
              <h3 className="mb-2 font-semibold">Feature Flags</h3>
              <p className="text-sm text-zinc-400">
                Manage feature rollouts with gradual percentage-based targeting.
              </p>
              <p
                className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  enabledFeatures.includes("featureFlags")
                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                    : "bg-zinc-800 text-zinc-500 ring-zinc-700"
                }`}
              >
                {enabledFeatures.includes("featureFlags")
                  ? "✓ Enabled"
                  : "Disabled"}
              </p>
            </div>

            {/* Feature Card - Audit Log */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <Activity className="mb-3 h-6 w-6 text-green-400" />
              <h3 className="mb-2 font-semibold">Audit Logging</h3>
              <p className="text-sm text-zinc-400">
                Compliance-grade action tracking with before/after state diffs.
              </p>
              <p
                className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  enabledFeatures.includes("auditLog")
                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                    : "bg-zinc-800 text-zinc-500 ring-zinc-700"
                }`}
              >
                {enabledFeatures.includes("auditLog") ? "✓ Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </section>

        {/* Setup Instructions */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="mb-6 text-2xl font-bold">Getting Started</h2>

          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold">1. Environment Setup</h3>
              <p className="mb-3 text-zinc-400">
                Create a <code className="rounded bg-zinc-800 px-2 py-1">.env.local</code> file:
              </p>
              <pre className="overflow-x-auto rounded bg-zinc-800 p-4 text-sm">
                {`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`}
              </pre>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">2. Database Setup</h3>
              <p className="text-zinc-400">
                Run admin-schema migrations in your Supabase project. See{" "}
                <code className="rounded bg-zinc-800 px-2 py-1">
                  docs/ADMIN_UI_INTEGRATION_GUIDE.md
                </code>{" "}
                for migration files.
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">3. Install Dependencies</h3>
              <pre className="overflow-x-auto rounded bg-zinc-800 p-4 text-sm">
                npm install
              </pre>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">4. Run Development Server</h3>
              <pre className="overflow-x-auto rounded bg-zinc-800 p-4 text-sm">
                npm run dev
              </pre>
              <p className="mt-3 text-zinc-400">
                Open <a href="http://localhost:3000/admin" className="text-blue-400 hover:underline">
                  http://localhost:3000/admin
                </a>{" "}
                to access the admin dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Key Files */}
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">Key Files</h2>

          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="font-mono text-sm font-semibold text-blue-400">
                src/config/admin-config.ts
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Feature toggles - customize which admin features are enabled.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="font-mono text-sm font-semibold text-blue-400">
                src/app/admin/page.tsx
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Main admin dashboard - shows example of using admin-ui components.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="font-mono text-sm font-semibold text-blue-400">
                src/app/admin/users/page.tsx
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                User management page using UserManagementPanel component.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="font-mono text-sm font-semibold text-blue-400">
                src/lib/middleware/admin-rbac.ts
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                RBAC helpers for protecting API routes with platform admin checks.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
          <p>
            For complete integration guide, see{" "}
            <code className="rounded bg-zinc-800 px-2 py-1">
              docs/ADMIN_UI_INTEGRATION_GUIDE.md
            </code>
          </p>
        </footer>
      </div>
    </main>
  );
}
