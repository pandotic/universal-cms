import ScrollReveal from "@/components/ScrollReveal";

const features = [
  {
    eyebrow: "SPEED WITH SUBSTANCE",
    title: "Fast without reckless",
    description:
      "We compress the path from idea to working product. Functional prototypes in weeks, not quarters — with enough structure to support real use and adoption.",
  },
  {
    eyebrow: "AI-NATIVE THINKING",
    title: "AI where it creates leverage, not noise",
    description:
      "We use AI to reduce friction, unlock analysis, support personalization, and structure messy information. Useful AI, not novelty.",
  },
  {
    eyebrow: "LED BY EXPERIENCE",
    title: "Four exited founders, not project managers",
    description:
      "You work directly with people who've built, scaled, and exited companies. Real strategy and execution, not account management.",
  },
  {
    eyebrow: "CROSS-FUNCTIONAL",
    title: "Strategy to code to go-to-market",
    description:
      "We work across product, operations, data, content, and growth — so initiatives don't stall between departments, tools, and priorities.",
  },
  {
    eyebrow: "HUMAN + AI",
    title: "AI that keeps people at the center",
    description:
      "The best systems combine automation, augmentation, and human review together — not total replacement. We build AI your team can trust and actually use.",
  },
  {
    eyebrow: "PRAGMATIC BUILD",
    title: "Stack-flexible, outcome-driven",
    description:
      "We use whatever creates the fastest credible path to value — AI-assisted development, automation platforms, structured databases. No vendor lock-in.",
  },
];

export default function FeatureGrid({ expanded = false }: { expanded?: boolean }) {
  const expandedDescriptions = [
    "We operate like a venture studio — cutting through traditional bottlenecks and bureaucratic processes. Functional prototypes and complete applications at a velocity that lets you seize market opportunities before they close.",
    "We don't bolt on AI for marketing value. We architect solutions where AI reduces friction, structures messy information, and creates real operational leverage across your workflows.",
    "Benefit from the direct involvement of four seasoned former CEOs. Strategic oversight that ensures your digital initiatives align with business goals, backed by collective experience building and scaling successful ventures.",
    "Most initiatives stall between departments, tools, and priorities. We work across product, operations, data, content, and go-to-market so nothing falls through the cracks.",
    "AI works best when it strengthens the whole system. We build augmented workflows where AI handles volume and the human expert supervises, validates, and applies judgment where it matters most.",
    "We use whatever creates the fastest credible path to value — AI-assisted development, automation platforms, structured databases, fast front-end prototyping. No vendor lock-in, just scalable solutions that evolve with your business.",
  ];

  const expandedTitles = [
    "Speed with substance",
    "AI-native product thinking",
    "Strategic leadership from exited founders",
    "Cross-functional systems perspective",
    "Human + AI orchestration",
    "Pragmatic, stack-flexible build approach",
  ];

  return (
    <section className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {features.map((feature, i) => (
          <ScrollReveal key={i} delay={i * 0.08}>
            <div className="p-6 md:p-7 rounded-xl border border-white/10 hover:border-white/20 transition-colors h-full">
              <p className="text-[var(--color-accent)] text-[11px] md:text-xs font-semibold tracking-[0.15em] uppercase mb-3">
                {feature.eyebrow}
              </p>
              <h3 className="text-white text-lg md:text-xl font-semibold mb-3">
                {expanded ? expandedTitles[i] : feature.title}
              </h3>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                {expanded ? expandedDescriptions[i] : feature.description}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
