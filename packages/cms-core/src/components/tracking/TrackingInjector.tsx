import type { SupabaseClient } from "@supabase/supabase-js";
import { getAnalyticsProviders } from "../../data/site-settings";
import type { TrackingScope } from "../../types";

interface ProviderEntry {
  provider: string;
  config: Record<string, unknown>;
  enabled: boolean;
  scope?: string;
}

function renderGA4(config: Record<string, unknown>) {
  const id = config.measurement_id as string;
  if (!id) return null;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`,
        }}
      />
    </>
  );
}

function renderGTM(config: Record<string, unknown>) {
  const id = config.container_id as string;
  if (!id) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`,
      }}
    />
  );
}

function renderPostHog(config: Record<string, unknown>) {
  const apiKey = config.api_key as string;
  const host = (config.host as string) || "https://us.i.posthog.com";
  if (!apiKey) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('${apiKey}',{api_host:'${host}',person_profiles:'identified_only'});`,
      }}
    />
  );
}

function renderRybbit(config: Record<string, unknown>) {
  const siteId = config.site_id as string;
  const host = (config.host as string) || "https://app.rybbit.io";
  if (!siteId) return null;
  return (
    <script
      defer
      src={`${host}/api/script`}
      data-site-id={siteId}
    />
  );
}

function renderClarity(config: Record<string, unknown>) {
  const projectId = config.project_id as string;
  if (!projectId) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${projectId}");`,
      }}
    />
  );
}

function renderLinkedIn(config: Record<string, unknown>) {
  const partnerId = config.partner_id as string;
  if (!partnerId) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `_linkedin_partner_id="${partnerId}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s);})(window.lintrk);`,
      }}
    />
  );
}

function renderMetaPixel(config: Record<string, unknown>) {
  const pixelId = config.pixel_id as string;
  if (!pixelId) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
      }}
    />
  );
}

function renderCloudflare(config: Record<string, unknown>) {
  const token = config.beacon_token as string;
  if (!token) return null;
  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}

function renderCustom(config: Record<string, unknown>) {
  const src = config.script_url as string;
  const inline = config.inline_script as string;

  return (
    <>
      {src && typeof src === "string" && src.startsWith("https://") && (
        <script async src={src} />
      )}
      {inline && typeof inline === "string" && (
        <script dangerouslySetInnerHTML={{ __html: inline }} />
      )}
    </>
  );
}

const RENDERERS: Record<string, (config: Record<string, unknown>) => React.JSX.Element | null> = {
  ga4: renderGA4,
  gtm: renderGTM,
  posthog: renderPostHog,
  rybbit: renderRybbit,
  clarity: renderClarity,
  linkedin: renderLinkedIn,
  meta_pixel: renderMetaPixel,
  cloudflare: renderCloudflare,
  custom: renderCustom,
};

/**
 * Default scope for each provider when not explicitly set.
 * "all" = fires on every page (app + marketing)
 * "marketing" = fires only on public/marketing pages
 */
const DEFAULT_SCOPE: Record<string, TrackingScope> = {
  posthog: "all",
  clarity: "all",
  rybbit: "all",
  ga4: "marketing",
  gtm: "marketing",
  linkedin: "marketing",
  meta_pixel: "marketing",
  cloudflare: "marketing",
  custom: "marketing",
};

/**
 * Renders tracking scripts for enabled providers matching the given scope.
 *
 * @param client  - Supabase client for reading settings
 * @param scope   - Which providers to render:
 *                  "all"       = only providers scoped to every page (PostHog, Clarity, Rybbit)
 *                  "marketing" = only providers scoped to marketing pages (GA4, GTM, LinkedIn, etc.)
 *                  If omitted, renders ALL enabled providers (backward-compatible).
 */
export async function TrackingInjector({
  client,
  scope,
}: {
  client: SupabaseClient;
  scope?: TrackingScope;
}) {
  try {
    const providers = await getAnalyticsProviders(client);
    const filtered = providers.filter((p: ProviderEntry) => {
      if (!p.enabled) return false;
      if (!scope) return true; // no scope filter = render all
      const providerScope = (p.scope as TrackingScope) || DEFAULT_SCOPE[p.provider] || "marketing";
      return providerScope === scope;
    });
    if (filtered.length === 0) return null;

    return (
      <>
        {filtered.map((p: ProviderEntry, i: number) => {
          const render = RENDERERS[p.provider];
          if (!render) return null;
          return <span key={`${p.provider}-${i}`}>{render(p.config)}</span>;
        })}
      </>
    );
  } catch {
    return null;
  }
}
