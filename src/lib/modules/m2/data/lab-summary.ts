// Tóm tắt kết quả phân tích theo mã mẫu – cho phần mềm khác (VD lô giống M3.2) xem kết quả đã duyệt.
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

/** Mẫu M2 và kết quả phân tích của các mã mẫu (giá trị chỉ có khi kết quả đã duyệt). */
export async function labDataFor(sampleCodes: string[]) {
  if (!isDbConfigured() || sampleCodes.length === 0) return [];
  const rows = await dbQuery(
    `select s.code, s.type, s.received_at, s.status,
            count(r.id)::int results,
            count(r.id) filter (where r.status = 'Đã duyệt')::int approved,
            coalesce(json_agg(json_build_object('criterion', r.criterion, 'unit', r.unit,
                       -- chỉ công bố giá trị đã qua QA/QC và Trưởng phòng duyệt
                       'mean', case when r.status = 'Đã duyệt' then r.mean end,
                       'conclusion', case when r.status = 'Đã duyệt' then r.conclusion end, 'status', r.status)
                     order by r.criterion) filter (where r.id is not null), '[]') lines
     from public.samples s
     left join public.analysis_results r on r.sample_code = s.code
     where s.code = any($1)
     group by s.code, s.type, s.received_at, s.status`,
    [sampleCodes],
  ).catch(() => []);
  return rows as {
    code: string;
    type: string;
    received_at: string;
    status: string;
    results: number;
    approved: number;
    lines: { criterion: string; unit: string; mean: number | null; conclusion: string | null; status: string }[];
  }[];
}
