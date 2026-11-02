import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { LabPage, btn, input, table } from "@/components/m2/lab-ui/page";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { RecordAnalyteAdder } from "@/components/m2/settings/record-analytes";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { testRecordAnalyteStore, testRecordStore } from "@/lib/modules/m2/data/catalogs";
import { currentAccess } from "@/lib/platform/data/access";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Chỉ tiêu của biên bản thử nghiệm (chỉ danh mục test-records có trang này). */
export default async function RecordAnalytesPage({ params, searchParams }: { params: Promise<{ catalog: string; id: string }>; searchParams: Promise<{ type?: string; q?: string }> }) {
  const [{ catalog, id }, sp] = await Promise.all([params, searchParams]);
  if (catalog !== "test-records") notFound();
  const [records, links, analytes, types, access] = await Promise.all([testRecordStore.list(), testRecordAnalyteStore.list(), analyteStore.list(), sampleTypeStore.list(), currentAccess()]);
  const record = records.find((r) => r.id === id);
  if (!record) notFound();
  const canWrite = access.can("write.quality");
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const q = normalizeVi(sp.q ?? "");
  const rows = links
    .filter((l) => l.recordId === id)
    .sort((a, b) => a.sort - b.sort)
    .map((l) => ({ link: l, analyte: analytes.find((a) => a.id === l.analyteId) }))
    .filter((x) => x.analyte && (!sp.type || x.analyte.sampleTypeId === sp.type))
    .filter((x) => !q || normalizeVi(`${typeName.get(x.analyte!.sampleTypeId) ?? ""} ${x.analyte!.name}`).includes(q));
  const base = `/test-records/${id}/analytes`;
  const usedTypes = types.filter((t) => t.active).sort((a, b) => a.sort - b.sort);
  return (
    <LabPage
      title={`Biên bản thử nghiệm ${record.name}`}
      rule={false}
      toolbar={
        <>
          <Link href="/test-records" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          <Dropdown filter className={btn} label={`Loại mẫu: ${typeName.get(sp.type ?? "") ?? "Tất cả"}`} items={[{ label: "Tất cả", href: base, active: !sp.type }, ...usedTypes.map((t) => ({ label: t.name, href: `${base}?type=${t.id}`, active: sp.type === t.id }))]} />
          <form action={base} className="flex">
            {sp.type && <input type="hidden" name="type" value={sp.type} />}
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Tên loại mẫu hoặc chỉ tiêu..." aria-label="Tìm kiếm" className={`${input} !w-60 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
        </>
      }
    >
      <table className={table}>
        <thead><tr><th>Loại mẫu</th><th>Chỉ tiêu phân tích</th><th /></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Chưa có chỉ tiêu</td></tr>}
          {rows.map(({ link, analyte }) => (
            <tr key={link.id}>
              <td>{typeName.get(analyte!.sampleTypeId) ?? ""}</td>
              <td>{analyte!.name}{analyte!.unit && ` (${analyte!.unit})`}</td>
              <td className="text-right">{canWrite && <XDeleteLink url={`/api/test-record-analytes/${link.id}`} label={analyte!.name} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {canWrite && (
        <RecordAnalyteAdder
          recordId={id}
          types={usedTypes.map((t) => ({ value: t.id, label: t.name }))}
          analytes={analytes.filter((a) => a.active).sort((a, b) => a.sort - b.sort).map((a) => ({ value: a.id, label: a.unit ? `${a.name} (${a.unit})` : a.name, typeId: a.sampleTypeId }))}
        />
      )}
    </LabPage>
  );
}
