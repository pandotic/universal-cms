import TeamCard from "@/components/TeamCard";
import BlogCards from "@/components/BlogCards";
import ScrollReveal from "@/components/ScrollReveal";
import TextReveal from "@/components/TextReveal";
import { teamMembers } from "@/data/team";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meet your Team",
  description:
    "Meet the team behind Pandotic — four exited founders who've scaled companies across energy, education, health, and digital marketing.",
  openGraph: {
    title: "Meet your Team — Pandotic",
    description:
      "Four exited founders and builders — distributed globally, working together to help organizations move faster with AI-powered products and workflows.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Pandotic AI" }],
  },
};

export default function AboutUs() {
  return (
    <>
      {/* Mission */}
      <section className="bg-pando py-24 md:py-40 px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <h1 className="text-[var(--color-accent)] text-base md:text-lg font-semibold tracking-wider uppercase mb-4">Meet your Team</h1>
          </ScrollReveal>
          <TextReveal as="h2" className="text-3xl md:text-5xl font-bold text-white leading-tight">
            Four exited founders helping organizations move from ideas to working products, fast.
          </TextReveal>
        </div>
      </section>

      {/* Team */}
      <section className="py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed text-center max-w-2xl mx-auto mb-10 md:mb-14">
              We are a distributed team of founders and operators from energy, education, health, and
              digital marketing. We combine strategy, systems thinking, and hands-on execution to help
              organizations build faster.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {teamMembers.map((member, i) => (
              <ScrollReveal key={member.name} delay={i * 0.1}>
                <TeamCard member={member} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <BlogCards />
    </>
  );
}
