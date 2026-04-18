import Link from "next/link";
import FeatureGrid from "@/components/FeatureGrid";
import BlogCards from "@/components/BlogCards";
import ScrollReveal from "@/components/ScrollReveal";
import TextReveal from "@/components/TextReveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Pandotic?",
  description:
    "Pandotic sits between a traditional agency, a software consultancy, and an internal innovation lab — combining the best of each without the overhead of any.",
  openGraph: {
    title: "Why Pandotic? — Speed, AI-Native Thinking, and Hands-On Execution",
    description:
      "Four exited founders. AI-native product thinking. Strategy through implementation. See why teams choose Pandotic.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Pandotic AI" }],
  },
};

export default function WhyPandotic() {
  return (
    <>
      {/* Hero */}
      <section className="bg-pando py-24 md:py-40 px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <TextReveal as="h1" className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Why teams choose Pandotic
          </TextReveal>
          <ScrollReveal delay={0.3}>
          <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            We sit between a traditional agency, a software consultancy, and an internal innovation
            lab &mdash; combining the best of each without the overhead of any.
          </p>
          </ScrollReveal>
        </div>
      </section>

      {/* What Makes This Different */}
      <section className="py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <TextReveal as="h2" className="text-2xl md:text-4xl font-bold text-white text-center mb-4">
            What makes this different
          </TextReveal>
          <ScrollReveal>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center max-w-2xl mx-auto mb-10 md:mb-16">
              Most firms are good at one thing. We connect strategy, systems, product, and execution
              into a single engagement.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                eyebrow: "MOVE FAST, BUILD RIGHT",
                title: "Speed with structure",
                description:
                  "We operate like a venture studio. Functional prototypes in weeks. But we don\u2019t skip the thinking \u2014 requirements, logic, user flow, and business model are baked in from day one.",
                gradient: "from-purple-900/50 to-pink-900/50",
                border: "border-pink-500/20",
              },
              {
                eyebrow: "AI THAT EARNS ITS PLACE",
                title: "AI-native, not AI-bolted",
                description:
                  "We don\u2019t add AI features for marketing value. We architect solutions where AI reduces friction, structures messy information, and creates real operational leverage.",
                gradient: "from-blue-900/50 to-teal-900/50",
                border: "border-teal-500/20",
              },
              {
                eyebrow: "END TO END",
                title: "Strategy through implementation",
                description:
                  "Most firms hand off a strategy deck. We produce working materials \u2014 specs, schemas, prototypes, messaging \u2014 that go directly into implementation.",
                gradient: "from-indigo-900/50 to-violet-900/50",
                border: "border-violet-500/20",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.15}>
                <div className="p-5 md:p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-colors h-full">
                  <div className={`aspect-video rounded-xl bg-gradient-to-br ${item.gradient} border ${item.border} mb-5`} />
                  <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
                    {item.eyebrow}
                  </p>
                  <h3 className="text-white text-xl md:text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How We Think About AI */}
      <section className="bg-pando bg-pando-soft py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <TextReveal as="h2" className="text-2xl md:text-4xl font-bold text-white text-center mb-4">
            How we think about AI
          </TextReveal>
          <ScrollReveal>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center max-w-2xl mx-auto mb-10 md:mb-16">
              AI works best when it strengthens the whole system, not when it replaces the humans
              inside it.
            </p>
          </ScrollReveal>

          <ScrollReveal className="max-w-3xl mx-auto">
            <div className="p-6 md:p-10 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
              <p className="text-gray-200 text-lg md:text-xl leading-relaxed mb-5">
                We build AI that helps information move faster, reduces friction, supports
                decision-making, and makes hard work more manageable. The human expert supervises,
                validates, and applies judgment. The AI handles the volume.
              </p>
              <p className="text-gray-200 text-lg md:text-xl leading-relaxed">
                Think of a skilled professional who completes 10 complex tasks a day. With the right
                AI system, the same expert can scale to 50 or 100 high-quality outputs &mdash; because
                the AI drafts, calculates, and suggests while the human reviews, corrects, and
                approves where it matters most.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <TextReveal as="h2" className="text-2xl md:text-4xl font-bold text-white text-center mb-4">
            Our Process
          </TextReveal>
          <ScrollReveal>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center max-w-2xl mx-auto mb-10 md:mb-16">
              We move through a pattern that connects business clarity to working products.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                step: "01",
                title: "Clarify the problem",
                line1: "We define the business problem, workflow, or opportunity.",
                line2:
                  "Then we identify the most useful product or system response \u2014 not a generic recommendation, but a specific path forward.",
              },
              {
                step: "02",
                title: "Design and prototype",
                line1: "Requirements, logic, structure, user flow.",
                line2:
                  "Then a working prototype you can react to \u2014 not a slide deck. We move fast so decisions happen in days, not weeks.",
              },
              {
                step: "03",
                title: "Build and ship",
                line1:
                  "Implementation-ready outputs: specs, prompts, schemas, working code.",
                line2:
                  "We support rapid build, refinement, and deployment. The goal is a product in the world, not a document on a shelf.",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.15}>
                <div className="p-5 md:p-6 rounded-xl border border-white/10">
                  <span className="text-[var(--color-accent)] text-sm font-bold">{item.step}</span>
                  <h3 className="text-white text-lg md:text-xl font-semibold mt-3 mb-4">{item.title}</h3>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-3">{item.line1}</p>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed">{item.line2}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid (expanded) */}
      <FeatureGrid expanded />

      {/* Blog Preview */}
      <BlogCards />
    </>
  );
}
