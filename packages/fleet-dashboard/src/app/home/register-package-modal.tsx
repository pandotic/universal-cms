"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Property } from "./types";

interface Props {
  properties: Property[];
  onSubmit: (
    propertyId: string,
    packageName: string,
    version: string,
    category: string,
  ) => void;
  onClose: () => void;
}

export function RegisterPackageModal({ properties, onSubmit, onClose }: Props) {
  const [propertyId, setPropertyId] = useState("");
  const [packageName, setPackageName] = useState("@pandotic/universal-cms");
  const [customName, setCustomName] = useState("");
  const [version, setVersion] = useState("");
  const [category, setCategory] = useState("cms");

  const finalName = packageName === "custom" ? customName : packageName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Register Package</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Manually register a package deployment for sites without a health endpoint.
        </p>

        <div className="mt-4 space-y-4">
          <Field label="Property">
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Select property…</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Package Name">
            <select
              value={packageName}
              onChange={(e) => {
                setPackageName(e.target.value);
                if (e.target.value === "@pandotic/universal-cms") setCategory("cms");
                else if (e.target.value === "@pandotic/skill-library") setCategory("library");
              }}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            >
              <option value="@pandotic/universal-cms">@pandotic/universal-cms</option>
              <option value="@pandotic/skill-library">@pandotic/skill-library</option>
              <option value="custom">Custom package…</option>
            </select>
          </Field>

          {packageName === "custom" && (
            <Field label="Custom Package Name">
              <input
                type="text"
                placeholder="@scope/package-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
              />
            </Field>
          )}

          <Field label="Installed Version">
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="0.1.0"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            />
          </Field>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
            >
              <option value="cms">CMS</option>
              <option value="library">Library</option>
              <option value="ui">UI</option>
              <option value="tool">Tool</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(propertyId, finalName, version, category)}
            disabled={!propertyId || !finalName || !version}
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
