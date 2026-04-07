"use client";

import type { ToolResultDisplay } from "../../ai/types";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export function ChatToolResult({ result }: { result: ToolResultDisplay }) {
  return (
    <div className="my-2 rounded-lg border border-border bg-surface p-3 text-sm">
      <div className="flex items-center gap-2">
        {result.success ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
        )}
        <span className={result.success ? "text-foreground" : "text-red-700"}>
          {result.summary}
        </span>
      </div>

      {result.data && (
        <div className="mt-2 rounded bg-surface-secondary p-2 text-xs text-foreground-secondary overflow-auto max-h-48">
          {renderData(result.data)}
        </div>
      )}

      {result.link && (
        <Link
          href={result.link.href}
          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          {result.link.label}
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function renderData(data: Record<string, unknown>) {
  // If data contains an array (pages, entities, etc.), render as table
  const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
  if (arrayKey) {
    const items = data[arrayKey] as Record<string, unknown>[];
    if (items.length === 0) return <span>No items found</span>;
    const keys = Object.keys(items[0]).slice(0, 5); // Show first 5 columns
    return (
      <table className="w-full text-left">
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k} className="pb-1 pr-3 font-medium text-foreground-secondary">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 10).map((item, i) => (
            <tr key={i} className="border-t border-border">
              {keys.map((k) => (
                <td key={k} className="py-1 pr-3 truncate max-w-[150px]">
                  {String(item[k] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {items.length > 10 && (
            <tr>
              <td
                colSpan={keys.length}
                className="pt-1 text-foreground-tertiary italic"
              >
                ...and {items.length - 10} more
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  // Otherwise render key-value
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-medium text-foreground-secondary">{k}</dt>
          <dd className="truncate">{JSON.stringify(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
