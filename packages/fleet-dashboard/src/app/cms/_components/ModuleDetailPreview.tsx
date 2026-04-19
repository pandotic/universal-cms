"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_LAYER_MODULES, MODULE_FIXTURES } from "../_fixtures";

type LayerKey = keyof typeof ADMIN_LAYER_MODULES;

interface Props {
  layer: LayerKey;
  moduleKey: string;
}

export function ModuleDetailPreview({ layer, moduleKey }: Props) {
  const fixture = MODULE_FIXTURES[moduleKey];
  const layerMeta = ADMIN_LAYER_MODULES[layer];

  if (!fixture || !layerMeta.modules.includes(moduleKey)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href={`/cms/${layer}`} className="hover:text-zinc-300">
          {layerMeta.title}
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{fixture.label}</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {fixture.label}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{fixture.description}</p>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80">
        Capability preview with sample data. Real entries appear in a
        property&rsquo;s deployed admin when this module is enabled for that site.
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Item
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                Details
              </th>
              <th className="px-4 py-3 text-right font-medium text-zinc-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {fixture.rows.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-zinc-800/30">
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-100">{row.title}</div>
                  {row.subtitle && (
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {row.subtitle}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {row.meta ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.status ? (
                    <span className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                      {row.status}
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
