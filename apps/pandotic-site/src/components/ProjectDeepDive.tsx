import ScrollReveal from "@/components/ScrollReveal";
import type {
  ParsedCaseStudy,
  ParsedFeature,
  ParsedProofPoint,
  ParsedTechDifferentiator,
} from "@/types/projects";

interface ProjectDeepDiveProps {
  projectName: string;
  caseStudy: ParsedCaseStudy;
  features: ParsedFeature[];
  techDifferentiators: ParsedTechDifferentiator[];
  proofPoints: ParsedProofPoint[];
}

export default function ProjectDeepDive({
  projectName,
  caseStudy,
  features,
  techDifferentiators,
  proofPoints,
}: ProjectDeepDiveProps) {
  const hasCaseStudy =
    caseStudy.challenge ||
    caseStudy.solution ||
    caseStudy.businessImpact ||
    caseStudy.pandoticRole;
  const hasFeatures = features.length > 0;
  const hasTech = techDifferentiators.length > 0;
  const hasProof = proofPoints.length > 0;

  if (!hasCaseStudy && !hasFeatures && !hasTech && !hasProof) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
            Deep Dive
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Go deeper on {projectName}
          </h2>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-8 md:mb-10 max-w-2xl">
            The full case study, every feature, the technical approach, and
            modular proof points — expanded on demand.
          </p>
        </ScrollReveal>

        <div className="space-y-3">
          {hasCaseStudy && (
            <DeepDiveGroup
              label="Full case study"
              hint="Challenge, solution, business impact, Pandotic's role"
            >
              <div className="space-y-6">
                {caseStudy.challenge && (
                  <DeepDiveSubsection title="The challenge">
                    {caseStudy.challenge}
                  </DeepDiveSubsection>
                )}
                {caseStudy.solution && (
                  <DeepDiveSubsection title="The solution">
                    {caseStudy.solution}
                  </DeepDiveSubsection>
                )}
                {caseStudy.keyFeatures.length > 0 && (
                  <DeepDiveSubsection title="Key capabilities">
                    <ul className="space-y-2 list-none">
                      {caseStudy.keyFeatures.map((feature, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-[var(--color-accent)] font-bold text-sm shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </DeepDiveSubsection>
                )}
                {caseStudy.businessImpact && (
                  <DeepDiveSubsection title="Business impact">
                    {caseStudy.businessImpact}
                  </DeepDiveSubsection>
                )}
                {caseStudy.pandoticRole && (
                  <DeepDiveSubsection title="Pandotic's role">
                    {caseStudy.pandoticRole}
                  </DeepDiveSubsection>
                )}
              </div>
            </DeepDiveGroup>
          )}

          {hasFeatures && (
            <DeepDiveGroup
              label="Every feature"
              hint={`${features.length} capabilities with user and business rationale`}
            >
              <div className="space-y-6">
                {features.map((feature) => (
                  <div key={feature.title}>
                    <h4 className="text-white text-base font-semibold mb-2">
                      {feature.title}
                    </h4>
                    {feature.description && (
                      <p className="text-gray-300 text-sm leading-relaxed mb-2">
                        {feature.description}
                      </p>
                    )}
                    {feature.userBenefit && (
                      <p className="text-gray-400 text-sm leading-relaxed mb-2">
                        <span className="text-gray-200 font-medium">
                          Impact:{" "}
                        </span>
                        {feature.userBenefit}
                      </p>
                    )}
                    {feature.differentiation && (
                      <p className="text-gray-400 text-sm leading-relaxed">
                        <span className="text-gray-200 font-medium">
                          What's different:{" "}
                        </span>
                        {feature.differentiation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </DeepDiveGroup>
          )}

          {hasTech && (
            <DeepDiveGroup
              label="Technical approach"
              hint={`${techDifferentiators.length} architecture decisions worth noting`}
            >
              <div className="space-y-5">
                {techDifferentiators.map((diff) => (
                  <div key={diff.title}>
                    <h4 className="text-white text-base font-semibold mb-2">
                      {diff.title}
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {diff.body}
                    </p>
                  </div>
                ))}
              </div>
            </DeepDiveGroup>
          )}

          {hasProof && (
            <DeepDiveGroup
              label="Proof points"
              hint={`${proofPoints.length} modular statements for proposals and decks`}
            >
              <ul className="space-y-3 list-none">
                {proofPoints.map((point) => (
                  <li key={point.index} className="flex gap-3">
                    <span className="text-[var(--color-accent)] font-bold text-xs opacity-60 shrink-0 pt-1">
                      {String(point.index).padStart(2, "0")}
                    </span>
                    <span className="text-gray-300 text-sm leading-relaxed">
                      {point.statement}
                    </span>
                  </li>
                ))}
              </ul>
            </DeepDiveGroup>
          )}
        </div>
      </div>
    </section>
  );
}

interface DeepDiveGroupProps {
  label: string;
  hint: string;
  children: React.ReactNode;
}

function DeepDiveGroup({ label, hint, children }: DeepDiveGroupProps) {
  return (
    <details className="group rounded-2xl border border-white/10 overflow-hidden open:border-white/20 transition-colors">
      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-white/[0.02] transition-colors">
        <div>
          <p className="text-white text-base md:text-lg font-semibold">
            {label}
          </p>
          <p className="text-gray-500 text-xs md:text-sm mt-1">{hint}</p>
        </div>
        <span className="shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </summary>
      <div className="px-6 pb-6 pt-1 border-t border-white/5">{children}</div>
    </details>
  );
}

function DeepDiveSubsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-white text-base font-semibold mb-2">{title}</h4>
      <div className="text-gray-300 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
