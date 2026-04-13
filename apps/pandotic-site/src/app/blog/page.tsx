import Link from "next/link";
import Image from "next/image";
import { blogPosts } from "@/data/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights from the Pandotic team on practical AI, product building, and real-world case studies.",
  openGraph: {
    title: "Pandotic Blog",
    description:
      "How we think about AI, product, and getting things into the world.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Pandotic AI" }],
  },
};

export default function Blog() {
  const featured = blogPosts.find((p) => p.slug === "the-roots-of-pandotic-ai")!;
  const others = blogPosts.filter((p) => p.slug !== "the-roots-of-pandotic-ai");

  return (
    <>
      {/* Header */}
      <section className="py-20 md:py-32 px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            From the build floor
          </h1>
          <p className="text-gray-400 text-base md:text-lg">
            How we think about AI, product, and getting things into the world.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="px-4 md:px-6 pb-8 md:pb-12">
        <div className="max-w-7xl mx-auto">
          <Link
            href={`/blog/${featured.slug}`}
            className="group block rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors"
          >
            <div className="aspect-video md:aspect-[21/9] relative">
              <Image src={featured.image} alt={featured.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-5 md:p-8">
                <div>
                  <h2 className="text-white text-xl md:text-3xl font-bold group-hover:text-[var(--color-accent)] transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">
                    {featured.author} &middot; {featured.date}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Other Posts */}
      <section className="px-4 md:px-6 pb-12 md:pb-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4 md:gap-8">
          {others.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors"
            >
              <div className="aspect-video relative overflow-hidden">
                <Image src={post.image} alt={post.title} fill className="object-cover" />
              </div>
              <div className="p-4 md:p-5">
                {post.category && (
                  <span className="text-xs border border-white/20 text-gray-400 rounded-full px-3 py-1">
                    {post.category}
                  </span>
                )}
                <h3 className="text-white font-semibold mt-3 group-hover:text-[var(--color-accent)] transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm mt-2">
                  {post.author} &middot; {post.date}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
