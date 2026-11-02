import { notFound } from "next/navigation";
import { ChemMovePage } from "@/components/m2/manage/chem-move-page";
import { chemicalImportStore } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

export default async function EditChemicalImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const imp = (await chemicalImportStore.list()).find((x) => x.id === id);
  if (!imp) notFound();
  return <ChemMovePage kind="nhap" imp={imp} />;
}
