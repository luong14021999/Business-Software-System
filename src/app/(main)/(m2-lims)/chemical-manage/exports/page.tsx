import { ChemList } from "@/components/m2/manage/chem-list";

export const dynamic = "force-dynamic";

export default async function ChemicalExportsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  return <ChemList kind="xuat" sp={await searchParams} />;
}
