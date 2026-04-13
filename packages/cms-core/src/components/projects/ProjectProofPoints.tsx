"use client";

import ScrollReveal from "./ScrollReveal.js";
import type { ParsedProofPoint } from "../../types/projects.js";

interface ProjectProofPointsProps {
  proofPoints: ParsedProofPoint[];
}

export default function ProjectProofPoints({ proofPoints }: ProjectProofPointsProps) {
  if (proofPoints.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
            What We Delivered
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 md:mb-12">
            Proof Points
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {proofPoints.map((point, i) => (
            <ScrollReveal key={point.index} delay={i * 0.06}>
              <div className="p-5 rounded-xl border border-white/10 hover:border-white/20 transition-colors h-full flex gap-4">
                <span className="text-[var(--color-accent)] font-bold text-2xl opacity-40 shrink-0 leading-tight">
                  {String(point.index).padStart(2, "0")}
                </span>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {point.statement}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
