/**
 * Non-app things the Pandotic team needs to track and review weekly:
 * conferences, partnerships, client deals, and internal bets. Kept in
 * one unified shape so the Team Hub "Fleet review" agenda section can
 * surface anything that needs discussion without a second model.
 */

export const INITIATIVE_KINDS = [
  "conference",
  "partnership",
  "deal",
  "bet",
  "other",
] as const;
export type InitiativeKind = (typeof INITIATIVE_KINDS)[number];

export const INITIATIVE_STAGES = [
  "idea",
  "active",
  "stalled",
  "won",
  "lost",
  "complete",
  "archived",
] as const;
export type InitiativeStage = (typeof INITIATIVE_STAGES)[number];

export interface HubInitiative {
  id: string;
  name: string;
  slug: string;
  kind: InitiativeKind;
  stage: InitiativeStage;
  owner_id: string | null;
  counterparty: string | null;
  starts_on: string | null;
  ends_on: string | null;
  next_step: string | null;
  next_step_due: string | null;
  last_update_at: string;
  property_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type HubInitiativeInsert = Omit<
  HubInitiative,
  "id" | "created_at" | "updated_at" | "last_update_at"
> & {
  last_update_at?: string;
};

export type HubInitiativeUpdate = Partial<HubInitiativeInsert>;

export interface InitiativeFilters {
  kind?: InitiativeKind;
  stage?: InitiativeStage;
  ownerId?: string;
  propertyId?: string;
}
