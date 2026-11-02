import { LabPage, Pager, table } from "@/components/m2/lab-ui/page";
import { ResultsSearch, type ResultsFilter } from "@/components/m2/orders/results-search";
import { analyteStore, sampleTypeStore, searchResultLines } from "@/lib/modules/m2/data/orders";
import { resultMatrix } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

/** Kết quả: tra cứu kết quả theo ngày quan trắc / ngày nhận mẫu / mã mẫu, xuất và nhập Excel. */
export default async function ResultsPage({ searchParams }: { searchParams: Promise<Partial<ResultsFilter> & { page?: string }> }) {
  const sp = await searchParams;
  const f: ResultsFilter = { by: sp.by ?? "", from: sp.from ?? "", to: sp.to ?? "", method: sp.method ?? "", typeId: sp.typeId ?? "", criterion: sp.criterion ?? "", code: sp.code ?? "", an: sp.an ?? "" };
  const [analytes, types, access] = await Promise.all([analyteStore.list(), sampleTypeStore.list(), currentAccess()]);
  const by = f.by === "quan-trac" || f.by === "nhan-mau" || f.by === "ma-mau" ? f.by : null;
  const m = by ? resultMatrix(await searchResultLines({ ...f, by })) : { columns: [], rows: [] };
  const pages = Math.ceil(m.rows.length / PER_PAGE);
  const page = Math.min(Math.max(1, pages), Math.max(1, Number(sp.page) || 1));
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <LabPage title="Kết quả">
      <ResultsSearch
        initial={f}
        canImport={access.can("results.enter")}
        methods={[...new Set(analytes.map((a) => a.method).filter(Boolean))].sort()}
        types={types.filter((t) => t.active).sort((a, b) => a.sort - b.sort).map((t) => ({ value: t.id, label: t.name }))}
        analytes={analytes.filter((a) => a.active).sort((a, b) => a.sort - b.sort).map((a) => ({ name: a.name, typeId: a.sampleTypeId }))}
      />
      {by && m.rows.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className={table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Mã mẫu</th>
                <th>Vị trí lấy mẫu</th>
                {m.columns.map((c) => <th key={c.criterion} className="!whitespace-normal">{c.criterion}{c.unit && <span className="font-normal text-muted-foreground"> ({c.unit})</span>}</th>)}
              </tr>
            </thead>
            <tbody>
              {m.rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((r, i) => (
                <tr key={r.code}>
                  <td>{(page - 1) * PER_PAGE + i + 1}</td>
                  <td className="whitespace-nowrap">{r.code}</td>
                  <td>{r.locationName}</td>
                  {r.cells.map((c, j) => <td key={j} className="whitespace-nowrap">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {by && m.rows.length === 0 && <p className="py-4 text-sm text-muted-foreground">Không có kết quả nào khớp bộ lọc.</p>}
      <Pager page={pages ? page : 0} pages={pages} href={(p) => `/results?${qs}&page=${p}`} />
    </LabPage>
  );
}
