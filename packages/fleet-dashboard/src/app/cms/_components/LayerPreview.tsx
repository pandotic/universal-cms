"use client";

import Link from "next/link";
import {
  type AdminLayerKey,
  getAdminLayer,
  getAdminModulesByLayer,
} from "@pandotic/universal-cms/admin/modules";

interface Props {
  layer: AdminLayerKey;
}

export function LayerPreview({ layer }: Props) {
  const { title, description } = getAdminLayer(layer);
  const modules = getAdminModulesByLayer(layer);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80">
        Capability preview. These modules show sample data so you can see what
        the admin ships with. To enable them on a specific site, go to{" "}
        <Link
          href="/properties"
          className="underline decoration-amber-500/40 underline-offset-2 hover:text-amber-100"
        >
          Properties
        </Link>{" "}
        and open a property&rsquo;s <span className="font-medium">Modules</span> tab.
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={`/cms/${layer}/${mod.id}`}
            className="group flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-white group-hover:text-white">
                  {mod.label}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">{mod.id}</p>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                {mod.previewRows.length} items
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">{mod.description}</p>

            <ul className="mt-3 space-y-1.5 border-t border-zinc-800/60 pt-3">
              {mod.previewRows.slice(0, 3).map((row, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 text-xs"
                >
                  <span className="truncate text-zinc-300">{row.title}</span>
                  {row.status && (
                    <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                      {row.status}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
}
