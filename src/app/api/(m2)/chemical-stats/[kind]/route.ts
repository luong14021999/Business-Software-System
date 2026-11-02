import { NextResponse } from "next/server";
import { signedIn } from "@/lib/platform/data/access";
import { chemicalMoveLines } from "@/lib/modules/m2/data/manage";
import { fmtDateVN } from "@/lib/platform/dates";
import { csvResponse } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Thống kê nhập kho / sử dụng (xuất kho) hóa chất ra CSV theo khoảng ngày và hóa chất. */
export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const denied = await signedIn();
  if (denied) return denied;
  const { kind } = await params;
  if (kind !== "nhap-kho" && kind !== "su-dung") return NextResponse.json({ error: "Không có thống kê này" }, { status: 404 });
  const p = new URL(req.url).searchParams;
  const from = p.get("from") ?? "";
  const to = p.get("to") ?? "";
  const lines = await chemicalMoveLines(kind === "nhap-kho" ? "nhap" : "xuat", from, to, p.get("chemical") ?? "");
  const range = `từ ${from || "…"} đến ${to || "…"}`;
  if (kind === "nhap-kho") {
    return csvResponse(`thong-ke-nhap-kho-hoa-chat_${from}_${to}`, `Thống kê nhập kho hóa chất – ${range}`, ["Ngày nhập kho", "Lô hàng", "Hóa chất", "Lượng", "Đơn vị", "Ngày hết hạn", "Người giao", "Người nhận"],
      lines.map((r) => [fmtDateVN(r.d as string), r.lot as string, r.chemical as string, Number(r.qty), (r.unit as string) ?? "", fmtDateVN(r.expiry as string), (r.deliverer as string) ?? "", (r.receiver as string) ?? ""]));
  }
  return csvResponse(`thong-ke-su-dung-hoa-chat_${from}_${to}`, `Thống kê sử dụng hóa chất – ${range}`, ["Ngày xuất kho", "Hóa chất", "Lô hàng", "Lượng", "Đơn vị", "Mục đích sử dụng", "Người giao", "Người nhận"],
    lines.map((r) => [fmtDateVN(r.d as string), r.chemical as string, r.lot as string, Number(r.qty), (r.unit as string) ?? "", (r.purpose as string) ?? "", (r.deliverer as string) ?? "", (r.receiver as string) ?? ""]));
}
