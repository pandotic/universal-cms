"use client";

import { useState } from "react";
import { CheckCircle, ExternalLink, Copy, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const SITE_URL = "https://esgsource.com";

interface PageTemplate {
  label: string;
  path: string;
  expectedSchemas: string[];
  notes?: string;
}

const PAGE_TEMPLATES: PageTemplate[] = [
  {
    label: "Homepage",
    path: "/",
    expectedSchemas: ["WebSite", "BreadcrumbList", "Organization"],
    notes: "Includes search action potentialAction",
  },
  {
    label: "Sample Entity",
    path: "/directory/gri-foundation",
    expectedSchemas: ["Organization", "AggregateRating (if reviews)"],
    notes: "Organization schema with sameAs social links",
  },
  {
    label: "Sample Framework",
    path: "/frameworks/gri-standards",
    expectedSchemas: ["Article", "BreadcrumbList"],
    notes: "Article schema with publisher and datePublished",
  },
  {
    label: "Sample Glossary Term",
    path: "/glossary/carbon-credit",
    expectedSchemas: ["DefinedTerm", "BreadcrumbList"],
    notes: "DefinedTerm with name and description",
  },
  {
    label: "Sample Category",
    path: "/categories/esg-data-ratings",
    expectedSchemas: ["CollectionPage", "FAQPage", "BreadcrumbList"],
    notes: "FAQPage only present when FAQs are configured",
  },
];

interface CoverageStat {
  label: string;
  value: string;
  description: string;
}

const COVERAGE_STATS: CoverageStat[] = [
  { label: "Page Templates", value: "5", description: "Key page types with schema" },
  { label: "Schema Types", value: "10+", description: "Distinct schema.org types used" },
  { label: "Rich Result Eligible", value: "3", description: "FAQPage, Article, Course" },
];

function TestLinks({ path }: { path: string }) {
  const encoded = encodeURIComponent(`${SITE_URL}${path}`);
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://search.google.com/test/rich-results?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
      >
        Google Rich Results
        <ExternalLink className="h-3 w-3" />
      </a>
      <a
        href={`https://validator.schema.org/#url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
      >
        Schema.org Validator
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function CopyUrlButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${SITE_URL}${path}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy URL"
      className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
    >
      {copied ? (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy URL
        </>
      )}
    </button>
  );
}

export default function SchemaValidationPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schema Validation Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Validate JSON-LD structured data across key page templates using Google and Schema.org tools.
        </p>
      </div>

      {/* Coverage summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {COVERAGE_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-5"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-400">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
        <p className="text-sm text-blue-800">
          This page provides links to external validators. No live crawling is performed here.
          Click <strong>Google Rich Results</strong> to check eligibility for enhanced search
          features, or <strong>Schema.org Validator</strong> to verify syntax correctness.
          Pages must be publicly accessible for external tools to fetch them.
        </p>
      </div>

      {/* Page template table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Page Template
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Expected Schema Types
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Validate
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                URL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {PAGE_TEMPLATES.map((template) => (
              <tr key={template.path} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-gray-900">{template.label}</p>
                  <p className="mt-0.5 font-mono text-xs text-gray-400">{template.path}</p>
                  {template.notes && (
                    <p className="mt-1 text-xs text-gray-400 italic">{template.notes}</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {template.expectedSchemas.map((schema) => (
                      <span
                        key={schema}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          schema.includes("(if")
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-green-50 text-green-700"
                        )}
                      >
                        <CheckCircle className="h-3 w-3" />
                        {schema}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <TestLinks path={template.path} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="max-w-[160px] truncate font-mono text-xs text-gray-500">
                      {SITE_URL}{template.path}
                    </span>
                    <CopyUrlButton path={template.path} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How to test guide */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">How to Test Schema</h2>
        <ol className="mt-3 space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Click <strong>Google Rich Results</strong> to check if the page qualifies for rich snippets in search.</li>
          <li>Click <strong>Schema.org Validator</strong> for a detailed breakdown of every schema property.</li>
          <li>Use <strong>Copy URL</strong> to manually paste the URL into any other SEO tool.</li>
          <li>
            For bulk validation, use{" "}
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Google Search Console
            </a>{" "}
            &gt; Enhancements to see site-wide rich result status.
          </li>
        </ol>
      </div>
    </div>
  );
}
