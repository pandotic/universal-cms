import { ModuleDetailPreview } from "../../_components/ModuleDetailPreview";

export default async function MarketingCmsModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  return <ModuleDetailPreview layer="marketing-cms" moduleKey={module} />;
}
