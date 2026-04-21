"use client";

import { useQuery } from "@tanstack/react-query";
import { listProperties } from "@pandotic/universal-cms/data/hub";
import { listInitiativesForReview } from "@pandotic/universal-cms/data/hub-initiatives";
import {
  deriveFleetAttention,
  deriveInitiativeReview,
  type FleetAttentionFlag,
} from "@pandotic/universal-cms/data/hub-fleet-review";
import { supabase } from "@/lib/team-hub/supabase";

/**
 * Fleet properties that need attention this week — derived live from
 * hub_properties via the pure-function rules in cms-core.
 */
export function useFleetAttention() {
  return useQuery<FleetAttentionFlag[]>({
    queryKey: ["team-hub", "fleet-attention"],
    queryFn: async () => {
      const props = await listProperties(supabase);
      return deriveFleetAttention(props);
    },
  });
}

/**
 * Non-app initiatives worth reviewing this week — conferences, deals,
 * partnerships, bets — filtered + annotated by the pure-function rules
 * in cms-core.
 */
export function useInitiativesReview() {
  return useQuery<FleetAttentionFlag[]>({
    queryKey: ["team-hub", "initiatives-review"],
    queryFn: async () => {
      const initiatives = await listInitiativesForReview(supabase);
      return deriveInitiativeReview(initiatives);
    },
  });
}
