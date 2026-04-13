import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Robin SEL: A Case Study",
  description:
    "How Pandotic partnered with Robin to build an AI-powered curriculum engine that adapts to each school district's standards and keeps teachers in control.",
};

export default function RobinSEL() {
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
            <p className="text-white text-sm font-semibold">Scott Farber</p>
            <p className="text-gray-400 text-sm">Apr 22, 2025</p>
          </div>
        </div>

        <span className="inline-block text-xs border border-white/20 text-gray-400 rounded-full px-3 py-1 mb-4">
          EdTech
        </span>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
          Robin SEL: A Case Study
        </h1>

        <div className="aspect-video rounded-2xl overflow-hidden relative mb-8 md:mb-12">
          <Image src="/images/blog/robin.webp" alt="Robin SEL" fill className="object-cover" />
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300 text-base md:text-lg leading-relaxed">
          <h2 className="text-xl md:text-2xl font-bold text-white">Robin&apos;s Approach</h2>
          <p>
            Robin is an educational company dedicated to enhancing students&apos; mental health and
            learning success through innovative, video-based curriculum and programming for K-12
            schools and districts. Focused on social, emotional, and mental wellness, Robin partners
            with schools to assess student connections and teach essential relationship-building
            skills. Their approach integrates diagnostic assessments and on-the-ground coaching to
            create supportive environments where students, families, and classrooms can thrive.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white">The Ask</h2>
          <p>
            Robin sought to incorporate AI to improve data analysis and enable greater customization
            and differentiation of their curriculum—helping ensure that teachers have the best
            materials to meet the specific needs of their students. They wanted to build a refreshed,
            responsive curriculum that would keep teachers at the center of educational decisions
            while saving them time and providing powerful support.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white">Pandotic&apos;s Involvement</h2>
          <p>
            Pandotic collaborated closely with Robin&apos;s leadership and product team, forming a true
            partnership from brainstorming through revisions and strategic execution. With expertise
            in education, agentic AI development and multi-agent workflow design, we are enhancing
            Robin&apos;s curriculum and customer success workflows with data-driven, customizable tools.
            Together, Robin and Pandotic are building an AI-enhanced system that ensures curriculum
            content can flex and adapt to the unique priorities of each school community—all while
            empowering educators to remain in control of the process.
          </p>
        </div>
      </div>
    </article>
  );
}
