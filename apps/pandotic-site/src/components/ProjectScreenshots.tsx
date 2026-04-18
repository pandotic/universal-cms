"use client";

import Image from "next/image";
import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";

interface Screenshot {
  filename: string;
  label: string;
}

interface ProjectScreenshotsProps {
  slug: string;
  screenshots: Screenshot[];
}

/** Default screenshots derived from the screenshot-brief priority list */
const DEFAULT_SCREENSHOTS: Screenshot[] = [
  { filename: "homedoc-dashboard-hero.png", label: "Dashboard Overview" },
  { filename: "wildfire-risk-composite.png", label: "Risk Assessment" },
  { filename: "document-extraction-review.png", label: "AI Document Extraction" },
  { filename: "solar-calculator-projections.png", label: "Solar Calculator" },
  { filename: "fireshield-certification-pipeline.png", label: "FireShield Certification" },
  { filename: "tco-calculator-comparison.png", label: "TCO Calculator" },
];

export default function ProjectScreenshots({
  slug,
  screenshots,
}: ProjectScreenshotsProps) {
  const items = screenshots.length > 0 ? screenshots : DEFAULT_SCREENSHOTS;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
            Product Gallery
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 md:mb-12">
            See It in Action
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((shot, i) => (
            <ScrollReveal key={shot.filename} delay={i * 0.08}>
              <ScreenshotCard slug={slug} filename={shot.filename} label={shot.label} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenshotCard({
  slug,
  filename,
  label,
}: {
  slug: string;
  filename: string;
  label: string;
}) {
  const [hasError, setHasError] = useState(false);
  const src = `/images/projects/${slug}/${filename}`;

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
      <div className="relative aspect-video bg-white/[0.02]">
        {!hasError ? (
          <Image
            src={src}
            alt={label}
            fill
            className="object-cover"
            unoptimized
            onError={() => setHasError(true)}
          />
        ) : null}
        {/* Placeholder shown behind (or instead of) image */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-gray-500 ${hasError ? "" : "opacity-0"}`}
        >
          <svg
            className="w-10 h-10 mb-2 opacity-20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">{label}</span>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-gray-200 text-base font-medium">{label}</p>
      </div>
    </div>
  );
}
