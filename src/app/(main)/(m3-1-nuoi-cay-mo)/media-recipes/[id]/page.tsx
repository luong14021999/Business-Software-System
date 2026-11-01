import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { cultureBatchStore, mediaBatchStore, mediaRecipeStore, recipeChemicalStore, supplyStore } from "@/lib/modules/m3/data/tissue";
import { mediaCostPerLiter } from "@/lib/modules/m3/production";
import { fmtVND } from "@/lib/platform/format";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { CHEMICAL_UNITS } from "@/lib/modules/m3/tissue-rules";
import { contaminationRate, fmtPct } from "@/lib/modules/m3/rates";
import { mediaQcVariant } from "@/lib/modules/m3/ui";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Công thức môi trường" };

const fmtAmount = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });

/** Công thức môi trường: định mức hóa chất / lít, tính lượng cần cho 1 mẻ pha, các lô đã pha (M3.1.2). */
export default async function MediaRecipeDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const { id } = await params;
  const volume = Math.min(1000, Math.max(0, Number((await searchParams).v) || 1));
  const [recipes, chemicals, batches, cultures, supplies] = await Promise.all([mediaRecipeStore.list(), recipeChemicalStore.list(), mediaBatchStore.list(), cultureBatchStore.list(), supplyStore.list()]);
  const supplyById = byId(supplies);
  const r = recipes.find((x) => x.id === id);
  if (!r) notFound();
  const myChemicals = chemicals.filter((c) => c.recipeId === id).sort((a, b) => a.chemical.localeCompare(b.chemical, "vi"));
  const cost = mediaCostPerLiter(myChemicals, supplyById);
  const myBatches = batches.filter((b) => b.recipeId === id).sort((a, b) => (b.preparedAt || "").localeCompare(a.preparedAt || ""));
  const fields: CrudField[] = [
    { name: "recipeId", label: "Công thức", type: "select", options: [{ value: r.id, label: r.code }], defaultValue: r.id },
    { name: "chemical", label: "Hóa chất", required: true, placeholder: "VD: NH₄NO₃, BAP, Sucrose" },
    { name: "supplyId", label: "Vật tư trong kho (để tính giá)", type: "select", options: refOptions(supplies, (x) => `${x.code} · ${x.name} (${x.unit})`) },
    { name: "chemicalCode", label: "Mã trong kho M2 (nếu có)", mono: true },
    { name: "amountPerL", label: "Định mức / 1 lít", type: "number", required: true },
    { name: "unit", label: "Đơn vị", type: "select", options: [...CHEMICAL_UNITS] },
    { name: "note", label: "Ghi chú (dung dịch mẹ, thứ tự pha…)", type: "textarea" },
  ];

  return (
    <>
      <Header title={`${r.code} · ${r.name}`} description={`${r.stage} · nền ${r.baseMedium} · ${r.hormones || "không chất điều hòa"} · đường ${r.sugarGl} g/l · agar ${r.agarGl} g/l · pH ${r.ph}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/media-recipes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Công thức môi trường
        </Link>

        <CrudTableCard
          title="Định mức hóa chất (trên 1 lít)"
          description={`Chi phí hóa chất ≈ ${fmtVND(cost.cost)} / lít${cost.missing.length ? ` – chưa tính: ${cost.missing.join(", ")} (chưa gắn vật tư hoặc đơn vị không quy đổi được)` : ""}. Đường, agar cũng cần nhập thành dòng để tính giá`}
          endpoint="/api/recipe-chemicals"
          entity="recipe-chemicals"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/recipe-chemicals" title="Thêm hóa chất" fields={fields} addLabel="Thêm hóa chất" />}
          headers={["Hóa chất", "Vật tư · đơn giá", "Định mức / lít", "Chi phí / lít"]}
          emptyText="Chưa nhập định mức hóa chất"
          rows={myChemicals.map((c) => ({
            id: c.id,
            label: c.chemical,
            initial: c,
            cells: [
              <span key="n" className="text-sm">{c.chemical}</span>,
              <span key="k" className="text-xs">{supplyById.get(c.supplyId) ? `${supplyById.get(c.supplyId)!.code} · ${fmtVND(supplyById.get(c.supplyId)!.unitPrice)}/${supplyById.get(c.supplyId)!.unit}` : <span className="text-amber-600">chưa gắn vật tư</span>}</span>,
              <span key="a" className="text-sm tabular-nums">{fmtAmount(c.amountPerL)} {c.unit}</span>,
              <span key="g" className="text-xs">{(() => {
                const one = mediaCostPerLiter([c], supplyById);
                return one.missing.length ? "—" : fmtVND(one.cost);
              })()}</span>,
            ],
          }))}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4" />Tính lượng hóa chất cho mẻ pha</CardTitle>
            <CardDescription>Nhập thể tích cần pha (lít)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form method="get" className="flex items-center gap-2">
              <input name="v" type="number" step="any" min={0} max={1000} defaultValue={volume} className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm" />
              <span className="text-sm text-muted-foreground">lít</span>
              <button className="h-9 px-3 rounded-md border bg-background text-sm hover:bg-accent">Tính</button>
            </form>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {myChemicals.map((c) => (
                  <tr key={c.id}><td className="py-1.5">{c.chemical}</td><td className="text-right tabular-nums font-medium">{fmtAmount(c.amountPerL * volume)} {c.unit}</td></tr>
                ))}
                <tr><td className="py-1.5">Đường</td><td className="text-right tabular-nums font-medium">{fmtAmount((r.sugarGl || 0) * volume)} g</td></tr>
                <tr><td className="py-1.5">Agar</td><td className="text-right tabular-nums font-medium">{fmtAmount((r.agarGl || 0) * volume)} g</td></tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Các lô đã pha</CardTitle><CardDescription>Tỷ lệ nhiễm tính trên các mẻ cấy dùng lô đó</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {myBatches.map((b) => {
                const used = cultures.filter((c) => c.mediaBatchId === b.id);
                const vessels = used.reduce((s, c) => s + c.vessels, 0);
                const contaminated = used.reduce((s, c) => s + c.contaminated, 0);
                return (
                  <li key={b.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                    <span><Link href={`/media-batches?q=${encodeURIComponent(b.code)}`} className="font-mono text-xs text-primary hover:underline">{b.code}</Link> <span className="text-xs text-muted-foreground">{fmtDateVN(b.preparedAt)} · {b.volumeL} l</span></span>
                    <span className="flex items-center gap-2 text-xs">
                      {used.length} mẻ · nhiễm {fmtPct(contaminationRate({ vessels, contaminated }))}
                      <Badge variant={mediaQcVariant[b.qcResult] ?? "secondary"}>{b.qcResult}</Badge>
                    </span>
                  </li>
                );
              })}
              {myBatches.length === 0 && <li className="py-2 text-muted-foreground">Chưa pha lô nào</li>}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
