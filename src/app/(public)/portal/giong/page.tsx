import Link from "next/link";
import { Sprout, PackageCheck, Newspaper } from "lucide-react";
import { GOV } from "@/components/brand/gov-identity";
import { Badge } from "@/components/ui/badge";
import { publicBreedCatalog } from "@/lib/modules/m3/data/genomics";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Giống cây trồng, vật nuôi, thủy sản – Viện Nông nghiệp tỉnh Thanh Hóa",
  description: "Nguồn giống, lô giống đạt chuẩn đang cung ứng và thông tin thị trường",
};


/** Cổng công khai M3.2.8: chỉ giống / lô / tin đã đánh dấu công bố; không có giá nội bộ, khách hàng. */
export default async function PublicBreedPage() {
  const { varieties, stock, posts } = await publicBreedCatalog();
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-card border p-5 sm:p-8">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center gap-2"><Sprout className="w-7 h-7 text-primary" />Giống của Viện Nông nghiệp tỉnh Thanh Hóa</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-3xl">Nguồn giống đã công nhận, lưu hành; lô giống đạt chuẩn chất lượng đang cung ứng; mô hình hiệu quả và thông tin thị trường. Mỗi lô giống có mã QR truy xuất nguồn gốc.</p>
        <p className="mt-4 text-sm">Đăng ký nhu cầu, mua giống hoặc tư vấn kỹ thuật: liên hệ {GOV.unit}, điện thoại <a href={`tel:${GOV.phone.replace(/\D/g, "")}`} className="font-semibold text-primary hover:underline">{GOV.phone}</a>.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Nguồn giống</h2>
        {varieties.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border bg-card p-4">Thông tin đang được cập nhật.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {varieties.map((v) => (
              <div key={v.code} className="rounded-xl border bg-card p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1.5"><span className="font-semibold">{v.name}</span><Badge variant="outline">{v.kind}</Badge>{v.species && <span className="text-xs text-muted-foreground">{v.species}</span>}</div>
                {v.public_summary && <p className="text-sm text-muted-foreground">{v.public_summary}</p>}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {v.recognition_no && <div>Công nhận: {v.recognition_no}</div>}
                  {v.circulation_type && v.circulation_type !== "Chưa lưu hành" && <div>{v.circulation_type}</div>}
                  {v.regions && <div>Vùng khuyến cáo: {v.regions}</div>}
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><PackageCheck className="w-5 h-5 text-primary" />Giống đạt chuẩn đang cung ứng</h2>
        {stock.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border bg-card p-4">Hiện chưa có lô giống công bố. Vui lòng đăng ký nhu cầu để Viện lập kế hoạch sản xuất.</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="text-left font-medium px-4 py-2">Giống</th><th className="text-left font-medium px-4">Cấp giống</th><th className="text-right font-medium px-4">Còn cung ứng</th></tr></thead>
              <tbody className="divide-y">
                {stock.map((s) => (
                  <tr key={`${s.variety}-${s.level}-${s.unit}`}><td className="px-4 py-2">{s.variety} <span className="text-xs text-muted-foreground">{s.kind}</span></td><td className="px-4">{s.level}</td><td className="px-4 text-right tabular-nums">{Number(s.available).toLocaleString("vi-VN")} {s.unit}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-[11px] text-muted-foreground border-t">Chỉ gồm lô đã đạt kiểm định / chứng nhận, còn hiệu lực hợp quy. Giá và điều kiện cung ứng theo báo giá của Viện.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Newspaper className="w-5 h-5 text-primary" />Thông tin thị trường, mô hình, kỹ thuật</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border bg-card p-4">Chưa có tin.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.code} className="rounded-xl border bg-card p-4">
                <div className="text-[11px] text-muted-foreground">{[p.kind, fmtDateVN(p.published_at), p.variety, p.area].filter(Boolean).join(" · ")}</div>
                <Link href={`/portal/giong/${encodeURIComponent(p.code ?? "")}`} className="font-medium text-primary hover:underline">{p.title}</Link>
                {p.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.summary}</p>}
                {p.price_note && <p className="text-xs mt-1">Giá tham khảo: {p.price_note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
