import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn, table } from "@/components/m2/lab-ui/page";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { listChanges } from "@/lib/platform/data/change-log";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Thao tác coi là quan trọng (đánh dấu ở cột "Quan trọng" như XaLab). */
const IMPORTANT = /xoá|xóa|hủy|huỷ|duyệt|trả lại|thanh lý|phân công|bóc tách/i;

/** Tên trường của đơn hàng khi hiện trong lịch sử. */
const FIELD: Record<string, string> = {
  name: "Tên", kind: "Loại đơn hàng", customerId: "Khách hàng", contactId: "Liên lạc", contact: "Liên lạc", locationId: "Địa điểm", location: "Địa điểm",
  contractId: "Hợp đồng", contractNo: "Hợp đồng", requestingUnitId: "Đơn vị yêu cầu quan trắc", requestingUnit: "Đơn vị yêu cầu quan trắc",
  fieldAt: "Ngày quan trắc", receivedAt: "Ngày nhận mẫu", dueAt: "Ngày trả kết quả", internalDueAt: "Ngày trả kết quả nội bộ", deliveredAt: "Ngày trả kết quả thực tế",
  disposeAt: "Ngày hủy mẫu", salesStaff: "Phụ trách kinh doanh", fieldStaff: "Phụ trách quan trắc", signer: "Người ký phiếu kết quả", qaStaff: "Cán bộ QA/QC",
  deliveryMethod: "Hình thức trả kết quả", reportNo: "Số phiếu kết quả Tiếng Việt", reportNoEn: "Số phiếu kết quả Tiếng Anh", reportNoKind: "Loại số phiếu",
  deliveryCount: "Lần trả kết quả", status: "Trạng thái", note: "Mô tả", growingAreaCode: "Mã vùng trồng", packingFacilityCode: "Mã cơ sở đóng gói",
  vehiclePlate: "Biển số xe", trailerPlate: "Biển số Rmooc", containerNo: "Mã số container", sealNo: "Mã số niêm phong", showFieldTime: "Hiển thị giờ quan trắc",
  hideRequests: "Ẩn tất cả các yêu cầu", activityReport: "Báo cáo hoạt động thử nghiệm", industryId: "Ngành công nghiệp", departmentId: "Phòng ban/Chi nhánh",
  compareOrderIds: "Đơn hàng so sánh", amount: "Giá trị đơn hàng", discountPct: "Giảm giá %", vatRate: "Thuế GTGT %", quoteNo: "Số báo giá", priceListId: "Bảng giá",
};
const shown = (v: string) => (v === "true" ? "có" : v === "false" ? "không" : v || "(trống)");

/** Lịch sử thay đổi của đơn hàng: Ngày · Người dùng · Nội dung · Quan trọng. */
export default async function OrderHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = (await orderStore.list()).find((o) => o.id === id);
  if (!order) notFound();
  const rows = await listChanges({ entity: "orders", entityId: id, limit: 500 });
  return (
    <LabPage title="Lịch sử thay đổi" subtitle={`Đơn hàng ${order.code} · ${order.name}`} rule={false} toolbar={<Link href={`/orders/${id}`} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>}>
      <table className={table}>
        <thead><tr><th className="w-40">Ngày</th><th className="w-48">Người dùng</th><th>Nội dung</th><th className="w-24">Quan trọng</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Chưa có thay đổi nào</td></tr>}
          {rows.map((r) => {
            const content = [r.action, ...r.changes.map((c) => `${FIELD[c.field] ?? c.field}: ${shown(c.new)}`)].join("; ");
            return (
              <tr key={r.id}>
                <td className="whitespace-nowrap">{fmtDateTimeVN(r.at)}</td>
                <td>{r.actor}</td>
                <td className="break-words">{content}</td>
                <td className="text-center">{IMPORTANT.test(content) ? "✓" : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </LabPage>
  );
}
