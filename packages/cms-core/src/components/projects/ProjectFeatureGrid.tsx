"use client";

import ScrollReveal from "./ScrollReveal.js";
import type { ParsedFeature } from "../../types/projects.js";

interface ProjectFeatureGridProps {
  features: ParsedFeature[];
  projectName: string;
}

export default function ProjectFeatureGrid({ features, projectName }: ProjectFeatureGridProps) {
  if (features.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
            Standout Features
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            What Makes {projectName} Different
          </h2>
          <p className="text-gray-400 max-w-3xl mb-8 md:mb-12">
            Key capabilities that set this platform apart.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.08}>
              <div className="p-5 md:p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-colors h-full flex flex-col">
                <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
                  Feature {i + 1}
                </p>
                <h3 className="text-white text-lg font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">
                  {feature.description}
                </p>
                {feature.userBenefit && (
                  <p className="text-gray-500 text-xs leading-relaxed border-t border-white/5 pt-3">
                    <span className="text-gray-300 font-medium">Impact: </span>
                    {feature.userBenefit}
                  </p>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
