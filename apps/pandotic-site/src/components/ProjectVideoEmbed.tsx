import ScrollReveal from "@/components/ScrollReveal";

interface ProjectVideoEmbedProps {
  videoId: string | null;
  projectName: string;
}

export default function ProjectVideoEmbed({ videoId, projectName }: ProjectVideoEmbedProps) {
  if (!videoId) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="relative aspect-video rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
            {/* Placeholder until real video URLs are available */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center mb-4 hover:bg-[var(--color-accent)]/30 transition-colors cursor-pointer">
                <svg className="w-8 h-8 text-[var(--color-accent)] ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">
                {projectName} walkthrough video coming soon
              </p>
              <p className="text-gray-600 text-xs mt-1">
                ID: {videoId}
              </p>
            </div>
          </div>
          <p className="text-gray-500 text-sm text-center mt-4 italic">
            See how {projectName} turns complexity into clarity.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
