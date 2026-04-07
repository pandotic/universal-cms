"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ExternalLink, Image, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProviderImageRow {
  name: string;
  slug: string;
  logoUrl: string | null;
  hasAltText: boolean;
  altText: string | null;
}

const IMAGE_SEO_CHECKLIST = [
  {
    id: "alt_text",
    label: "All images have descriptive alt text",
    description: "Alt text should describe the image content and include relevant keywords naturally.",
    critical: true,
  },
  {
    id: "descriptive_filenames",
    label: "Images use descriptive filenames",
    description: 'Use names like "gri-foundation-logo.png" instead of "img_001.png".',
    critical: true,
  },
  {
    id: "dimensions",
    label: "Images specify width and height attributes",
    description: "Prevents layout shifts (CLS) and helps browsers allocate space before loading.",
    critical: false,
  },
  {
    id: "modern_formats",
    label: "Images served in modern formats (WebP, AVIF)",
    description: "Next.js <Image> automatically optimizes and converts to WebP/AVIF.",
    critical: false,
  },
  {
    id: "lazy_loading",
    label: "Below-fold images use lazy loading",
    description: 'Next.js <Image> applies loading="lazy" by default for non-priority images.',
    critical: false,
  },
  {
    id: "responsive",
    label: "Images are responsive with srcset",
    description: "Next.js <Image> generates srcset automatically for multiple breakpoints.",
    critical: false,
  },
  {
    id: "image_sitemap",
    label: "Image URLs included in sitemap",
    description: "Add <image:image> tags to sitemap.xml to help Google discover and index images.",
    critical: false,
  },
  {
    id: "schema",
    label: "Key images have ImageObject schema",
    description: "Use ImageObjectJsonLd for logos and featured images to enable image rich results.",
    critical: false,
  },
];

export default function ImageSeoPage() {
  const [rows, setRows] = useState<ProviderImageRow[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/admin/careers/providers?limit=200");
      const json = await res.json();
      const providers = (json.data ?? json ?? []) as Array<{
        name: string;
        slug: string;
        logo_url: string | null;
      }>;

      const mapped: ProviderImageRow[] = providers.map((p) => ({
        name: p.name,
        slug: p.slug,
        logoUrl: p.logo_url ?? null,
        // There is no logo_alt_text column in the DB schema — flag as missing for all
        hasAltText: false,
        altText: null,
      }));

      setRows(mapped);
      setScanned(true);
    } catch {
      // Fallback: show empty state with note
      setRows([]);
      setScanned(true);
    } finally {
      setScanning(false);
    }
  };

  const withLogo = rows.filter((r) => r.logoUrl);
  const missingAlt = withLogo.filter((r) => !r.hasAltText);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Image SEO Audit</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review image SEO requirements and check provider logos for alt text coverage.
        </p>
      </div>

      {/* Google Search Console callout */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">For a full site-wide image audit:</p>
          <p className="mt-1">
            Use{" "}
            <a
              href="https://search.google.com/search-console/enhancements"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline hover:text-amber-900"
            >
              Google Search Console &gt; Enhancements &gt; Image results
              <ExternalLink className="ml-0.5 h-3 w-3" />
            </a>
            {" "}to see which images appear in Google Image Search and identify issues at scale.
          </p>
        </div>
      </div>

      {/* Image SEO checklist */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Image className="h-4 w-4 text-gray-500" />
            Image SEO Requirements Checklist
          </h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {IMAGE_SEO_CHECKLIST.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
              <CheckCircle
                className={cn(
                  "mt-0.5 h-4 w-4 flex-shrink-0",
                  item.critical ? "text-green-500" : "text-gray-300"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.label}
                  {item.critical && (
                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      Critical
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Next.js Image component note */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Next.js Image Component</p>
          <p className="mt-1">
            Use{" "}
            <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs">
              &lt;Image&gt;
            </code>{" "}
            from <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs">next/image</code>{" "}
            for all content images. It handles WebP conversion, responsive srcset, lazy loading, and
            layout shift prevention automatically. Always pass a descriptive{" "}
            <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs">alt</code> prop.
          </p>
        </div>
      </div>

      {/* Provider logo scan */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Provider Logo Alt Text Audit</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Checks training providers that have a logo_url configured.
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Scan Pages"}
          </button>
        </div>

        {!scanned && !scanning && (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Click &quot;Scan Pages&quot; to fetch provider logos from the database.
          </div>
        )}

        {scanning && (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Loading providers...
          </div>
        )}

        {scanned && rows.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No providers found, or the API is unavailable.
          </div>
        )}

        {scanned && rows.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex items-center gap-6 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">
              <span>Total providers: <strong className="text-gray-900">{rows.length}</strong></span>
              <span>With logo: <strong className="text-gray-900">{withLogo.length}</strong></span>
              <span className={missingAlt.length > 0 ? "text-red-600" : "text-green-600"}>
                Missing alt text: <strong>{missingAlt.length}</strong>
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Logo URL
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                      Has Alt Text
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.slug} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{row.name}</p>
                        <p className="font-mono text-xs text-gray-400">{row.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {row.logoUrl ? (
                          <a
                            href={row.logoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-[220px] items-center gap-1 truncate text-blue-600 hover:underline"
                          >
                            <span className="truncate">{row.logoUrl}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-gray-300">No logo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!row.logoUrl ? (
                          <span className="text-gray-300">—</span>
                        ) : row.hasAltText ? (
                          <span title={row.altText ?? ""}>
                            <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                          </span>
                        ) : (
                          <span title="No alt text configured">
                            <XCircle className="mx-auto h-4 w-4 text-red-500" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Remediation note */}
            {missingAlt.length > 0 && (
              <div className="border-t border-gray-100 bg-red-50 px-5 py-3 text-xs text-red-700">
                <strong>{missingAlt.length} providers</strong> with logos are missing alt text. Add a{" "}
                <code className="rounded bg-red-100 px-1 font-mono">logo_alt_text</code> column to the{" "}
                <code className="rounded bg-red-100 px-1 font-mono">ch_providers</code> table, or ensure
                alt text is hardcoded where logos are rendered.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
