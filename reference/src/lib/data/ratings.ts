import ratingsData from "@/data/ratings.json";
import type { EntityRatings, RatingsData } from "@/lib/types/ratings";

const data = ratingsData as RatingsData;

export function getRatingsForEntity(slug: string): EntityRatings | undefined {
  return data[slug];
}

export function getAllRatings(): RatingsData {
  return data;
}

export function getEntitiesWithRatings(): string[] {
  return Object.keys(data);
}
