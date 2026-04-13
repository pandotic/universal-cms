import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Roots of Pandotic AI",
  description:
    "The name Pandotic comes from the Pando tree and agentic intelligence — learn the origin story and philosophy behind how Pandotic builds connected, scalable AI systems.",
};

export default function RootsOfPandoticAI() {
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
            <p className="text-gray-400 text-sm">Jan 22, 2025</p>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
          The Roots of Pandotic AI
        </h1>

        <div className="aspect-video rounded-2xl bg-gradient-to-br from-amber-900/40 to-yellow-900/30 mb-8 md:mb-12" />

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300 text-base md:text-lg leading-relaxed">
          <p>
            The name <strong className="text-white">Pandotic</strong> comes from two powerful sources of inspiration: the{" "}
            <strong className="text-white">Pando tree</strong> and the concept of{" "}
            <strong className="text-white">agentic intelligence</strong>.
          </p>
          <p>
            Together, they capture the essence of how we believe artificial intelligence should be
            built—and how it can be used to solve real-world problems at scale.
          </p>
          <p>
            The Pando tree is the world&apos;s largest tree. What appears to be a sprawling forest of
            over 40,000 aspen trees is, in reality, one interconnected being, all sharing a single
            genetic code and a vast underground interconnected root system. Each tree, or shoot, is
            unique in shape and purpose, but a common foundation nourishes all.
          </p>
          <p>This is the perfect analogy for how we&apos;ve designed Pandotic AI.</p>
          <p>
            Every solution we create—whether for education, energy, customer service, or scientific
            discovery—may appear to be an entirely separate application. However, in truth, each is a
            branch of the same system, all connected through a unified architecture, a shared data
            infrastructure, and the collective intelligence of humanity itself.
          </p>
          <p>
            That shared root system is where the power lies. It&apos;s what allows us to scale quickly,
            specialize deeply, and adapt intelligently across domains. Beneath the surface, Pandotic
            provides a platform of persistent knowledge that continuously grows and evolves, just
            like Pando&apos;s roots.
          </p>
          <p>
            On top of that foundation, we bring in the second half of our name: agentic. We build
            and deploy AI agents—modular, specialized, and highly capable—that can be trained for
            specific tasks while working in coordination with others. These agents are like shoots of
            the Pando: distinct and expert, but deeply interdependent.
          </p>
          <p>
            This approach enables us to create intelligence that is not only informed, but
            purposeful—AI that doesn&apos;t just process, but acts. That&apos;s what we mean by agentic AI:
            systems that make decisions, collaborate, and solve problems, powered by a shared core of
            understanding.
          </p>
          <p>
            At Pandotic AI, we&apos;re not just connecting tools. We&apos;re cultivating an evolving, learning
            ecosystem—rooted in shared intelligence, branching out into infinite, actionable
            possibilities.
          </p>
        </div>
      </div>
    </article>
  );
}
