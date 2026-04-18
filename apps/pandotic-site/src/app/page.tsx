import Link from "next/link";
import Image from "next/image";
import FeatureGrid from "@/components/FeatureGrid";
import BlogCards from "@/components/BlogCards";
import ScrollReveal from "@/components/ScrollReveal";
import TextReveal from "@/components/TextReveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pandotic – AI-First Innovation Partner & Venture Studio",
  description:
    "Pandotic helps organizations rapidly design, prototype, and launch AI-powered products, workflows, and digital experiences.",
  openGraph: {
    title: "Pandotic – From Messy Ideas to Working Products, Fast",
    description:
      "Pandotic combines strategy, systems thinking, and hands-on execution to move from ambiguity to action faster than anyone else.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Pandotic AI" }],
  },
};

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-4 md:px-6">
        <Image src="/images/hero-backdrop.webp" alt="" fill className="object-cover z-0" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black z-0" />
        <div className="relative z-10 max-w-3xl mx-auto animate-fade-in-up">
          <p className="text-[var(--color-accent)] text-xs font-semibold tracking-widest uppercase mb-6">
            AI-First Innovation Partner &amp; Venture Studio
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
            From messy ideas to{" "}
            <span className="font-bold">working products, fast</span>
          </h1>
          <p className="text-gray-200 text-lg md:text-2xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Pandotic helps organizations design, prototype, and launch AI-powered products,
            workflows, and digital experiences. We combine strategy, systems thinking, and hands-on
            execution to move from ambiguity to action faster than anyone else.
          </p>
          <Link
            href="/why-pandotic"
            className="inline-block bg-[var(--color-accent)] text-white font-semibold px-8 py-3 rounded-full hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Why work with us?
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {[
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              eyebrow: "STRATEGY & ADVISORY",
              title: "Strategy that moves to execution",
              description: "AI opportunity mapping, product strategy, workflow design, and systems planning — connected to real implementation, not a slide deck.",
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ),
              eyebrow: "PRODUCT & BUILD",
              title: "Products built on proven foundations",
              description: "Rapid prototyping, AI-powered workflows, portals, tools, and customer-facing experiences — built fast on battle-tested architecture.",
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ),
              eyebrow: "VENTURE STUDIO",
              title: "Five ways to build with us",
              description: "License, partner, co-found, fund, or refer. We share risk and upside so the right people can build the right things.",
            },
          ].map((service, i) => (
            <ScrollReveal key={i} delay={i * 0.15}>
              <div className="text-center p-6 md:p-8">
                <div className="text-[var(--color-accent)] mb-4 flex justify-center">{service.icon}</div>
                <p className="text-gray-400 text-[11px] md:text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                  {service.eyebrow}
                </p>
                <h3 className="text-white text-xl md:text-2xl font-semibold mb-4">{service.title}</h3>
                <p className="text-gray-300 text-base md:text-lg leading-relaxed">{service.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Why Pandotic / Pando Module */}
      <section className="bg-pando bg-pando-soft py-16 md:py-28 px-4 md:px-6 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <TextReveal as="h2" className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Pandotic
            </TextReveal>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-gray-300 text-base md:text-lg italic border-l-2 border-[var(--color-accent)] pl-5 mb-10 max-w-xl leading-relaxed">
              Pando is a massive quaking aspen clone in Utah. What looks like a forest of 40,000 trees
              is actually one connected organism sharing a common root system.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-gray-200 text-lg md:text-xl leading-relaxed mb-5">
              Pandotic takes inspiration from <strong className="text-white">Pando</strong>. The
              strongest systems are connected, resilient, and built to support many people working
              together. AI should not exist to replace the people doing the work. It should make good
              work easier, smarter, and more scalable &mdash; especially in practical industries where
              better tools can have an immediate effect.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-gray-200 text-lg md:text-xl leading-relaxed">
              That idea drives everything we build. Modern technology with shared roots, practical
              value, and room for people to do better work.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <ScrollReveal className="max-w-4xl mx-auto text-center">
          <blockquote className="text-xl md:text-3xl text-white/90 font-light leading-relaxed italic mb-10">
            &ldquo;Pandotic&apos;s team moved us into a new position as a company. By listening to our
            mission and our needs, they opened the door to creative problem-solving that not only
            saves time internally but allows us to center our customers&apos; needs and tailor our
            products and services more effectively.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-700" />
            <div className="text-left">
              <p className="text-white font-semibold text-base">Linda Thompson</p>
              <p className="text-gray-400 text-sm md:text-base">CEO, Robin SEL</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Team Teaser */}
      <section className="py-12 md:py-20 px-4 md:px-6 text-center">
        <ScrollReveal className="max-w-2xl mx-auto">
          <TextReveal as="h2" className="text-2xl md:text-4xl font-bold text-white mb-4">
            Meet your Team
          </TextReveal>
          <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-10">
            Built by four exited founders who&apos;ve scaled companies across energy, education,
            health, and digital marketing.
          </p>
          <Link
            href="/about-us"
            className="inline-block border border-white/50 text-white px-8 py-3 rounded-full hover:bg-white/10 transition-colors text-base font-medium"
          >
            Meet the team
          </Link>
        </ScrollReveal>
      </section>

      {/* Feature Grid */}
      <FeatureGrid />

      {/* CTA Banner */}
      <section className="py-12 md:py-20 px-4 md:px-6 text-center">
        <ScrollReveal className="max-w-3xl mx-auto">
          <TextReveal as="h2" className="text-2xl md:text-4xl font-bold text-white mb-4">
            Practical AI. Working products. Shared upside.
          </TextReveal>
          <h3 className="text-lg md:text-2xl text-gray-300 leading-relaxed mb-10">
            We reduce the gap between insight and execution &mdash; so you can move from concept to
            customers faster.
          </h3>
          <Link
            href="/contact"
            className="inline-block bg-[var(--color-accent)] text-white font-semibold px-8 py-3 rounded-full hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Contact us
          </Link>
        </ScrollReveal>
      </section>

      {/* Blog Preview */}
      <BlogCards />
    </>
  );
}
