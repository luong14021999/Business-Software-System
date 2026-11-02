import { notFound } from "next/navigation";
import { BatchTemplatePage } from "@/components/m2/settings/batch-template-page";
import { batchTemplateStore } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

export default async function EditBatchTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tpl = (await batchTemplateStore.list()).find((t) => t.id === id);
  if (!tpl) notFound();
  return <BatchTemplatePage tpl={tpl} />;
}
