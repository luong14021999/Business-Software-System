import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn, link } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { FillRate } from "@/components/m2/settings/fill-rate";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { rateItemStore, rateListStore, type RateKind } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtVND } from "@/lib/platform/format";

const META: Record<RateKind, { base: string; list: string; one: string; hint: string; amount: string }> = {
  price: { base: "/price-lists", list: "Danh sách bảng giá", one: "bảng giá", hint: "Giá bán theo chỉ tiêu và loại mẫu; chọn bảng giá ở trang Báo giá của đơn hàng", amount: "Giá bán (đ/mẫu)" },
  norm: { base: "/norm-lists", list: "Danh sách bảng định mức", one: "bảng định mức", hint: "Đơn giá định mức theo chỉ tiêu (theo văn bản định mức kinh tế – kỹ thuật); dùng cho Thống kê định mức", amount: "Đơn giá định mức (đ/mẫu)" },
};

/** Danh sách bảng giá / bảng định mức. */
export async function RateListsPage({ kind }: { kind: RateKind }) {
  const m = META[kind];
  const [lists, items, access] = await Promise.all([rateListStore.list(), rateItemStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  const fields: CrudField[] = [
    { name: "name", label: "Tên", required: true, full: true, placeholder: kind === "price" ? "VD: Bảng giá dịch vụ 2026" : "VD: Định mức theo Thông tư … " },
    { name: "active", label: "Đang dùng", type: "bool", boolLabels: ["Đang dùng", "Ngừng dùng"], defaultValue: 1 },
    { name: "note", label: "Ghi chú / căn cứ", type: "textarea" },
  ];
  return (
    <LabPage
      title={m.list}
      subtitle={m.hint}
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/rate-lists" title={`Thêm ${m.one}`} fields={[...fields, { name: "kind", label: "Loại", type: "select", options: [{ value: kind, label: m.one }], defaultValue: kind }]} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="rate-lists"
        canWrite={canWrite}
        fields={fields}
        emptyText={`Chưa có ${m.one}`}
        headers={["Tên", "Số chỉ tiêu", "Ghi chú"]}
        rows={lists.filter((l) => l.kind === kind).sort((a, b) => a.name.localeCompare(b.name)).map((l) => ({
          id: l.id,
          label: l.name,
          initial: l,
          cells: [<Link key="n" href={`${m.base}/${l.id}`} className={`${link} ${l.active ? "" : "line-through"}`}>{l.name}</Link>, items.filter((i) => i.listId === l.id).length, l.note],
          extra: <Link href={`${m.base}/${l.id}`} className="text-xs text-[#337ab7] hover:underline">Chỉ tiêu</Link>,
        }))}
      />
    </LabPage>
  );
}

/** Các dòng của một bảng giá / định mức. */
export async function RateListPage({ kind, id, typeFilter }: { kind: RateKind; id: string; typeFilter?: string }) {
  const m = META[kind];
  const [lists, items, types, analytes, access] = await Promise.all([rateListStore.list(), rateItemStore.list(), sampleTypeStore.list(), analyteStore.list(), currentAccess()]);
  const list = lists.find((l) => l.id === id && l.kind === kind);
  if (!list) notFound();
  const canWrite = access.can("write.quality");
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const fields: CrudField[] = [
    { name: "sampleTypeId", label: "Loại mẫu", type: "select", required: true, options: types.map((t) => ({ value: t.id, label: t.name })) },
    { name: "analyte", label: "Chỉ tiêu", required: true, full: true, type: "select", options: [...new Set(analytes.map((a) => a.name))].sort() },
    { name: "amount", label: m.amount, type: "number" },
    ...(kind === "price" ? ([{ name: "cost", label: "Giá vốn (đ/mẫu)", type: "number", nullable: true }] as CrudField[]) : []),
  ];
  const mine = items
    .filter((i) => i.listId === id && (!typeFilter || i.sampleTypeId === typeFilter))
    .sort((a, b) => (typeName.get(a.sampleTypeId) ?? "").localeCompare(typeName.get(b.sampleTypeId) ?? "") || a.analyte.localeCompare(b.analyte));
  return (
    <LabPage
      title={`Chỉ tiêu của ${m.one} ${list.name}`}
      subtitle={list.note}
      toolbar={
        <>
          <Link href={m.base} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          {canWrite && (
            <>
              <EntityFormDialog mode="add" endpoint="/api/rate-items" title="Thêm chỉ tiêu" fields={[...fields, { name: "listId", label: "Bảng", type: "select", options: [{ value: id, label: list.name }], defaultValue: id }]} trigger={<button type="button" className={btn}>Thêm chỉ tiêu +</button>} />
              <FillRate listId={id} types={types.filter((t) => t.active).map((t) => ({ id: t.id, name: t.name }))} />
            </>
          )}
          <span className="text-sm text-muted-foreground">Lọc:</span>
          {[{ id: "", name: "Tất cả" }, ...types].map((t) => (
            <Link key={t.id || "all"} href={`${m.base}/${id}${t.id ? `?type=${t.id}` : ""}`} className={`text-sm ${(typeFilter ?? "") === t.id ? "font-semibold text-[#333]" : "text-[#337ab7] hover:underline"}`}>{t.name}</Link>
          ))}
        </>
      }
    >
      <CatalogTable
        entity="rate-items"
        canWrite={canWrite}
        fields={fields}
        emptyText="Chưa có chỉ tiêu – dùng “Nạp chỉ tiêu của loại mẫu” để thêm nhanh"
        headers={kind === "price" ? ["Loại mẫu", "Chỉ tiêu", m.amount, "Giá vốn", "Lãi gộp"] : ["Loại mẫu", "Chỉ tiêu", m.amount]}
        rows={mine.map((i) => ({
          id: i.id,
          label: i.analyte,
          initial: i,
          cells: [
            typeName.get(i.sampleTypeId) ?? "—",
            i.analyte,
            <span key="a" className={i.amount ? "" : "text-[#a94442]"}>{fmtVND(i.amount)}</span>,
            ...(kind === "price" ? [i.cost != null ? fmtVND(i.cost) : "—", i.cost != null && i.amount ? `${Math.round(((i.amount - i.cost) / i.amount) * 100)}%` : "—"] : []),
          ],
        }))}
      />
    </LabPage>
  );
}
