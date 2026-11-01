import { NextResponse } from "next/server";
import { insertPublicFeedback } from "@/lib/modules/m3/data/tissue";
import { withinPublicLimit } from "@/lib/platform/data/public-limit";
import { isValidPhone, normalizePhone } from "@/lib/platform/format";
import { ipHash } from "@/lib/platform/security/client-ip";
import { isDbConfigured } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

/** Khách mua cây giống gửi phản hồi từ trang truy xuất QR (M3.1.6). Bảo vệ: honeypot, giới hạn tần suất. */
export async function POST(req: Request) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ error: "Tạm ngừng nhận phản hồi" }, { status: 503 });
    if (Number(req.headers.get("content-length") ?? 0) > 10_000) return NextResponse.json({ error: "Nội dung quá lớn" }, { status: 413 });
    const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!b) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    if (typeof b.website === "string" && b.website.trim()) return NextResponse.json({ ok: true }, { status: 201 });
    if (!(await withinPublicLimit("feedback", ipHash(req)))) return NextResponse.json({ error: "Bạn đã gửi quá nhiều phản hồi, vui lòng thử lại sau" }, { status: 429 });
    const str = (k: string, max: number) => (typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : "");
    const lotCode = str("lotCode", 64);
    const content = str("content", 2000);
    const contactName = str("contactName", 100);
    const phone = normalizePhone(str("phone", 20));
    if (!lotCode) return NextResponse.json({ error: "Thiếu mã lô" }, { status: 400 });
    if (content.length < 5) return NextResponse.json({ error: "Nhập nội dung phản hồi (ít nhất 5 ký tự)" }, { status: 400 });
    if (phone && !isValidPhone(phone)) return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
    const num = (k: string, min: number, max: number) => {
      const n = b[k] == null || b[k] === "" ? null : Number(b[k]);
      return n == null || !Number.isFinite(n) ? null : Math.min(max, Math.max(min, n));
    };
    const id = await insertPublicFeedback(lotCode, { contactName, phone, survivalPct: num("survivalPct", 0, 100), rating: num("rating", 1, 5), content }, ipHash(req));
    if (!id) return NextResponse.json({ error: "Không tìm thấy lô cây giống" }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[public] lot-feedback:", (e as Error).message);
    return NextResponse.json({ error: "Tạm ngừng nhận phản hồi, vui lòng thử lại sau" }, { status: 503 });
  }
}
