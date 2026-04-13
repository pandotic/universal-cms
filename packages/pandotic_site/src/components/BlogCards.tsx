import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import { blogPosts } from "@/data/blog";

export default function BlogCards({ limit = 3 }: { limit?: number }) {
  const posts = blogPosts.slice(0, limit);

  return (
    <section className="py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {posts.map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 0.1}>
            <Link
              href={`/blog/${post.slug}`}
              className="group block rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors"
            >
              <div className="aspect-video bg-gray-900 relative overflow-hidden">
                <Image src={post.image} alt={post.title} fill loading="lazy" className="object-cover" />
              </div>
              <div className="p-4 md:p-5">
                <h3 className="text-white font-semibold group-hover:text-[var(--color-accent)] transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm mt-2">
                  {post.author} &middot; {post.date}
                </p>
              </div>
            </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
