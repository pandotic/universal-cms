import ScrollReveal from "@/components/ScrollReveal";
import type { ParsedCaseStudy } from "@/types/projects";

interface ProjectCaseStudyProps {
  caseStudy: ParsedCaseStudy;
  projectName: string;
}

export default function ProjectCaseStudy({ caseStudy, projectName }: ProjectCaseStudyProps) {
  const hasContent = caseStudy.challenge || caseStudy.solution || caseStudy.keyFeatures.length > 0;
  if (!hasContent) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
            Case Study
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 md:mb-12">
            {projectName} in Action
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Challenge */}
          {caseStudy.challenge && (
            <ScrollReveal delay={0.1}>
              <div className="p-6 md:p-8 rounded-2xl border border-white/10 h-full">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-sm">
                    !
                  </span>
                  The Challenge
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {truncate(caseStudy.challenge, 400)}
                </p>
              </div>
            </ScrollReveal>
          )}

          {/* Solution */}
          {caseStudy.solution && (
            <ScrollReveal delay={0.2}>
              <div className="p-6 md:p-8 rounded-2xl border border-white/10 h-full">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-sm">
                    &#10003;
                  </span>
                  The Solution
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {truncate(caseStudy.solution, 400)}
                </p>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* Key Features */}
        {caseStudy.keyFeatures.length > 0 && (
          <ScrollReveal delay={0.3}>
            <div className="p-6 md:p-8 rounded-2xl border border-white/10 mb-8 md:mb-12">
              <h3 className="text-white text-lg font-semibold mb-6">Key Capabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caseStudy.keyFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[var(--color-accent)] font-bold text-sm mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Business Impact */}
        {caseStudy.businessImpact && (
          <ScrollReveal delay={0.4}>
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5">
              <h3 className="text-white text-lg font-semibold mb-4">Business Impact</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {truncate(caseStudy.businessImpact, 500)}
              </p>
            </div>
          </ScrollReveal>
        )}

        {/* Pandotic's Role */}
        {caseStudy.pandoticRole && (
          <ScrollReveal delay={0.5}>
            <p className="text-gray-500 text-xs mt-6 leading-relaxed max-w-3xl">
              <span className="text-gray-400 font-medium">Pandotic&apos;s Role: </span>
              {truncate(caseStudy.pandoticRole, 300)}
            </p>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}
