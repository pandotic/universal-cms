import BlogCards from "@/components/BlogCards";
import ContactForm from "@/components/ContactForm";
import ScrollReveal from "@/components/ScrollReveal";
import TextReveal from "@/components/TextReveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Tell us what you're trying to build. We'll figure out the fastest path from idea to working product.",
  openGraph: {
    title: "Contact Pandotic",
    description:
      "Tell us what you're trying to build. No pitch decks required — just a conversation about what you want to exist in the world.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Pandotic AI" }],
  },
};

export default function Contact() {
  return (
    <>
      <section className="py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-xl mx-auto">
          <TextReveal as="h1" className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
            Let&apos;s build something
          </TextReveal>
          <ScrollReveal delay={0.2}>
          <p className="text-gray-400 text-base md:text-lg text-center mb-8 md:mb-12">
            Tell us what you&apos;re trying to build &mdash; or what problem you&apos;re trying to
            solve. No pitch decks required. Just a conversation about what you want to exist in the
            world.
          </p>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <ContactForm />
          </ScrollReveal>
        </div>
      </section>

      <BlogCards />
    </>
  );
}
