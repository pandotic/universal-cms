import Link from "next/link";

const sections = [
  {
    title: "Fleet Management",
    href: "/fleet",
    description: "Monitor all deployed sites in real-time. See versions, health status, enabled modules, and uptime across your entire portfolio.",
    stat: "Sites",
    icon: "globe",
  },
  {
    title: "Module Matrix",
    href: "/modules",
    description: "Visualize which CMS modules are deployed to which sites. Track feature rollout across your fleet.",
    stat: "Modules",
    icon: "grid",
  },
  {
    title: "API Usage",
    href: "/api-usage",
    description: "Track API consumption across all apps — AI tokens, Supabase calls, third-party APIs. See costs per site and per provider.",
    stat: "Costs",
    icon: "activity",
  },
  {
    title: "API Keys",
    href: "/api-keys",
    description: "Registry of all API keys in use across projects. Know what keys are active, which vendor they belong to, and where they're deployed.",
    stat: "Keys",
    icon: "key",
  },
  {
    title: "Audit & Reconciliation",
    href: "/audit",
    description: "Compare self-reported API usage against vendor invoices. Catch billing discrepancies and optimize spend.",
    stat: "Savings",
    icon: "shield",
  },
];

export default function HubHomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="pt-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Pandotic Hub
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Operations dashboard for all Pandotic sites and apps. Monitor fleet health,
          track API spend, manage keys, and audit costs — all in one place.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/fleet"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            View Fleet
          </Link>
          <Link
            href="/api-usage"
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            API Dashboard
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
          >
            <h2 className="text-lg font-semibold text-white group-hover:text-zinc-100">
              {s.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {s.description}
            </p>
          </Link>
        ))}
      </section>

      {/* What's Inside */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-8">
        <h2 className="text-xl font-semibold text-white">
          What is Pandotic Hub?
        </h2>
        <div className="mt-4 grid gap-6 text-sm leading-relaxed text-zinc-400 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium text-zinc-300">Universal CMS</h3>
            <p>
              A modular, config-driven CMS built on Next.js + Supabase. 30 toggleable modules
              covering content, directories, SEO, engagement, forms, and system tools. Published
              as <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-300">@pandotic/universal-cms</code> on
              npm with version-pinned deployments.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-zinc-300">Fleet Dashboard</h3>
            <p>
              Real-time health monitoring for every deployed site. Each site exposes
              a <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-300">/api/admin/health</code> endpoint
              reporting version, modules, and uptime. The hub aggregates all of them.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-zinc-300">API Cost Tracking</h3>
            <p>
              Each deployed app self-reports API usage (AI tokens, database calls, third-party
              APIs) back to the hub. Roll up costs per site, per provider, per month to see
              exactly where money is being spent.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-zinc-300">Key Management & Audit</h3>
            <p>
              Central registry of all API keys across projects. Compare self-reported usage
              against vendor invoices to catch billing discrepancies, orphaned keys, and
              optimization opportunities.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
