"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Property {
  id: string;
  name: string;
  slug: string;
}

export default function PMFEvaluatorPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const pmfUrl = process.env.NEXT_PUBLIC_PMF_EVALUATOR_URL;

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((d) => setProperties(d.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (pmfUrl && !event.origin.startsWith(new URL(pmfUrl).origin)) return;
      // Handle messages from PMF Evaluator
      if (event.data?.type === "PMF_RESULT_READY") {
        // Results received — could store or display
        console.log("PMF results:", event.data.payload);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pmfUrl]);

  useEffect(() => {
    if (!selectedProperty || !iframeRef.current?.contentWindow || !pmfUrl) return;
    const prop = properties.find((p) => p.id === selectedProperty);
    if (prop) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INIT_PMF_EVALUATOR",
          payload: {
            propertyId: prop.id,
            propertyName: prop.name,
            propertySlug: prop.slug,
          },
        },
        pmfUrl
      );
    }
  }, [selectedProperty, pmfUrl, properties]);

  if (!pmfUrl) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
            &larr; Back to Hub
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            PMF Evaluator
          </h1>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
          <p className="text-sm font-medium text-amber-400">Not Configured</p>
          <p className="mt-1 text-sm text-amber-400/70">
            Set the <code className="font-mono text-xs">NEXT_PUBLIC_PMF_EVALUATOR_URL</code> environment variable to enable the PMF Evaluator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
            &larr; Back to Hub
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            PMF Evaluator
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Product-market fit analysis tool
          </p>
        </div>
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25"
        >
          <option value="">Select property...</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <iframe
          ref={iframeRef}
          src={pmfUrl}
          className="w-full border-0"
          style={{ height: "calc(100vh - 200px)" }}
          allow="clipboard-write"
          title="PMF Evaluator"
        />
      </div>
    </div>
  );
}
