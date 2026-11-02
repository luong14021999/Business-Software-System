import { notFound } from "next/navigation";
import { MovePage } from "@/components/m2/manage/move-page";
import { instrumentMoveStore } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

export default async function EditMovePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const move = (await instrumentMoveStore.list()).find((m) => m.id === id);
  if (!move) notFound();
  return <MovePage kind={move.kind} move={move} />;
}
