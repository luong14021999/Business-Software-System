"use client";

import { useMemo, useState } from "react";
import { XInput, XRow, type XFormField } from "@/components/m2/lab-ui/x-form";
import { XSaveBar, useXSave } from "@/components/m2/lab-ui/x-save";
import { input, table } from "@/components/m2/lab-ui/page";
import { normalizeVi } from "@/lib/platform/format";

type Eq = { id: string; code: string; name: string; inStock: boolean };
type Opt = { value: string; label: string };

/** Phiếu nhập / xuất kho thiết bị: thông tin phiếu + chọn thiết bị bằng ô tích (xuất kho chỉ chọn thiết bị đang ở kho). */
export function MoveForm({ kind, id, initial, selected, equipment, orders, staff, canWrite }: { kind: "nhap" | "xuat"; id?: string; initial: Record<string, unknown>; selected: string[]; equipment: Eq[]; orders: Opt[]; staff: Opt[]; canWrite: boolean }) {
  const [values, setValues] = useState(initial);
  const [picked, setPicked] = useState(new Set(selected));
  const [q, setQ] = useState("");
  const fields: XFormField[] = [
    { name: "movedAt", label: kind === "xuat" ? "Ngày xuất kho" : "Ngày nhập kho", type: "date", required: true },
    ...(kind === "xuat" ? [{ name: "orderId", label: "Đơn hàng", type: "select" as const, options: orders, empty: "" }] : []),
    { name: "deliverer", label: "Người giao", type: "select", options: staff, empty: "" },
    { name: "receiver", label: "Người nhận", type: "select", options: staff, empty: "" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const back = `/instrument-manage/moves?kind=${kind}`;
  const { busy, save } = useXSave({
    endpoint: "/api/instrument-moves",
    id,
    backHref: back,
    editBase: "/instrument-manage/moves",
    payload: () => {
      if (!String(values.movedAt ?? "")) return "Nhập ngày";
      if (!picked.size) return "Chọn ít nhất một thiết bị";
      return { kind, movedAt: values.movedAt, orderId: values.orderId ?? "", deliverer: values.deliverer ?? "", receiver: values.receiver ?? "", note: values.note ?? "", equipmentIds: [...picked] };
    },
  });
  // Xuất kho: chỉ thiết bị đang ở kho hoặc đã nằm trong phiếu này; nhập kho: thiết bị đã xuất hoặc trong phiếu này, kèm thiết bị mới chưa từng nhập.
  const shown = useMemo(() => {
    const k = normalizeVi(q);
    return equipment.filter((e) => (kind === "xuat" ? e.inStock || selected.includes(e.id) : true)).filter((e) => !k || normalizeVi(`${e.code} ${e.name}`).includes(k));
  }, [equipment, kind, q, selected]);
  const toggle = (eid: string) => setPicked((s) => { const n = new Set(s); if (n.has(eid)) n.delete(eid); else n.add(eid); return n; });
  return (
    <div className="space-y-[15px]">
      <fieldset disabled={!canWrite} className="space-y-[15px]">
        {fields.map((f) => (
          <XRow key={f.name} label={f.label} top={f.type === "textarea"}>
            <XInput f={f} value={values[f.name]} onChange={(v) => setValues((x) => ({ ...x, [f.name]: v }))} />
          </XRow>
        ))}
        <h3 className="pt-2 text-lg">Thiết bị ({picked.size} đã chọn)</h3>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã / tên thiết bị..." aria-label="Tìm thiết bị" className={`${input} sm:!w-72`} />
        <div className="max-h-[420px] overflow-y-auto">
          <table className={table}>
            <thead><tr><th className="w-10" /><th>Mã thiết bị</th><th>Tên</th><th>Tồn kho</th></tr></thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id} className="cursor-pointer" onClick={() => toggle(e.id)}>
                  <td><input type="checkbox" checked={picked.has(e.id)} onChange={() => toggle(e.id)} onClick={(ev) => ev.stopPropagation()} aria-label={`Chọn ${e.code}`} /></td>
                  <td>{e.code}</td><td>{e.name}</td><td>{e.inStock ? "Trong kho" : "Đã xuất kho"}</td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Không có thiết bị phù hợp</td></tr>}
            </tbody>
          </table>
        </div>
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref={back} canWrite={canWrite} busy={busy} save={save} />
    </div>
  );
}
