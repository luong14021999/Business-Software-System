import { notFound } from "next/navigation";
import { MappingPage } from "@/components/m2/settings/mapping-page";
import { analyteMappingStore } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

export default async function EditMappingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = (await analyteMappingStore.list()).find((x) => x.id === id);
  if (!m) notFound();
  const { id: _id, ...initial } = m;
  void _id;
  return <MappingPage id={id} initial={initial} />;
}
