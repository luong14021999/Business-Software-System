import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, QrCode, FlaskConical, GitMerge } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CriteriaTable } from "@/components/m3/criteria-table";
import { LinkList } from "@/components/m3/link-list";
import {
  breedStandardStore,
  deliveryStore,
  productionLotStore,
  seedLotStore,
  sourceStockStore,
  standardCriterionStore,
  varietyStore,
} from "@/lib/modules/m3/data/breeding";
import { labDataFor } from "@/lib/modules/m2/data/lab-summary";
import { genotypeCallStore, genotypeSampleStore } from "@/lib/modules/m3/data/genomics";
import { profilesBySample, purityTest, referenceProfiles } from "@/lib/modules/m3/genomics";
import { evaluateCriteria, seedLotChain, validityAlert } from "@/lib/modules/m3/breeding-rules";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lô giống" };

/** Lô giống (M3.2.3 / M3.2.6): đối chiếu bộ chỉ tiêu với kết quả kiểm nghiệm đã duyệt từ M2, chuỗi cấp giống, giao nhận. */
export default async function SeedLotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [seedLots, prodLots, varieties, standards, criteria, deliveries, stocks, gSamples, gCalls] = await Promise.all([
    seedLotStore.list(),
    productionLotStore.list(),
    varietyStore.list(),
    breedStandardStore.list(),
    standardCriterionStore.list(),
    deliveryStore.list(),
    sourceStockStore.list(),
    genotypeSampleStore.list(),
    genotypeCallStore.list(),
  ]);
  const s = seedLots.find((x) => x.id === id);
  if (!s) notFound();
  const today = todayISO();
  const std = standards.find((x) => x.id === s.standardId);
  const myCriteria = criteria.filter((c) => c.standardId === s.standardId).sort((a, b) => a.sortOrder - b.sortOrder);
  const [lab] = s.sampleCode ? await labDataFor([s.sampleCode]) : [];
  const evaluation = evaluateCriteria(myCriteria, (lab?.lines ?? []).map((l) => ({ criterion: l.criterion, value: l.mean })));
  const { chain, sourceStockId } = seedLotChain(id, byId(seedLots), byId(prodLots));
  const stock = stocks.find((x) => x.id === sourceStockId);
  const myDeliveries = deliveries.filter((d) => d.seedLotId === id);
  const delivered = myDeliveries.reduce((sum, d) => sum + d.quantity, 0);
  const conf = validityAlert(s.conformityUntil, today);
  // Giám định độ thuần bằng chỉ thị phân tử (M3.2.5)
  const gProfiles = profilesBySample(gCalls);
  const refProfile = referenceProfiles(gSamples, gProfiles).get(s.varietyId);
  const plants = gSamples.filter((x) => x.seedLotId === id && x.purpose === "Cây kiểm tra độ thuần").map((x) => ({ id: x.id, label: x.code, profile: gProfiles.get(x.id) ?? new Map() }));
  const purity = refProfile && plants.length ? purityTest(plants, refProfile) : null;

  return (
    <>
      <Header title={`Lô giống ${s.code}`} description={`${varieties.find((v) => v.id === s.varietyId)?.name ?? "—"} · ${s.level} · ${s.quantity.toLocaleString("vi-VN")} ${s.unit}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/seed-lots" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mr-auto">
            <ArrowLeft className="w-4 h-4" /> Lô giống
          </Link>
          <Link href={`/trace/${encodeURIComponent(s.code)}`} target="_blank" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent"><QrCode className="w-4 h-4" /> Trang truy xuất</Link>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Kiểm định & chứng nhận</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Tình trạng</dt><dd><Badge variant={s.status === "Đã chứng nhận" ? "success" : s.status === "Không đạt" ? "destructive" : "secondary"}>{s.status}</Badge></dd>
                <dt className="text-muted-foreground">Kiểm định</dt><dd>{s.fieldResult}{s.fieldInspectedAt && ` · ${fmtDateVN(s.fieldInspectedAt)}`}</dd>
                <dt className="text-muted-foreground">Chứng nhận</dt><dd>{s.certificateNo ? `${s.certificateNo} · ${fmtDateVN(s.certifiedAt)}` : "—"}</dd>
                <dt className="text-muted-foreground">Hợp quy</dt>
                <dd className={conf ? (conf.kind === "Hết hiệu lực" ? "text-rose-600 font-medium" : "text-amber-600") : ""}>{s.conformityNo ? `${s.conformityNo}${s.conformityUntil ? ` · đến ${fmtDateVN(s.conformityUntil)}` : ""}` : "—"}{conf && ` (${conf.kind.toLowerCase()} ${conf.days} ngày)`}</dd>
                <dt className="text-muted-foreground">Đã giao</dt><dd>{delivered.toLocaleString("vi-VN")} / {s.quantity.toLocaleString("vi-VN")} {s.unit}</dd>
              </dl>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2"><FlaskConical className="w-4 h-4" />Kiểm nghiệm chất lượng (M2)
                <Badge variant={evaluation.overall === "Đạt" ? "success" : evaluation.overall === "Không đạt" ? "destructive" : "secondary"}>{evaluation.overall}</Badge>
              </CardTitle>
              <CardDescription>
                {std ? `${std.code} · ${std.name}` : "Chưa chọn bộ chỉ tiêu"} ·{" "}
                {s.sampleCode ? (lab ? `mẫu ${lab.code}: ${lab.approved}/${lab.results} chỉ tiêu đã duyệt (chỉ dùng kết quả đã duyệt)` : `không đọc được mẫu ${s.sampleCode} ở M2`) : "chưa gắn mã mẫu M2"}
              </CardDescription>
            </CardHeader>
            <CardContent><CriteriaTable rows={evaluation.rows} /></CardContent>
          </Card>
        </section>

        {plants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Độ thuần di truyền (chỉ thị phân tử)</CardTitle>
              <CardDescription>{refProfile ? `${plants.length} cây kiểm tra so với hồ sơ chuẩn của giống` : "Giống chưa có hồ sơ chuẩn (mẫu Giống tham chiếu) – chưa tính được"}</CardDescription>
            </CardHeader>
            {purity && (
              <CardContent className="text-sm space-y-1">
                <div className="text-2xl font-semibold">{purity.purity == null ? "—" : `${purity.purity.toLocaleString("vi-VN")}%`}</div>
                <div className="text-xs text-muted-foreground">{purity.trueToType}/{purity.tested} cây đúng giống{purity.offTypes.length > 0 && ` · cây khác dạng: ${purity.offTypes.map((o) => o.label).join(", ")}`}</div>
              </CardContent>
            )}
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GitMerge className="w-4 h-4" />Chuỗi cấp giống</CardTitle><CardDescription>Từ lô này ngược về nguồn giống gốc</CardDescription></CardHeader>
          <CardContent>
            <ol className="space-y-1.5 text-sm">
              {chain.map(({ seedLot, production }) => (
                <li key={seedLot.id} className="flex flex-wrap gap-x-2">
                  <Link href={`/seed-lots/${seedLot.id}`} className="font-mono text-xs text-primary hover:underline">{seedLot.code}</Link>
                  <span className="text-xs">{seedLot.level}</span>
                  {production && <span className="text-xs text-muted-foreground">← sản xuất <Link href={`/breed-production/${production.id}`} className="font-mono hover:underline">{production.code}</Link> · {production.season} · {production.facility}</span>}
                </li>
              ))}
              <li className="text-xs text-muted-foreground">Nguồn giống gốc: {stock ? `${stock.kind} ${stock.name} (${stock.code})` : "chưa ghi"}</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Giao nhận</CardTitle><CardDescription>Lập phiếu giao ở trang Đơn hàng & giao nhận</CardDescription></CardHeader>
          <CardContent><LinkList items={myDeliveries.map((d) => ({ key: d.id, href: "/breed-orders", code: d.code, text: `${fmtDateVN(d.deliveredAt)} · ${d.quantity.toLocaleString("vi-VN")} ${s.unit} · ${d.receiver}` }))} empty="Chưa giao" /></CardContent>
        </Card>
      </main>
    </>
  );
}
