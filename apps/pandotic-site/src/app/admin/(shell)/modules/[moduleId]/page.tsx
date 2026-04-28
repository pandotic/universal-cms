import { ModulePreviewPanel } from "@pandotic/universal-cms/components/admin";
import { listAdminModuleIds } from "@pandotic/universal-cms/admin/modules";
import { HUB_PROPERTY_MODULES_URL } from "@/cms.config";

// Static export needs the full set of module ids known up front so each
// preview page becomes a pre-rendered HTML file.
export function generateStaticParams() {
  return listAdminModuleIds().map((moduleId) => ({ moduleId }));
}

export default async function ModulePreviewPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  return (
    <ModulePreviewPanel
      moduleId={moduleId}
      siteName="Pandotic"
      hubModulesUrl={HUB_PROPERTY_MODULES_URL}
    />
  );
}
