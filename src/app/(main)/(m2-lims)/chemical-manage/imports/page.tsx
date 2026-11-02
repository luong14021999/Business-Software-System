import { ChemList } from "@/components/m2/manage/chem-list";

export const dynamic = "force-dynamic";

export default async function ChemicalImportsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  return <ChemList kind="nhap" sp={await searchParams} />;
}
