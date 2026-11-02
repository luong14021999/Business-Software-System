import { LabPage } from "@/components/m2/lab-ui/page";
import { ChemMoveForm } from "@/components/m2/manage/chem-move-form";
import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { chemicalLots, exportItems, importItems, type ChemicalExport, type ChemicalImport } from "@/lib/modules/m2/data/manage";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

const num = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });

/** Trang thêm / sửa lô nhập kho hoặc phiếu xuất kho hóa chất. */
export async function ChemMovePage({ kind, imp, exp }: { kind: "nhap" | "xuat"; imp?: ChemicalImport; exp?: ChemicalExport }) {
  const [staff, access] = await Promise.all([staffStore.list(), currentAccess()]);
  const names = staff.map((s) => s.fullName).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")).map((n) => ({ value: n, label: n }));
  const canWrite = access.can("write.lab");
  if (kind === "nhap") {
    const [chemicals, items] = await Promise.all([chemicalsStore.list(), imp ? importItems(imp.id) : Promise.resolve([])]);
    return (
      <LabPage title={imp ? `Lô hàng ${imp.name}` : "Tạo mới"} subtitle={<span className="text-lg text-[#333]">Thông tin lô hàng</span>}>
        <ChemMoveForm
          kind="nhap"
          id={imp?.id}
          initial={{ name: imp?.name ?? "", date: imp?.importedAt.slice(0, 10) || todayISO(), deliverer: imp?.deliverer ?? "", receiver: imp?.receiver ?? "", note: imp?.note ?? "" }}
          lines={items.map((i) => ({ id: i.id, ref: i.chemicalId, qty: String(i.qty), extra: i.expiry ?? "", min: i.used || undefined }))}
          chemicals={chemicals.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((c) => ({ value: c.id, label: c.name, unit: c.unit }))}
          staff={names}
          canWrite={canWrite}
        />
      </LabPage>
    );
  }
  const [lots, items] = await Promise.all([chemicalLots(), exp ? exportItems(exp.id) : Promise.resolve([])]);
  const mine = new Set(items.map((i) => i.importItemId));
  return (
    <LabPage title={exp ? `Xuất kho ngày ${fmtDateVN(exp.exportedAt)}` : "Tạo mới"} subtitle={<span className="text-lg text-[#333]">Thông tin xuất kho</span>}>
      <ChemMoveForm
        kind="xuat"
        id={exp?.id}
        initial={{ date: exp?.exportedAt.slice(0, 10) || todayISO(), deliverer: exp?.deliverer ?? "", receiver: exp?.receiver ?? "", note: exp?.note ?? "" }}
        lines={items.map((i) => ({ ref: i.importItemId, qty: String(i.qty), extra: i.purpose }))}
        lots={lots
          .filter((l) => mine.has(l.id) || (!l.disposed && l.remaining > 0))
          .map((l) => ({ value: l.id, label: `${l.chemical} – lô ${l.lotName} (còn ${num(l.remaining)} ${l.unit}${l.expiry ? `, HSD ${fmtDateVN(l.expiry)}` : ""})`, unit: l.unit, left: l.remaining }))}
        staff={names}
        canWrite={canWrite}
      />
    </LabPage>
  );
}
