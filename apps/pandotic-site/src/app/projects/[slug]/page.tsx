import Link from "next/link";
import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";
import BlogCards from "@/components/BlogCards";
import ProjectHero from "@/components/ProjectHero";
import ProjectFeatureGrid from "@/components/ProjectFeatureGrid";
import ProjectCaseStudy from "@/components/ProjectCaseStudy";
import ProjectProofPoints from "@/components/ProjectProofPoints";
import ProjectTechStack from "@/components/ProjectTechStack";
import ProjectVideoEmbed from "@/components/ProjectVideoEmbed";
import ProjectScreenshots from "@/components/ProjectScreenshots";
import {
  getContentFolderSlugs,
  getProjectWithContent,
} from "@/lib/projects";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getContentFolderSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectWithContent(slug);
  if (!project) return { title: "Project Not Found" };

  const description =
    project.blurbs.short || project.tagline || project.portfolio.summary;

  return {
    title: project.name,
    description,
    openGraph: {
      title: `${project.name} | Pandotic AI`,
      description,
      images: project.hero_screenshot
        ? [
            {
              url: `/images/projects/${slug}/${project.hero_screenshot.replace("screenshots/", "")}`,
              width: 1200,
              height: 630,
              alt: project.name,
            },
          ]
        : [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Pandotic AI" }],
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectWithContent(slug);

  if (!project) {
    return (
      <section className="py-32 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Project Not Found</h1>
        <p className="text-gray-400 mb-8">
          The project you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/projects"
          className="text-[var(--color-accent)] hover:underline"
        >
          Back to Projects
        </Link>
      </section>
    );
  }

  return (
    <>
      <ProjectHero project={project} productPage={project.productPage} />

      {project.productPage.problemSection && (
        <section className="py-12 md:py-20 px-4 md:px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
                The Problem
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Why This Matters
              </h2>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                {project.productPage.problemSection}
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}

      {project.productPage.howItWorks.length > 0 && (
        <section className="py-12 md:py-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal>
              <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
                How It Works
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 md:mb-12">
                Core Capabilities
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {project.productPage.howItWorks.map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 0.1}>
                  <div className="p-5 md:p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-colors h-full">
                    <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-white text-xl font-bold mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <ProjectFeatureGrid
        features={project.features}
        projectName={project.name}
      />

      <ProjectVideoEmbed
        videoId={project.video_long_id}
        projectName={project.name}
      />

      <ProjectCaseStudy
        caseStudy={project.caseStudy}
        projectName={project.name}
      />

      {project.productPage.whyDifferent && (
        <section className="py-12 md:py-20 px-4 md:px-6 bg-white/[0.01]">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
                The Difference
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Why It&apos;s Different
              </h2>
              <p className="text-gray-400 text-base leading-relaxed">
                {project.productPage.whyDifferent}
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}

      <ProjectTechStack differentiators={project.techDifferentiators} />

      {project.productPage.whatWeBuilt.length > 0 && (
        <section className="py-12 md:py-20 px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
                Delivered
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
                What We Built
              </h2>
            </ScrollReveal>
            <div className="space-y-4">
              {project.productPage.whatWeBuilt.map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.06}>
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <span className="text-[var(--color-accent)] mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p className="text-gray-300 text-sm leading-relaxed">{item}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <ProjectProofPoints proofPoints={project.proofPoints} />

      <ProjectScreenshots slug={slug} screenshots={[]} />

      <section className="py-12 md:py-20 px-4 md:px-6 text-center">
        <ScrollReveal className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Interested in learning more?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            See how Pandotic can build something like this for your organization.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-[var(--color-accent)] text-white font-semibold px-8 py-3 rounded-full hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Get in Touch
          </Link>
        </ScrollReveal>
      </section>

      <BlogCards />
    </>
  );
}
