"use client";

import { useEffect, useState } from "react";
import { vendorInvoices, type VendorInvoice } from "@/fleet.config";

interface ProviderUsage {
  requests: number;
  costUsd: number;
}

interface FleetSiteData {
  name: string;
  url: string;
  status: string;
  siteName?: string;
  apiUsage?: {
    totalRequests: number;
    totalCostUsd: number;
    providers: Record<string, ProviderUsage>;
  };
}

interface AuditRow {
  provider: string;
  selfReportedUsd: number;
  invoiceUsd: number | null;
  discrepancyUsd: number | null;
  discrepancyPct: number | null;
  status: "matched" | "discrepancy" | "no-invoice" | "no-data";
}

export default function AuditPage() {
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function buildAudit() {
      try {
        // Get self-reported usage from fleet
        const res = await fetch("/api/fleet/status");
        const json: { sites: FleetSiteData[] } = await res.json();

        // Aggregate self-reported costs by provider
        const selfReported = new Map<string, number>();
        for (const site of json.sites) {
          if (!site.apiUsage) continue;
          for (const [provider, usage] of Object.entries(site.apiUsage.providers)) {
            selfReported.set(provider, (selfReported.get(provider) ?? 0) + usage.costUsd);
          }
        }

        // Build vendor invoice lookup by provider (latest period)
        const invoiceByProvider = new Map<string, VendorInvoice>();
        for (const inv of vendorInvoices) {
          const existing = invoiceByProvider.get(inv.provider);
          if (!existing || inv.periodEnd > existing.periodEnd) {
            invoiceByProvider.set(inv.provider, inv);
          }
        }

        // Merge into audit rows
        const allProviders = new Set([
          ...selfReported.keys(),
          ...invoiceByProvider.keys(),
        ]);

        const rows: AuditRow[] = [...allProviders].map((provider) => {
          const reported = selfReported.get(provider) ?? 0;
          const invoice = invoiceByProvider.get(provider);
          const invoiceUsd = invoice?.invoiceAmountUsd ?? null;

          let discrepancyUsd: number | null = null;
          let discrepancyPct: number | null = null;
          let status: AuditRow["status"] = "no-data";

          if (reported > 0 && invoiceUsd != null) {
            discrepancyUsd = reported - invoiceUsd;
            discrepancyPct = invoiceUsd > 0 ? (discrepancyUsd / invoiceUsd) * 100 : 0;
            status = Math.abs(discrepancyPct) < 5 ? "matched" : "discrepancy";
          } else if (reported > 0) {
            status = "no-invoice";
          } else if (invoiceUsd != null) {
            status = "no-data";
            discrepancyUsd = -invoiceUsd;
          }

          return {
            provider,
            selfReportedUsd: reported,
            invoiceUsd,
            discrepancyUsd,
            discrepancyPct,
            status,
          };
        }).sort((a, b) => (b.invoiceUsd ?? 0) - (a.invoiceUsd ?? 0));

        setAuditRows(rows);
      } catch (err) {
        console.error("Failed to build audit:", err);
      } finally {
        setLoading(false);
      }
    }
    buildAudit();
  }, []);

  const totalSelfReported = auditRows.reduce((s, r) => s + r.selfReportedUsd, 0);
  const totalInvoiced = auditRows.reduce((s, r) => s + (r.invoiceUsd ?? 0), 0);
  const totalDiscrepancy = totalSelfReported - totalInvoiced;

  const statusConfig = {
    matched: { label: "Matched", badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
    discrepancy: { label: "Discrepancy", badge: "bg-red-500/10 text-red-400 ring-red-500/20" },
    "no-invoice": { label: "No Invoice", badge: "bg-amber-500/10 text-amber-400 ring-amber-500/20" },
    "no-data": { label: "No Data", badge: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20" },
  } as const;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-sm text-zinc-500">Building audit report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Audit & Reconciliation
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Compare self-reported API usage against vendor invoices to find billing discrepancies.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Self-Reported Total</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            ${totalSelfReported.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Vendor Invoiced Total</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            ${totalInvoiced.toFixed(2)}
          </p>
        </div>
        <div className={`rounded-lg border p-5 ${Math.abs(totalDiscrepancy) < 1 ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          <p className="text-sm text-zinc-500">Discrepancy</p>
          <p className={`mt-1 text-2xl font-semibold ${Math.abs(totalDiscrepancy) < 1 ? "text-emerald-400" : "text-red-400"}`}>
            {totalDiscrepancy >= 0 ? "+" : ""}${totalDiscrepancy.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Audit Table */}
      {auditRows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-6 py-3 text-left font-medium text-zinc-400">Provider</th>
                <th className="px-6 py-3 text-right font-medium text-zinc-400">Self-Reported</th>
                <th className="px-6 py-3 text-right font-medium text-zinc-400">Vendor Invoice</th>
                <th className="px-6 py-3 text-right font-medium text-zinc-400">Discrepancy</th>
                <th className="px-6 py-3 text-left font-medium text-zinc-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {auditRows.map((row) => {
                const sc = statusConfig[row.status];
                return (
                  <tr key={row.provider} className="hover:bg-zinc-900/50">
                    <td className="px-6 py-3 font-medium capitalize text-zinc-300">
                      {row.provider}
                    </td>
                    <td className="px-6 py-3 text-right text-zinc-400">
                      ${row.selfReportedUsd.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right text-zinc-400">
                      {row.invoiceUsd != null ? `$${row.invoiceUsd.toFixed(2)}` : "—"}
                    </td>
                    <td className={`px-6 py-3 text-right font-medium ${row.discrepancyUsd != null && Math.abs(row.discrepancyUsd) > 1 ? "text-red-400" : "text-zinc-500"}`}>
                      {row.discrepancyUsd != null ? (
                        <>
                          {row.discrepancyUsd >= 0 ? "+" : ""}${row.discrepancyUsd.toFixed(2)}
                          {row.discrepancyPct != null && (
                            <span className="ml-1 text-xs text-zinc-600">
                              ({row.discrepancyPct >= 0 ? "+" : ""}{row.discrepancyPct.toFixed(1)}%)
                            </span>
                          )}
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${sc.badge}`}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <h2 className="text-lg font-medium text-zinc-300">No audit data available</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Enable API usage tracking in your sites and add vendor invoices to{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-400">src/fleet.config.ts</code> to
            start reconciling.
          </p>
        </div>
      )}

      {/* How It Works */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-3 text-lg font-semibold text-white">How Audit Works</h2>
        <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-zinc-400">
          <li>
            Each deployed site with the <code className="rounded bg-zinc-800 px-1 text-xs font-mono text-zinc-300">apiUsage</code> module
            tracks every outbound API call (tokens, cost, provider).
          </li>
          <li>
            The health endpoint self-reports aggregated usage to the Pandotic Hub.
          </li>
          <li>
            You add vendor invoice amounts to <code className="rounded bg-zinc-800 px-1 text-xs font-mono text-zinc-300">fleet.config.ts</code> (or
            they'll be auto-imported from your API key tool when ported).
          </li>
          <li>
            This page compares the two and flags discrepancies above 5%.
          </li>
        </ol>
      </div>
    </div>
  );
}
