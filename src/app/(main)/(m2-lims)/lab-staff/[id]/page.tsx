import { notFound } from "next/navigation";
import { StaffPage } from "@/components/m2/settings/staff-page";
import { staffStore } from "@/lib/modules/m2/data/staff";

export const dynamic = "force-dynamic";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await staffStore.list()).find((x) => x.id === id);
  if (!s) notFound();
  return <StaffPage s={s} />;
}
