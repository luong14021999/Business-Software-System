"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XInput, XRow, type XFormField } from "@/components/m2/lab-ui/x-form";
import { XSaveBar } from "@/components/m2/lab-ui/x-save";
import { toast } from "@/components/ui/toast";
import { STAFF_DENIALS, STAFF_ROLES } from "@/lib/modules/m2/staff-access";

type Opt = { value: string; label: string };
export type StaffValue = { salutation: string; fullName: string; position: string; departmentId: string; phone: string; phone2: string; signFor: string; email: string; collaborator: boolean };

/**
 * Nhân viên như XaLab: tab Thông tin chính, Vai trò (vai trò đăng nhập), Các quyền cụ thể (chặn riêng).
 * Hai tab sau chỉ Quản trị sửa được và cần nhân viên có email đăng nhập.
 */
export function StaffForm({ id, initial, roles, deny, departments, canWrite, canAdmin }: { id?: string; initial: StaffValue; roles: string[]; deny: string[]; departments: Opt[]; canWrite: boolean; canAdmin: boolean }) {
  const [tab, setTab] = useState<"info" | "roles" | "perm">("info");
  const [v, setV] = useState(initial);
  const [r, setR] = useState(new Set(roles));
  const [d, setD] = useState(new Set(deny));
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const fields: XFormField[] = [
    { name: "salutation", label: "Ông/bà", type: "select", options: ["Ông", "Bà"].map((x) => ({ value: x, label: x })), empty: "" },
    { name: "fullName", label: "Họ và tên", required: true },
    { name: "position", label: "Chức danh" },
    { name: "departmentId", label: "Phòng ban/Chi nhánh", type: "select", options: departments, empty: "Chọn phòng ban/chi nhánh" },
    { name: "phone", label: "Số điện thoại" },
    { name: "phone2", label: "Số điện thoại 2" },
    { name: "signFor", label: "Ký Thay" },
    { name: "email", label: "Email" },
    { name: "collaborator", label: "Cộng tác viên (không tạo tài khoản)", type: "checkbox" },
  ];
  const accessChanged = roles.join(",") !== [...r].join(",") || deny.slice().sort().join(",") !== [...d].sort().join(",");
  async function save(exit: boolean) {
    if (!v.fullName.trim()) return toast.error("Nhập họ và tên");
    setBusy(exit ? "exit" : "save");
    const dept = departments.find((x) => x.value === v.departmentId)?.label;
    const res = await fetch(id ? `/api/staff/${id}` : "/api/staff", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, ...(dept ? { department: dept } : {}) }) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(null);
      return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    }
    const sid = id ?? b.item?.id;
    if (canAdmin && accessChanged && sid && !v.collaborator) {
      const a = await fetch(`/api/lab-staff/${sid}/access`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roles: [...r], deny: [...d] }) });
      const ab = await a.json().catch(() => ({}));
      if (!a.ok) {
        setBusy(null);
        return toast.error("Đã lưu thông tin, chưa lưu được vai trò / quyền", ab.error ?? `HTTP ${a.status}`);
      }
    }
    setBusy(null);
    toast.success("Đã lưu nhân viên");
    if (exit) return start(() => router.push("/lab-staff"));
    if (!id && sid) return start(() => router.replace(`/lab-staff/${sid}`));
    start(() => router.refresh());
  }
  const tabCls = (on: boolean) => `-mb-px block rounded-t border px-[15px] py-[10px] text-sm ${on ? "border-[#ddd] border-b-transparent bg-[linear-gradient(#f5fafd,#e8f3fa)] text-[#333]" : "border-transparent text-[#337ab7] hover:bg-[#eee]"}`;
  const toggle = (set: typeof setR, key: string) => set((x) => { const n = new Set(x); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  return (
    <div className="space-y-[15px]">
      <div className="flex border-b border-[#ddd]">
        <button type="button" className={tabCls(tab === "info")} onClick={() => setTab("info")}>Thông tin chính</button>
        <button type="button" className={tabCls(tab === "roles")} onClick={() => setTab("roles")}>Vai trò</button>
        <button type="button" className={tabCls(tab === "perm")} onClick={() => setTab("perm")}>Các quyền cụ thể</button>
      </div>
      {tab === "info" && (
        <fieldset disabled={!canWrite} className="space-y-[15px]">
          {fields.map((f) => (
            <XRow key={f.name} label={f.label}>
              <XInput f={f} value={v[f.name as keyof StaffValue]} onChange={(x) => setV((s) => ({ ...s, [f.name]: x }))} />
            </XRow>
          ))}
        </fieldset>
      )}
      {tab !== "info" && (
        <fieldset disabled={!canAdmin || v.collaborator} className="space-y-2">
          {!canAdmin && <p className="text-sm text-[#8a6d3b]">Chỉ Quản trị đổi được vai trò và quyền của nhân viên.</p>}
          {v.collaborator && <p className="text-sm text-[#8a6d3b]">Cộng tác viên không có tài khoản đăng nhập.</p>}
          {(tab === "roles" ? STAFF_ROLES.map((x) => ({ key: x.role as string, label: x.label })) : STAFF_DENIALS).map((x) => (
            <label key={x.key} className="flex items-center gap-2 text-sm sm:pl-[195px]">
              <input type="checkbox" checked={(tab === "roles" ? r : d).has(x.key)} onChange={() => toggle(tab === "roles" ? setR : setD, x.key)} className="h-4 w-4" />
              {x.label}
            </label>
          ))}
        </fieldset>
      )}
      <hr className="border-[#eee]" />
      <XSaveBar backHref="/lab-staff" canWrite={canWrite} busy={busy} save={(exit) => void save(exit)} />
    </div>
  );
}
