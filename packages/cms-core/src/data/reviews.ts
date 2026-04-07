import type { SupabaseClient } from "@supabase/supabase-js";

export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

export interface Review {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  display_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  multi_ratings: Record<string, number>;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export async function getAllReviews(
  client: SupabaseClient,
  options?: {
    status?: ReviewStatus;
    entityType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ reviews: Review[]; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  let query = client
    .from("cms_reviews")
    .select("*", { count: "exact" });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.entityType) query = query.eq("entity_type", options.entityType);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { reviews: data ?? [], total: count ?? 0 };
}

export async function getPublicReviews(
  client: SupabaseClient,
  entityType: string,
  entityId: string
): Promise<Review[]> {
  const { data, error } = await client
    .from("reviews_public")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createReview(
  client: SupabaseClient,
  review: Partial<Review>
): Promise<Review> {
  const { data, error } = await client
    .from("cms_reviews")
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReviewStatus(
  client: SupabaseClient,
  id: string,
  status: ReviewStatus
): Promise<Review> {
  const { data, error } = await client
    .from("cms_reviews")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkUpdateReviewStatus(
  client: SupabaseClient,
  ids: string[],
  status: ReviewStatus
): Promise<void> {
  const { error } = await client
    .from("cms_reviews")
    .update({ status })
    .in("id", ids);

  if (error) throw error;
}

export async function deleteReview(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("cms_reviews").delete().eq("id", id);
  if (error) throw error;
}

export async function getReviewStats(client: SupabaseClient): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
}> {
  const [
    { count: total },
    { count: pending },
    { count: approved },
    { count: rejected },
  ] = await Promise.all([
    client.from("cms_reviews").select("*", { count: "exact", head: true }),
    client
      .from("cms_reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    client
      .from("cms_reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    client
      .from("cms_reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected"),
  ]);

  const { data: avgData } = await client
    .from("cms_reviews")
    .select("rating")
    .eq("status", "approved");

  const ratings = (avgData ?? []).map((r) => r.rating).filter(Boolean);
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

  return {
    total: total ?? 0,
    pending: pending ?? 0,
    approved: approved ?? 0,
    rejected: rejected ?? 0,
    averageRating: Math.round(averageRating * 10) / 10,
  };
}
