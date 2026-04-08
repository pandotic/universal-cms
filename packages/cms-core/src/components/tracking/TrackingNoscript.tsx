import type { SupabaseClient } from "@supabase/supabase-js";
import { getAnalyticsProviders } from "../../data/site-settings";

/**
 * Renders noscript fallback tags for tracking providers that require them.
 * Place this immediately after the opening <body> tag.
 * Currently only GTM requires a noscript iframe.
 */
export async function TrackingNoscript({ client }: { client: SupabaseClient }) {
  try {
    const providers = await getAnalyticsProviders(client);
    const gtm = providers.find(
      (p) => p.provider === "gtm" && p.enabled
    );
    if (!gtm) return null;

    const containerId = gtm.config.container_id as string;
    if (!containerId) return null;

    return (
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    );
  } catch {
    return null;
  }
}
