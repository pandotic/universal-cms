import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blue Collar AI: Real Solutions for Real User Needs",
  description:
    "Pandotic's 'Blue Collar AI' approach focuses on practical, grounded AI that automates tedious business operations today — not futuristic promises.",
};

export default function BlueCollarAI() {
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
            <p className="text-white text-sm font-semibold">Dan Golden</p>
            <p className="text-gray-400 text-sm">Mar 17, 2025</p>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
          Blue Collar AI: Real Solutions for Real User Needs
        </h1>

        <div className="aspect-video rounded-2xl overflow-hidden relative mb-8 md:mb-12">
          <Image src="/images/blog/blue-collar-ai.webp" alt="Blue Collar AI" fill className="object-cover" />
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300 text-base md:text-lg leading-relaxed">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Putting Agentic AI to Work—Today.
          </h2>
          <p>
            At <strong className="text-white">Pandotic AI</strong>, we&apos;re not just imagining the
            future of artificial intelligence—we&apos;re building it into everyday business operations
            right now. And that means rolling up our sleeves and focusing on{" "}
            <strong className="text-white">practical, grounded AI</strong> that solves real-world
            problems.
          </p>
          <p>
            We call this approach <strong className="text-white">Blue Collar AI</strong>.
          </p>
          <p>
            While AI headlines often focus on futuristic promises or splashy breakthroughs, the truth
            is: the tools we already have today, when applied correctly, can revolutionize how
            businesses operate. From education and energy to consumer products and service-based
            industries, the opportunity is vast and immediate.
          </p>

          <h3 className="text-lg md:text-xl font-bold text-white">So, what is Blue Collar AI?</h3>
          <p>
            It&apos;s AI that works behind the scenes, handling the tedious, repetitive, and error-prone
            tasks that eat up time and resources. We&apos;re talking about things like:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Collecting and processing documentation</li>
            <li>Evaluating structured information for decision-making</li>
            <li>Responding to and categorizing incoming requests</li>
            <li>Coordinating actions across internal tools and workflows</li>
          </ul>
          <p>
            These tasks have historically relied on manual effort, were costly to scale, and often
            yielded inconsistent results. With agentic AI, we automate these operations using smart,
            modular systems that work together, delivering accuracy, speed, and consistency.
          </p>
          <p>And here&apos;s the key: this isn&apos;t future tech—it&apos;s ready now.</p>
          <p>
            Pandotic builds intelligent agent workflows that can interface directly with the systems
            your team already uses. We design solutions that fit into existing operations—not the
            other way around. The result is AI that feels less like a science project and more like a
            reliable new team member.
          </p>
        </div>
      </div>
    </article>
  );
}
