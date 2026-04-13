import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supervised AI: Giving Humans Superpowers",
  description:
    "Pandotic designs AI that works alongside people, not in place of them — amplifying your experts so they can scale their impact 5–10x without losing accuracy or control.",
};

export default function SupervisedAI() {
  return (
    <article className="py-20 md:py-32 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-8 min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700" />
          <div>
            <p className="text-white text-sm font-semibold">Matt Golden</p>
            <p className="text-gray-400 text-sm">Feb 17, 2025</p>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
          Supervised AI: Giving Humans Superpowers
        </h1>

        <div className="aspect-video rounded-2xl overflow-hidden relative mb-8 md:mb-12">
          <Image src="/images/blog/supervised-ai.avif" alt="Supervised AI" fill className="object-cover" />
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300 text-base md:text-lg leading-relaxed">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            A Pandotic Perspective on Human-Centered Intelligence
          </h2>
          <p>
            At <strong className="text-white">Pandotic AI</strong>, we design agentic AI systems that work{" "}
            <strong className="text-white">alongside</strong> people, not in place of them. Our mission is
            simple: help businesses operate faster, smarter, and more profitably—without compromising
            on accuracy or control.
          </p>
          <p>
            One of the most common hesitations people have about AI is trust. They&apos;ve seen what AI
            can do, sometimes brilliant, sometimes bewildering. Yes, AI can produce extraordinary
            results. However, it can also veer off course, hallucinate, or produce directionally
            incorrect outcomes. And in a business context, that uncertainty can be a deal-breaker.
          </p>
          <p>That&apos;s where Supervised AI comes in.</p>
          <p>
            At Pandotic, we don&apos;t believe the future lies in fully autonomous, unsupervised systems
            that run in the background and promise perfection. Instead, we&apos;re building augmented
            workflows that empower human experts, giving them superpowers.
          </p>
          <p>
            Think of a skilled professional who can currently complete 10 complex tasks a day. With
            supervised AI, the same expert can scale to produce 50, or even 100, high-quality
            outputs. The AI handles repetitive, time-consuming tasks—drafting, calculating, and
            suggesting—while the human expert supervises, reviews, and applies their judgment where
            it matters most.
          </p>
          <p>
            The AI is not the final authority. It&apos;s the assistant, the researcher, the drafter. It
            generates the most likely answer—often 95% of the way there—and flags areas of
            uncertainty. It&apos;s up to the expert to step in, correct, validate, and approve.
          </p>
          <p>
            This doesn&apos;t just reduce error and accelerate throughput—it amplifies the value of your
            most experienced people. Subject matter experts are often scarce and expensive. With
            supervised AI, they can scale their impact across far more work, concentrating their
            attention where it counts most—edge cases, quality assurance, and decision-making.
          </p>
          <p>
            So when we talk about Supervised AI at Pandotic, what we&apos;re talking about is a new kind
            of partnership:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>AI systems that assist, not replace</li>
            <li>
              Workflows that are faster and more consistent, without losing the human touch
            </li>
            <li>Experts who are multiplied, not marginalized</li>
          </ul>
          <p>
            This isn&apos;t about excluding humans from the process. It&apos;s about designing AI that keeps
            them at the center—as supervisors, stewards, and superpowered professionals.
          </p>
          <p>Welcome to the age of Supervised AI.</p>
          <p>Welcome to Pandotic.</p>
        </div>
      </div>
    </article>
  );
}
