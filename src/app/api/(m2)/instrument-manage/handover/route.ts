import { signedIn } from "@/lib/platform/data/access";
import { moveLines } from "@/lib/modules/m2/data/manage";
import { fmtDateVN } from "@/lib/platform/dates";
import { csvResponse } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Sổ giao nhận thiết bị (CSV): mỗi thiết bị của mỗi lần nhập / xuất kho trong khoảng ngày, chừa cột ký nhận. */
export async function GET(req: Request) {
  const denied = await signedIn();
  if (denied) return denied;
  const p = new URL(req.url).searchParams;
  const from = p.get("from") ?? "";
  const to = p.get("to") ?? "";
  const rows = (await moveLines(from, to)).map((r) => [
    fmtDateVN(r.moved_at as string),
    r.kind === "xuat" ? "Xuất kho" : "Nhập kho",
    r.code as string,
    r.name as string,
    (r.order_code as string) ?? "",
    (r.deliverer as string) ?? "",
    (r.receiver as string) ?? "",
    (r.note as string) ?? "",
    "",
  ]);
  return csvResponse(`so-giao-nhan-thiet-bi_${from}_${to}`, `Sổ giao nhận thiết bị – từ ${from || "…"} đến ${to || "…"}`, ["Ngày", "Loại", "Mã thiết bị", "Tên thiết bị", "Đơn hàng", "Người giao", "Người nhận", "Ghi chú", "Ký nhận"], rows);
}
