import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import TextReveal from "@/components/TextReveal";
import type { Project, ParsedProductPage } from "@/types/projects";

interface ProjectHeroProps {
  project: Project;
  productPage: ParsedProductPage;
}

export default function ProjectHero({ project, productPage }: ProjectHeroProps) {
  return (
    <section className="py-20 md:py-32 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back link */}
        <ScrollReveal>
          <Link
            href="/projects"
            className="text-gray-400 text-sm hover:text-white transition-colors inline-flex items-center gap-2 mb-8 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Text content */}
          <div>
            <ScrollReveal>
              <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-4">
                {project.category.replace(/-/g, " ")}
              </p>
            </ScrollReveal>

            <TextReveal
              as="h1"
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
            >
              {productPage.headline}
            </TextReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8">
                {project.tagline}
              </p>
            </ScrollReveal>

            {/* Tags */}
            <ScrollReveal delay={0.3}>
              <div className="flex flex-wrap gap-2 mb-8">
                {project.tags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs border border-white/10 text-gray-400 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </ScrollReveal>

            {/* CTAs */}
            <ScrollReveal delay={0.4}>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="inline-block bg-[var(--color-accent)] text-white font-semibold px-8 py-3 rounded-full hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Get in Touch
                </Link>
                {project.has_live_demo && project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border border-white/20 text-white font-semibold px-8 py-3 rounded-full hover:border-white/40 transition-colors"
                  >
                    Live Demo
                  </a>
                )}
                {project.own_site_url && (
                  <a
                    href={project.own_site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border border-white/20 text-white font-semibold px-8 py-3 rounded-full hover:border-white/40 transition-colors"
                  >
                    Visit Site &rarr;
                  </a>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Hero screenshot */}
          <ScrollReveal delay={0.3} direction="right">
            <div className="relative aspect-video rounded-2xl border border-white/10 overflow-hidden bg-white/5">
              {project.hero_screenshot ? (
                <Image
                  src={`/images/projects/${project.slug}/${project.hero_screenshot.replace("screenshots/", "")}`}
                  alt={`${project.name} screenshot`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <svg className="w-16 h-16 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Screenshot coming soon</span>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
