import { ModuleDetailPreview } from "../../_components/ModuleDetailPreview";

export default async function AppAdminModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  return <ModuleDetailPreview layer="app-admin" moduleKey={module} />;
}
