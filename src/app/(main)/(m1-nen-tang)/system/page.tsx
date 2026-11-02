import Link from "next/link";
import { Activity, DatabaseBackup, HardDrive, HeartPulse, Download, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatGrid } from "@/components/common/stat-grid";
import { ActionButton } from "@/components/platform/action-button";
import { currentAccess } from "@/lib/platform/data/access";
import { SETTINGS, getSettings, type SettingKey } from "@/lib/platform/data/settings";
import { listBackups, listHealth, tableStats } from "@/lib/platform/data/system";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quản trị hệ thống" };

const size = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} kB`);

export default async function SystemPage() {
  const [access, settings, health, backups, tables] = await Promise.all([currentAccess(), getSettings(), listHealth(30), listBackups(), tableStats()]);
  const admin = access.can("admin.system");
  const last = health[0];
  const totalBytes = tables.reduce((s, t) => s + t.bytes, 0);
  const auto = health.filter((h) => h.source.startsWith("Tự động"));
  const defs = (Object.keys(SETTINGS) as SettingKey[]).map((k) => ({
    key: k,
    label: SETTINGS[k].label,
    type: SETTINGS[k].type,
    value: settings[k],
    updatedBy: settings._meta[k]?.updatedBy,
  }));
  return (
    <>
      <Header title="Quản trị cấu hình, giám sát & sao lưu" description="M1.8 – cấu hình hệ thống, kiểm tra sức khỏe định kỳ, dung lượng dữ liệu, sao lưu và khôi phục" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Sức khỏe gần nhất", value: last ? (last.ok ? "Tốt" : "Lỗi") : "—", icon: HeartPulse, accent: last?.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600", hint: last ? `${fmtDateTimeVN(last.at)} · CSDL ${last.dbMs} ms` : "chưa kiểm tra" },
            { label: "Kiểm tra tự động", value: auto.length, icon: Activity, accent: "bg-blue-50 text-blue-600", hint: auto[0] ? `gần nhất ${fmtDateTimeVN(auto[0].at)}` : "Vercel Cron hằng ngày 06:00" },
            { label: "Dung lượng dữ liệu", value: size(totalBytes), icon: HardDrive, accent: "bg-violet-50 text-violet-600", hint: `${tables.length} bảng · ${tables.reduce((s, t) => s + t.rows, 0)} dòng` },
            { label: "Bản sao lưu", value: backups.length, icon: DatabaseBackup, accent: "bg-amber-50 text-amber-600", hint: backups[0] ? `gần nhất ${fmtDateTimeVN(backups[0].at)}` : "chưa xuất" },
          ]}
        />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Cấu hình hệ thống</CardTitle><CardDescription>Đã chuyển sang trang Cấu hình (theo nhóm, có lịch sử thay đổi)</CardDescription></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{defs.filter((d) => d.updatedBy).length}/{defs.length} tham số đã được đặt khác mặc định.</p>
              <Link href="/settings" className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-accent">Mở trang Cấu hình →</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-2">
              <div><CardTitle className="text-base">Sao lưu & khôi phục</CardTitle><CardDescription>Hai lớp sao lưu độc lập</CardDescription></div>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- tải file sao lưu từ API, không phải trang */}
              {admin && <a href="/api/system/backup" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border text-xs font-medium hover:bg-accent shrink-0"><Download className="w-3.5 h-3.5" /> Xuất bản sao lưu</a>}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground text-xs">
                <li><b className="text-foreground">Điểm khôi phục của Neon</b> (tự động, liên tục): khôi phục toàn bộ CSDL về thời điểm bất kỳ trong cửa sổ lưu giữ của gói Neon, qua Neon Console → Branches → Restore.</li>
                <li><b className="text-foreground">Bản xuất JSON</b> (thủ công): toàn bộ bảng nghiệp vụ, kèm mã SHA-256 để kiểm tra toàn vẹn; lưu ngoài hệ thống (ổ đĩa cơ quan). Không gồm khóa bí mật 2 lớp và mã băm khóa API.</li>
              </ol>
              <ul className="divide-y">
                {backups.length === 0 && <li className="py-2 text-xs text-muted-foreground">Chưa xuất bản sao lưu nào</li>}
                {backups.map((b) => (
                  <li key={b.id} className="py-2 text-xs flex flex-wrap gap-x-3">
                    <span className="font-medium">{fmtDateTimeVN(b.at)}</span>
                    <span>{b.actor}</span>
                    <span>{b.tables} bảng · {b.rows} dòng · {size(b.bytes)}</span>
                    <span className="font-mono text-muted-foreground">SHA-256 {b.sha256.slice(0, 16)}…</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-2">
              <div><CardTitle className="text-base">Nhật ký sức khỏe</CardTitle><CardDescription>CSDL, xác thực, chế độ kết nối LGSP/NDXP, phiên bản triển khai</CardDescription></div>
              {admin && <ActionButton url="/api/system/health" label="Kiểm tra ngay" icon={<RefreshCw />} success="Đã kiểm tra" />}
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-xs">
                {health.length === 0 && <li className="py-2 text-muted-foreground">Chưa có lần kiểm tra</li>}
                {health.map((h) => (
                  <li key={h.id} className="py-1.5 flex flex-wrap items-center gap-x-2">
                    <Badge variant={h.ok ? "success" : "destructive"}>{h.ok ? "Tốt" : "Lỗi"}</Badge>
                    <span>{fmtDateTimeVN(h.at)}</span>
                    <span className="text-muted-foreground">{h.source} · CSDL {h.dbMs} ms · {String(h.detail.region ?? "")} · {String(h.detail.commit ?? "")} · LGSP {String(h.detail.lgsp ?? "")}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Dung lượng theo bảng</CardTitle><CardDescription>Ước tính từ thống kê PostgreSQL</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-xs max-h-96 overflow-y-auto">
                {tables.map((t) => (
                  <li key={t.name} className="py-1.5 flex items-center gap-2">
                    <span className="font-mono flex-1 truncate">{t.name}</span>
                    <span className="text-muted-foreground w-20 text-right">{t.rows} dòng</span>
                    <span className="w-20 text-right">{size(t.bytes)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
