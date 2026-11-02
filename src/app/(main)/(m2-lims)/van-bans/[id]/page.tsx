import { notFound } from "next/navigation";
import { VanBanPage } from "@/components/m2/manage/van-ban-page";
import { vanBanStore } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

export default async function EditVanBanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = (await vanBanStore.list()).find((d) => d.id === id);
  if (!doc) notFound();
  return <VanBanPage doc={doc} />;
}
