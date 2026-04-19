import { ModuleDetailPreview } from "../../_components/ModuleDetailPreview";

export default async function GroupAdminModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  return <ModuleDetailPreview layer="group-admin" moduleKey={module} />;
}
