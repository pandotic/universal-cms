import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import TextReveal from "@/components/TextReveal";
import type { Metadata } from "next";
import type { Project } from "@/types/projects";
import { getAllProjects, getProjectDescription } from "@/lib/projects";
import { legacyDescriptions, categories } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore Pandotic's portfolio of AI-powered products across energy, education, and building performance.",
  openGraph: {
    title: "Pandotic AI Project Showcase",
    description:
      "Real AI-driven products across green buildings, electrification, and education. See how Pandotic turns intelligent systems into measurable results.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Pandotic AI" }],
  },
};

function ProjectCard({ project, description }: { project: Project; description: string }) {
  return (
    <div className="p-5 md:p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-colors flex flex-col h-full">
      <p className="text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase mb-3">
        {project.tagline.length > 60
          ? project.tagline.slice(0, 60).replace(/\s+\S*$/, "") + "..."
          : project.tagline}
      </p>
      <h3 className="text-white text-xl md:text-2xl font-bold mb-4">{project.name}</h3>
      <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 flex-1">
        {description}
      </p>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] border border-white/10 text-gray-500 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {project.has_detail_page && (
          <Link
            href={`/projects/${project.slug}`}
            className="text-[var(--color-accent)] text-sm font-semibold hover:underline inline-block min-h-[44px] leading-[44px]"
          >
            View Case Study &rarr;
          </Link>
        )}
        {project.own_site_url && (
          <a
            href={project.own_site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] text-sm font-semibold hover:underline inline-block min-h-[44px] leading-[44px]"
          >
            Learn More &rarr;
          </a>
        )}
      </div>
    </div>
  );
}

export default async function Projects() {
  const allProjects = await getAllProjects();

  // Pre-fetch descriptions for all projects
  const descriptions: Record<string, string> = {};
  await Promise.all(
    allProjects.map(async (project) => {
      descriptions[project.slug] = project.has_detail_page
        ? await getProjectDescription(project.slug)
        : legacyDescriptions[project.slug] || project.tagline;
    }),
  );

  // Group by category
  const grouped = allProjects.reduce(
    (acc, project) => {
      const cat = project.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(project);
      return acc;
    },
    {} as Record<string, Project[]>,
  );

  const categoryOrder = ["green-buildings", "proptech", "education"];
  const orderedCategories = [
    ...categoryOrder.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !categoryOrder.includes(c)),
  ];

  return (
    <>
      <section className="py-20 md:py-32 px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <TextReveal as="h1" className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Pandotic Project Showcase
          </TextReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-gray-400 text-base md:text-lg">
              Explore our portfolio of AI-driven ventures transforming industries—each designed to
              unlock smarter workflows, deeper insights, and strategic growth opportunities.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {orderedCategories.map((cat) => {
        const catMeta = categories[cat];
        const projects = grouped[cat];

        return (
          <section key={cat} className="py-8 md:py-12 px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
              <TextReveal as="h2" className="text-2xl md:text-3xl font-bold text-white mb-4">
                {catMeta?.title || cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </TextReveal>
              <ScrollReveal>
                <p className="text-gray-400 mb-8 md:mb-12 max-w-3xl">
                  {catMeta?.description || ""}
                </p>
              </ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {projects.map((project, i) => (
                  <ScrollReveal key={project.slug} delay={i * 0.1}>
                    <ProjectCard project={project} description={descriptions[project.slug]} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="py-12 md:py-20 px-4 md:px-6 text-center">
        <ScrollReveal className="max-w-3xl mx-auto">
          <TextReveal as="h2" className="text-2xl md:text-4xl font-bold text-white mb-4">
            See something that resonates?
          </TextReveal>
          <h3 className="text-lg md:text-xl text-gray-400 mb-8">
            Tell us what you&apos;re building. We&apos;ll figure out the fastest path to a working
            product.
          </h3>
          <Link
            href="/contact"
            className="inline-block bg-[var(--color-accent)] text-white font-semibold px-8 py-3 rounded-full hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Get started
          </Link>
        </ScrollReveal>
      </section>
    </>
  );
}
