import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuration required",
};

export default function MissingConfigPage() {
  const envFile =
    "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n" +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n" +
    "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n";

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Supabase isn&apos;t configured yet
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            The Pandotic Hub can&apos;t start because no Supabase credentials
            are set. Add them to{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-200">
              packages/fleet-dashboard/.env.local
            </code>{" "}
            and restart the dev server.
          </p>
        </div>

        <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-300">
          {envFile}
        </pre>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200">Where to find these</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            <li>
              Supabase dashboard → Project settings → API →{" "}
              <span className="text-zinc-300">Project URL</span> and{" "}
              <span className="text-zinc-300">anon public</span> key.
            </li>
            <li>
              Service role key is on the same page — keep it server-side
              only.
            </li>
          </ul>
        </div>

        <p className="text-xs text-zinc-600">
          Once the values are in place, the dashboard will auto-redirect you
          to login on the next request.
        </p>
      </div>
    </main>
  );
}
