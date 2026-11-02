import { notFound } from "next/navigation";
import { BulkTemplatePage } from "@/components/m2/settings/bulk-template-page";
import { bulkTemplateStore } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

export default async function EditBulkTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tpl = (await bulkTemplateStore.list()).find((t) => t.id === id);
  if (!tpl) notFound();
  return <BulkTemplatePage tpl={tpl} />;
}
