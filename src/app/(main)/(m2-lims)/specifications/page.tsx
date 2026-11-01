import Link from "next/link";
import { LabPage, btn, link } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { sampleTypeStore, specLimitStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

export default async function SpecificationsPage() {
  const [specs, types, limits, access] = await Promise.all([specificationStore.list(), sampleTypeStore.list(), specLimitStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const fields: CrudField[] = [
    { name: "name", label: "Tên quy chuẩn", required: true, placeholder: "VD: QCVN 08:2023/BTNMT" },
    { name: "columnName", label: "Cột / mức áp dụng", placeholder: "VD: Bảng 2 – Mức B" },
    { name: "sampleTypeId", label: "Loại mẫu", type: "select", options: [{ value: "", label: "— Mọi loại mẫu —" }, ...types.map((t) => ({ value: t.id, label: t.name }))] },
    { name: "printName", label: "Tên cột khi in", placeholder: "Trống = dùng cột / mức áp dụng" },
    { name: "active", label: "Đang dùng", type: "bool", boolLabels: ["Đang dùng", "Ngừng dùng"], defaultValue: 1 },
    { name: "note", label: "Mô tả (giải thích tên quy chuẩn trên phiếu)", type: "textarea" },
    { name: "printNote", label: "Ghi chú khi in", placeholder: "VD: Kp = 0,9; Kq = 1", full: true },
  ];
  return (
    <LabPage
      title="Danh sách quy chuẩn"
      subtitle="Giới hạn của từng chỉ tiêu theo quy chuẩn; gắn quy chuẩn cho mẫu khi bóc tách để lưới kết quả báo Đạt / Vượt"
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/specifications" title="Thêm quy chuẩn" fields={fields} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="specifications"
        canWrite={canWrite}
        fields={fields}
        emptyText="Chưa có quy chuẩn – thêm quy chuẩn rồi nhập giới hạn cho từng chỉ tiêu"
        headers={["Tên", "Cột / mức", "Loại mẫu", "Số chỉ tiêu"]}
        rows={specs.sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({
          id: s.id,
          label: s.name,
          initial: s,
          cells: [
            <Link key="n" href={`/specifications/${s.id}`} className={link}>{s.name}</Link>,
            s.columnName || "—",
            typeName.get(s.sampleTypeId) ?? "Mọi loại mẫu",
            limits.filter((l) => l.specId === s.id).length,
          ],
          extra: <Link href={`/specifications/${s.id}`} className="text-xs text-[#337ab7] hover:underline">Chỉ tiêu</Link>,
        }))}
      />
    </LabPage>
  );
}
