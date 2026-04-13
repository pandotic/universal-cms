"use client";

import ScrollReveal from "./ScrollReveal.js";
import type { ParsedTechDifferentiator } from "../../types/projects.js";

interface ProjectTechStackProps {
  differentiators: ParsedTechDifferentiator[];
}

export default function ProjectTechStack({ differentiators }: ProjectTechStackProps) {
  if (differentiators.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 border-y border-white/5">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
            Under the Hood
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 md:mb-12">
            Technical Differentiators
          </h2>
        </ScrollReveal>

        <div className="space-y-8 md:space-y-12">
          {differentiators.map((diff, i) => (
            <ScrollReveal key={diff.title} delay={i * 0.1}>
              <div className="flex gap-6 md:gap-8">
                <div className="shrink-0 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[var(--color-accent)] text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-3">{diff.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{diff.body}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
