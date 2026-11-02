import { MovePage } from "@/components/m2/manage/move-page";

export const dynamic = "force-dynamic";

export default async function NewMovePage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  return <MovePage kind={(await searchParams).kind === "xuat" ? "xuat" : "nhap"} />;
}
