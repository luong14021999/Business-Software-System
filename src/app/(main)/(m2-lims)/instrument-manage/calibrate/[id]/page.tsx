import { notFound } from "next/navigation";
import { LabPage, table } from "@/components/m2/lab-ui/page";
import { XForm, type XFormField } from "@/components/m2/lab-ui/x-form";
import { instrumentRows } from "@/lib/modules/m2/data/manage";
import { calibrationLogStore } from "@/lib/modules/m2/data/calibration-logs";
import { calibrationUnitStore } from "@/lib/modules/m2/data/catalogs";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { EQUIPMENT_CONDITIONS } from "@/lib/modules/m2/data/manage";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));

/** Cập nhật hiệu chuẩn một thiết bị (nội bộ + định kỳ) và lịch sử các lần trước. */
export default async function CalibratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rows, logs, units, staff, access] = await Promise.all([instrumentRows(), calibrationLogStore.list(), calibrationUnitStore.list(), staffStore.list(), currentAccess()]);
  const e = rows.find((r) => r.id === id);
  if (!e) notFound();
  const history = logs.filter((l) => l.equipmentId === id).sort((a, b) => (b.date || b.internalDate || "").localeCompare(a.date || a.internalDate || ""));
  const fields: XFormField[] = [
    { name: "internalDate", label: "Hiệu chuẩn nội bộ", type: "date" },
    { name: "internalBy", label: "Người thực hiện", type: "select", empty: "", options: opt(staff.map((s) => s.fullName).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"))) },
    { name: "date", label: "Hiệu chuẩn định kỳ", type: "date" },
    { name: "place", label: "Đơn vị hiệu chuẩn", type: "select", empty: "", options: opt(units.map((u) => u.name).sort((a, b) => a.localeCompare(b, "vi"))) },
    { name: "certificate", label: "Số giấy chứng nhận" },
    { name: "condition", label: "Tình trạng", type: "select", options: opt([...EQUIPMENT_CONDITIONS]) },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  return (
    <LabPage title={`Hiệu chuẩn thiết bị ${e.code}`} subtitle={<span className="text-lg text-[#333]">{e.name}{e.typeName ? ` – ${e.typeName}` : ""}</span>}>
      <XForm
        fields={fields}
        initial={{ internalDate: "", internalBy: "", date: todayISO(), place: e.calibrationUnit, certificate: "", condition: e.condition || "Không rõ", note: "" }}
        endpoint="/api/instrument-calibrations"
        extra={{ equipmentId: e.id }}
        backHref="/instrument-manage"
        canWrite={access.can("write.lab")}
      />
      <h3 className="mb-2 mt-8 text-xl">Lịch sử hiệu chuẩn</h3>
      <table className={table}>
        <thead><tr><th>Ngày hiệu chuẩn nội bộ</th><th>Người thực hiện</th><th>Ngày hiệu chuẩn định kỳ</th><th>Đơn vị thực hiện</th><th>Số giấy chứng nhận</th><th>Tình trạng</th><th>Ghi chú</th></tr></thead>
        <tbody>
          {history.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Chưa có lần hiệu chuẩn nào</td></tr>}
          {history.map((l) => (
            <tr key={l.id}><td>{fmtDateVN(l.internalDate)}</td><td>{l.internalBy}</td><td>{fmtDateVN(l.date)}</td><td>{l.place}</td><td>{l.certificate}</td><td>{l.condition}</td><td>{l.note}</td></tr>
          ))}
        </tbody>
      </table>
    </LabPage>
  );
}
