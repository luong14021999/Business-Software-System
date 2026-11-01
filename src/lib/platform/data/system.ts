// M1.8 Giám sát sức khỏe hệ thống & sao lưu; M1.4 tập dữ liệu kho dữ liệu dùng chung.
import { createHash } from "crypto";
import { dbQuery, ident } from "@/lib/platform/db";
import { isAuthConfigured } from "@/lib/platform/auth/server";
import { channelMode } from "@/lib/platform/integration/lgsp";

export async function runHealthCheck(source: "Tự động (cron)" | "Thủ công") {
  const t0 = Date.now();
  let dbOk = true;
  let dbError = "";
  let size = 0;
  try {
    const [r] = await dbQuery(`select pg_database_size(current_database())::bigint size`);
    size = Number(r.size);
  } catch (e) {
    dbOk = false;
    dbError = (e as Error).message;
  }
  const dbMs = Date.now() - t0;
  const detail = {
    database: dbOk ? "OK" : `Lỗi: ${dbError}`,
    databaseBytes: size,
    auth: isAuthConfigured() ? "Đã cấu hình" : "Chưa cấu hình",
    lgsp: channelMode("LGSP"),
    ndxp: channelMode("NDXP"),
    region: process.env.VERCEL_REGION ?? "local",
    commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 12) || "local",
  };
  const ok = dbOk && dbMs < 5000;
  if (dbOk) {
    await dbQuery(`insert into public.health_checks (ok, db_ms, source, detail) values ($1, $2, $3, $4::jsonb)`, [ok, dbMs, source, JSON.stringify(detail)]);
  }
  return { ok, dbMs, detail };
}

export async function listHealth(limit = 50) {
  const rows = await dbQuery(`select * from public.health_checks order by at desc limit $1`, [limit]);
  return rows.map((r) => ({ id: String(r.id), at: r.at as string, ok: Boolean(r.ok), dbMs: Number(r.db_ms), source: (r.source as string) ?? "", detail: (r.detail as Record<string, unknown>) ?? {} }));
}

export async function tableStats() {
  const rows = await dbQuery(
    `select relname name, n_live_tup::bigint rows, pg_total_relation_size(relid)::bigint bytes
     from pg_stat_user_tables where schemaname = 'public' order by pg_total_relation_size(relid) desc`,
  );
  return rows.map((r) => ({ name: r.name as string, rows: Number(r.rows), bytes: Number(r.bytes) }));
}

/** Xóa nhật ký sức khỏe / gọi API cũ hơn số ngày giữ lại. */
export async function pruneLogs(days: number) {
  const a = await dbQuery(`delete from public.health_checks where at < now() - ($1 || ' days')::interval returning 1`, [String(days)]);
  const b = await dbQuery(`delete from public.api_calls where at < now() - ($1 || ' days')::interval returning 1`, [String(days)]);
  return a.length + b.length;
}

// Bảng không đưa vào bản sao lưu: khóa bí mật 2 lớp, mã băm khóa API (khôi phục sẽ phải cấp lại).
const EXCLUDE = new Set(["user_mfa", "api_clients", "_migrations"]);

/** Bản sao lưu logic toàn bộ dữ liệu nghiệp vụ dạng JSON (bổ sung cho điểm khôi phục của Neon). */
export async function exportBackup(actor: string) {
  const tables = (await dbQuery(`select tablename from pg_tables where schemaname = 'public' order by 1`))
    .map((r) => r.tablename as string)
    .filter((t) => !EXCLUDE.has(t));
  const data: Record<string, unknown[]> = {};
  let rows = 0;
  for (const t of tables) {
    data[t] = await dbQuery(`select * from public.${ident(t)}`);
    rows += data[t].length;
  }
  const body = JSON.stringify({ format: "vnn-lims-backup/1", createdAt: new Date().toISOString(), createdBy: actor, tables: Object.keys(data), excluded: [...EXCLUDE], data });
  const sha256 = createHash("sha256").update(body).digest("hex");
  await dbQuery(
    `insert into public.backup_runs (kind, actor, tables, rows, bytes, sha256, note) values ('Xuất dữ liệu JSON', $1, $2, $3, $4, $5, $6)`,
    [actor, tables.length, rows, Buffer.byteLength(body), sha256, `Không gồm: ${[...EXCLUDE].join(", ")}`],
  );
  return { body, sha256, tables: tables.length, rows };
}

export async function listBackups(limit = 30) {
  const rows = await dbQuery(`select * from public.backup_runs order by at desc limit $1`, [limit]);
  return rows.map((r) => ({ id: String(r.id), at: r.at as string, kind: r.kind as string, actor: (r.actor as string) ?? "", tables: Number(r.tables), rows: Number(r.rows), bytes: Number(r.bytes), sha256: (r.sha256 as string) ?? "", note: (r.note as string) ?? "" }));
}

// ── M1.4 Kho dữ liệu ───────────────────────────────────────────────
export const DATASETS = {
  fact_samples: { name: "Mẫu thử nghiệm", desc: "Mẫu tiếp nhận, lần phát hành đầu, TAT, đúng hạn", module: "M2" },
  fact_reports: { name: "Phiếu kết quả", desc: "Phát hành, thay thế, thu hồi", module: "M2" },
  fact_results: { name: "Kết quả phân tích", desc: "Giá trị trung bình, độ không đảm bảo đo, kết luận", module: "M2" },
  fact_revenue: { name: "Doanh thu theo phiếu yêu cầu", desc: "Σ đơn giá × số mẫu + VAT", module: "M2" },
  dim_customers: { name: "Khách hàng", desc: "Danh mục khách hàng", module: "M2, M3" },
  fact_equipment: { name: "Thiết bị", desc: "Trạng thái, ngày hiệu chuẩn kế tiếp", module: "M2" },
  fact_chemicals: { name: "Hóa chất", desc: "Tồn kho, tồn tối thiểu, hạn dùng", module: "M2" },
  fact_nonconformities: { name: "Sự không phù hợp", desc: "Nguồn, mức độ, trạng thái xử lý", module: "M2" },
  fact_feedback: { name: "Ý kiến khách hàng", desc: "Đánh giá dịch vụ, khiếu nại", module: "M2" },
} as const;
export type Dataset = keyof typeof DATASETS;
export const isDataset = (d: string): d is Dataset => d in DATASETS;

export async function datasetRows(d: Dataset, limit?: number) {
  return dbQuery(`select * from analytics.${ident(d)}${limit ? ` limit ${Math.max(1, Math.floor(limit))}` : ""}`);
}

export async function datasetCounts() {
  const out: Record<string, number> = {};
  for (const d of Object.keys(DATASETS)) {
    const [r] = await dbQuery(`select count(*)::int n from analytics.${ident(d)}`);
    out[d] = Number(r.n);
  }
  return out;
}

/** CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt). */
export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "﻿";
  const cols = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
}
