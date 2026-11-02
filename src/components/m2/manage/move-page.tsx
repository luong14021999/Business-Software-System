import { LabPage } from "@/components/m2/lab-ui/page";
import { MoveForm } from "@/components/m2/manage/move-form";
import { instrumentRows, moveItems, type InstrumentMove } from "@/lib/modules/m2/data/manage";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { currentAccess } from "@/lib/platform/data/access";
import { todayISO } from "@/lib/platform/dates";

/** Trang thêm / sửa phiếu nhập – xuất kho thiết bị. */
export async function MovePage({ kind, move }: { kind: "nhap" | "xuat"; move?: InstrumentMove }) {
  const [rows, orders, staff, access, selected] = await Promise.all([instrumentRows(), orderStore.list(), staffStore.list(), currentAccess(), move ? moveItems(move.id) : Promise.resolve([])]);
  const names = staff.map((s) => s.fullName).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")).map((n) => ({ value: n, label: n }));
  return (
    <LabPage title={move ? `${kind === "xuat" ? "Xuất kho" : "Nhập kho"} thiết bị #${move.id.slice(0, 8)}` : "Tạo mới"} subtitle={<span className="text-lg text-[#333]">{kind === "xuat" ? "Thông tin xuất kho thiết bị" : "Thông tin nhập kho thiết bị"}</span>}>
      <MoveForm
        kind={kind}
        id={move?.id}
        initial={{ movedAt: move?.movedAt.slice(0, 10) || todayISO(), orderId: move?.orderId ?? "", deliverer: move?.deliverer ?? "", receiver: move?.receiver ?? "", note: move?.note ?? "" }}
        selected={selected}
        equipment={rows.filter((e) => e.active !== false || selected.includes(e.id)).map((e) => ({ id: e.id, code: e.code, name: e.name, inStock: e.inStock }))}
        orders={orders.filter((o) => o.status !== "Hủy").sort((a, b) => b.code.localeCompare(a.code, undefined, { numeric: true })).map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` }))}
        staff={names}
        canWrite={access.can("write.lab")}
      />
    </LabPage>
  );
}
