import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/platform/auth/server";
import { mfaGate } from "@/lib/platform/security/mfa-gate";

// Neon Auth: chưa đăng nhập → redirect /login (trang /login luôn được mở).
const requireAuth = auth?.middleware({ loginUrl: "/login" });

/**
 * Đường dẫn tự xác thực, không dùng phiên đăng nhập:
 * - /verify/: xác minh phiếu kết quả qua QR (chỉ trạng thái + tính toàn vẹn, không có kết quả)
 * - /portal, /trace: cổng thông tin & truy xuất lô giống (M3.1, M3.2) – chỉ dữ liệu công bố
 * - /api/public/: API của cổng – giới hạn tần suất theo IP
 * - /api/v1/: API cho hệ thống bên ngoài – xác thực bằng khóa API (M1.3)
 * - /api/cron/: tác vụ định kỳ – xác thực bằng CRON_SECRET (M1.8)
 */
const PUBLIC_PREFIXES = ["/verify/", "/portal", "/trace", "/api/public/", "/api/v1/", "/api/cron/"];

export async function proxy(request: NextRequest) {
  // Nếu chưa cấu hình Neon Auth → không bật auth, mọi route đều mở.
  if (!requireAuth) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))) return NextResponse.next();
  const response = await requireAuth(request);

  // API dữ liệu (ISO/IEC 17025 §7.11): chưa đăng nhập → 401 JSON thay vì
  // redirect sang trang /login. /api/auth được Neon Auth tự bỏ qua.
  const isRedirect = response.status >= 300 && response.status < 400;
  if (isRedirect && request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  if (isRedirect) return response;
  // Đã đăng nhập → kiểm tra xác thực 2 lớp (M1.1).
  return mfaGate(request, response as NextResponse);
}

export const config = {
  matcher: [
    /*
     * Match tất cả routes (kể cả /api – bắt buộc đăng nhập) trừ:
     * - /_next/static (Next.js internals)
     * - /_next/image (image optimization)
     * - assets: favicon, logo, icon, manifest, svg, png
     */
    "/((?!_next/static|_next/image|favicon.ico|logo-vnnth.png|icon-leaf.svg|manifest.json|.*\\.(?:png|jpg|jpeg|svg|ico|webp)).*)",
  ],
};
