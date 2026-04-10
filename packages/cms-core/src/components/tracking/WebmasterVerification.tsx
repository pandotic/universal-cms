import type { SupabaseClient } from "@supabase/supabase-js";
import { getSetting } from "../../data/site-settings";
import type { WebmasterVerification as WebmasterVerificationConfig } from "../../types";

export async function WebmasterVerification({ client }: { client: SupabaseClient }) {
  try {
    const raw = await getSetting(client, "webmaster_verification");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

    const config = raw as unknown as WebmasterVerificationConfig;

    return (
      <>
        {config.google && (
          <meta name="google-site-verification" content={config.google} />
        )}
        {config.bing && (
          <meta name="msvalidate.01" content={config.bing} />
        )}
        {config.yandex && (
          <meta name="yandex-verification" content={config.yandex} />
        )}
      </>
    );
  } catch {
    return null;
  }
}
