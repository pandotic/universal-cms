import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { cmsConfig } from "@/cms.config";
import { getEntityBySlug } from "@pandotic/universal-cms/data/entities";
import { getPublicReviews } from "@pandotic/universal-cms/data/reviews";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const entity = await getEntityBySlug(supabase, slug);

  if (!entity) return { title: "Not Found" };

  return {
    title: `${entity.name} | ${cmsConfig.primaryEntity.plural}`,
    description: `Learn more about ${entity.name} on ${cmsConfig.siteName}`,
  };
}

export default async function EntityDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const entity = await getEntityBySlug(supabase, slug);

  if (!entity) {
    notFound();
  }

  // Fetch reviews if the reviews module is enabled
  let reviews: Awaited<ReturnType<typeof getPublicReviews>> = [];
  if (cmsConfig.modules.reviews) {
    try {
      reviews = await getPublicReviews(
        supabase,
        cmsConfig.primaryEntity.name,
        entity.id
      );
    } catch {
      // Reviews table may not exist if module isn't migrated
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Entity Header — Customize for your site */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{entity.name}</h1>
            <p className="mt-1 text-foreground-secondary">{entity.type}</p>
          </div>
          {entity.featured && (
            <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary">
              Featured
            </span>
          )}
        </div>
        {entity.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {entity.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs text-foreground-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Entity Details — Customize: add fields specific to your entity type */}
      <section className="mb-12 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Details</h2>
        <p className="text-foreground-secondary">
          Customize this section to display the fields relevant to your{" "}
          {cmsConfig.primaryEntity.singular.toLowerCase()} type.
        </p>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section>
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Reviews ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-border bg-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {review.display_name || "Anonymous"}
                  </span>
                  <span className="text-sm text-foreground-muted">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                {review.title && (
                  <h3 className="mt-2 font-semibold text-foreground">
                    {review.title}
                  </h3>
                )}
                {review.body && (
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {review.body}
                  </p>
                )}
                <p className="mt-2 text-xs text-foreground-muted">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
