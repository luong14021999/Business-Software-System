import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { BatchEditForm } from "@/components/m2/batches/batch-ui";
import { testBatchStore } from "@/lib/modules/m2/data/orders";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { staffStore } from "@/lib/modules/m2/data/staff";

export const dynamic = "force-dynamic";

/** Sửa mẻ thử nghiệm (Thông tin, Thiết bị phân tích, Hoá chất). */
export default async function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [batches, staff, equipment, chemicals] = await Promise.all([testBatchStore.list(), staffStore.list(), equipmentStore.list(), chemicalsStore.list()]);
  const batch = batches.find((b) => b.id === id);
  if (!batch) notFound();
  return (
    <LabPage title="Sửa bản ghi" subtitle={<span className="text-lg text-[#333]">Thông tin mẻ thử nghiệm {batch.code}</span>}>
      <BatchEditForm
        batch={batch}
        staff={staff.map((s) => s.fullName).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"))}
        instruments={equipment.map((e) => `${e.code} · ${e.name}`).sort()}
        chemicals={chemicals.map((c) => c.name).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"))}
      />
    </LabPage>
  );
}
