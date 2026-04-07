import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getContentPageBySlug } from "@pandotic/universal-cms/data/content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const page = await getContentPageBySlug(supabase, slug);

  if (!page) return { title: "Not Found" };

  return {
    title: page.seo_title || page.title,
    description: page.seo_description || page.excerpt || undefined,
    openGraph: {
      title: page.seo_title || page.title,
      description: page.seo_description || page.excerpt || undefined,
      images: page.og_image ? [page.og_image] : undefined,
    },
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const page = await getContentPageBySlug(supabase, slug);

  if (!page || page.status !== "published") {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {page.title}
        </h1>
        {page.excerpt && (
          <p className="mt-4 text-lg text-foreground-secondary">{page.excerpt}</p>
        )}
      </header>

      {/* Customize: replace with your rich text renderer */}
      {page.body && (
        <div
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      )}
    </article>
  );
}
