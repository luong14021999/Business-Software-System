import { Search } from "lucide-react";
import { LabPage, Pager, btn, input, link, table } from "@/components/m2/lab-ui/page";
import { paginate } from "@/components/m2/lab-ui/x-list";
import { labMethodStore } from "@/lib/modules/m2/data/settings";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Tra cứu tài liệu phương pháp phân tích như XaLab: tìm theo tên, xem mô tả và tài liệu đính kèm. */
export default async function MethodLookupPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = normalizeVi(sp.q ?? "");
  const rows = (await labMethodStore.list())
    .filter((m) => m.active !== false && (!q || normalizeVi(`${m.name} ${m.description}`).includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const { page, pages, slice } = paginate(rows, sp, 20);
  return (
    <LabPage title="Tra cứu tài liệu phương pháp phân tích">
      <form action="/method-lookup" className="flex">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Tên phương pháp..." aria-label="Tìm phương pháp" className={`${input} !w-56 rounded-r-none`} />
        <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
      </form>
      <hr className="my-5 border-[#eee]" />
      <table className={table}>
        <thead><tr><th>Tên</th><th>Mô tả</th><th /></tr></thead>
        <tbody>
          {slice.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>}
          {slice.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td className="whitespace-pre-line">{m.description}</td>
              <td className="whitespace-nowrap text-right">{m.attachmentUrl && <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className={link}>Tài liệu</a>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5"><Pager page={rows.length ? page : 0} pages={pages} href={(p) => `/method-lookup?${sp.q ? `q=${encodeURIComponent(sp.q)}&` : ""}page=${p}`} /></div>
    </LabPage>
  );
}
