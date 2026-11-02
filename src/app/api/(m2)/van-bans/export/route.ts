import { signedIn } from "@/lib/platform/data/access";
import { vanBanStore } from "@/lib/modules/m2/data/manage";
import { fmtDateVN } from "@/lib/platform/dates";
import { csvResponse } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Xuất danh sách hồ sơ (CSV). */
export async function GET() {
  const denied = await signedIn();
  if (denied) return denied;
  const docs = (await vanBanStore.list()).sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || ""));
  return csvResponse("danh-sach-ho-so", "Danh sách hồ sơ", ["Số văn bản", "Ngày ban hành", "Cơ quan ban hành", "Trích yếu", "Ghi chú", "Nhân viên được giao", "File đính kèm", "Trạng thái"],
    docs.map((d) => [d.number, fmtDateVN(d.issuedAt), d.issuer, d.summary, d.note, d.assignees.join(", "), d.fileName, d.active ? "Đang dùng" : "Ngừng dùng"]));
}
