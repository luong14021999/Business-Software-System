"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { btn, input, table } from "@/components/m2/lab-ui/page";
import {
  accreditedTests,
  matrixEn,
  type AccreditedMatrix,
} from "@/lib/modules/m2/accreditation";
import { cn } from "@/lib/utils";

type Filter = "all" | "soil" | "water" | "fertilizer" | "produce";

const filters: { key: Filter; label: string; matrices: AccreditedMatrix[] }[] = [
  { key: "all", label: "Tất cả", matrices: [] },
  { key: "soil", label: "Đất", matrices: ["Đất"] },
  { key: "water", label: "Nước", matrices: ["Nước mặt, nước ngầm", "Nước mặt"] },
  { key: "fertilizer", label: "Phân bón", matrices: ["Phân bón"] },
  { key: "produce", label: "Rau, quả", matrices: ["Rau, quả"] },
];

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

/** Danh mục phép thử được công nhận: lọc theo đối tượng (nhóm nút dính liền kiểu Bootstrap) và tìm kiếm. */
export function AccreditedTestsTable() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const f = filters.find((x) => x.key === filter)!;
    const q = normalize(query.trim());
    return accreditedTests.filter(
      (t) =>
        (f.matrices.length === 0 || f.matrices.includes(t.matrix)) &&
        (!q ||
          normalize(`${t.name} ${t.nameEn} ${t.method} ${t.loq} ${t.matrix}`).includes(q)),
    );
  }, [filter, query]);

  const countOf = (key: Filter) => {
    const f = filters.find((x) => x.key === key)!;
    return f.matrices.length === 0
      ? accreditedTests.length
      : accreditedTests.filter((t) => f.matrices.includes(t.matrix)).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1">
        <div className="flex flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(btn, "-ml-px rounded-none first:ml-0 first:rounded-l last:rounded-r", filter === f.key && "bg-[#e6e6e6] shadow-[inset_0_3px_5px_rgba(0,0,0,0.125)]")}
            >
              {f.label} ({countOf(f.key)})
            </button>
          ))}
        </div>
        <div className="flex">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${input} !w-64 rounded-r-none`}
            placeholder="Tìm chỉ tiêu, phương pháp, TCVN…"
            aria-label="Tìm phép thử"
          />
          <span className={`${btn} rounded-l-none border-l-0`} aria-hidden><Search className="h-4 w-4 stroke-[3]" /></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className="w-12">TT</th>
              <th className="w-44">Đối tượng thử</th>
              <th>Tên phép thử</th>
              <th className="w-44">Giới hạn định lượng / Phạm vi đo</th>
              <th className="w-52">Phương pháp thử</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Không tìm thấy phép thử phù hợp</td></tr>}
            {rows.map((t) => (
              <tr key={t.no}>
                <td>{t.no}</td>
                <td>
                  {t.matrix}
                  <div className="text-xs italic text-[#777]">{matrixEn[t.matrix]}</div>
                </td>
                <td>
                  {t.name}
                  <div className="text-xs italic text-[#777]">{t.nameEn}</div>
                </td>
                <td>{t.loq || "–"}</td>
                <td>{t.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
