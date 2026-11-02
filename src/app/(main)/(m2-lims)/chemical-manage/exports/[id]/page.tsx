import { notFound } from "next/navigation";
import { ChemMovePage } from "@/components/m2/manage/chem-move-page";
import { chemicalExportStore } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

export default async function EditChemicalExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exp = (await chemicalExportStore.list()).find((x) => x.id === id);
  if (!exp) notFound();
  return <ChemMovePage kind="xuat" exp={exp} />;
}
