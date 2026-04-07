import { getSetting } from "@/lib/data/site-settings";

export async function ThemeInjector() {
  try {
    const [themeOverrides, customCss, customCssUrls] = await Promise.all([
      getSetting("theme_overrides"),
      getSetting("custom_css"),
      getSetting("custom_css_urls"),
    ]);

    // Build :root CSS variable overrides
    const overrides =
      themeOverrides && typeof themeOverrides === "object" && !Array.isArray(themeOverrides)
        ? (themeOverrides as Record<string, string>)
        : {};
    const overrideEntries = Object.entries(overrides).filter(
      ([key, value]) => typeof key === "string" && typeof value === "string" && value.trim() !== ""
    );

    const rootCss =
      overrideEntries.length > 0
        ? `:root { ${overrideEntries.map(([k, v]) => `${k}: ${v};`).join(" ")} }`
        : "";

    // Raw custom CSS (stored as a JSON string primitive)
    const rawCss = typeof customCss === "string" ? customCss : "";

    // External CSS URLs (HTTPS only)
    const urls: string[] = Array.isArray(customCssUrls)
      ? (customCssUrls as string[]).filter(
          (u) => typeof u === "string" && u.startsWith("https://")
        )
      : [];

    return (
      <>
        {urls.map((url) => (
          <link key={url} rel="stylesheet" href={url} />
        ))}
        {rootCss && <style dangerouslySetInnerHTML={{ __html: rootCss }} />}
        {rawCss && <style dangerouslySetInnerHTML={{ __html: rawCss }} />}
      </>
    );
  } catch {
    return null;
  }
}
