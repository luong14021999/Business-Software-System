import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Dna, ExternalLink, FileText, GitBranch, MapPinned, Tractor } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { DossierSection, DossierTabs, MiniTable, type DossierTab } from "@/components/m3/dossier/dossier-parts";
import { qtyByUnit } from "@/components/m3/breed-overview/shared";
import {
  breedDemandStore,
  breedOrderStore,
  breedTrialStore,
  deliveryStore,
  individualStore,
  productionLotStore,
  seedLotStore,
  sourceStockStore,
  varietyDocumentStore,
  varietyStore,
} from "@/lib/modules/m3/data/breeding";
import { distributionStore, facilityStore, genotypeCallStore, genotypeSampleStore, marketPostStore, sequenceRefStore } from "@/lib/modules/m3/data/genomics";
import { safeUrl } from "@/lib/platform/format";
import { DOC_KINDS, INBREEDING_WARN, inbreeding, validityAlert } from "@/lib/modules/m3/breeding-rules";
import { levelSteps, seedLotLeft } from "@/lib/modules/m3/breed-workspace";
import { varietyFields } from "@/lib/modules/m3/variety-fields";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { currentAccess } from "@/lib/platform/data/access";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hồ sơ giống" };

const TAB_KEYS = ["tong-quan", "nguon-goc", "khao-nghiem", "san-xuat", "adn", "phan-bo"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const vn = (x: number) => (Number(x) || 0).toLocaleString("vi-VN");
const statusVariant: Record<string, "warning" | "success" | "default" | "secondary" | "destructive" | "outline"> = {
  "Đang khảo nghiệm": "warning",
  "Được công nhận": "success",
  "Lưu hành": "default",
  "Ngừng sản xuất": "secondary",
  "Đạt": "success",
  "Không đạt": "destructive",
  "Đang theo dõi": "warning",
  "Đã chứng nhận": "success",
  "Chờ kiểm định": "warning",
  "Hết hiệu lực": "secondary",
};

/** Hồ sơ giống (M3.2) – trung tâm của phần mềm Giống: mọi dữ liệu của một giống theo tab. */
export default async function VarietyDossierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: TabKey = (TAB_KEYS as readonly string[]).includes(sp.tab ?? "") ? (sp.tab as TabKey) : "tong-quan";
  const [varieties, docs, stocks, trials, prodLots, seedLots, deliveries, orders, demands, individuals, samples, calls, seqRefs, distributions, posts, facilities, customers, access] = await Promise.all([
    varietyStore.list(),
    varietyDocumentStore.list(),
    sourceStockStore.list(),
    breedTrialStore.list(),
    productionLotStore.list(),
    seedLotStore.list(),
    deliveryStore.list(),
    breedOrderStore.list(),
    breedDemandStore.list(),
    individualStore.list(),
    genotypeSampleStore.list().catch(() => []),
    genotypeCallStore.list().catch(() => []),
    sequenceRefStore.list().catch(() => []),
    distributionStore.list().catch(() => []),
    marketPostStore.list().catch(() => []),
    facilityStore.list().catch(() => []),
    getCustomers(),
    currentAccess(),
  ]);
  const v = varieties.find((x) => x.id === id);
  if (!v) notFound();
  const today = todayISO();
  const base = `/varieties/${id}`;
  const canWrite = access.can("write.breeding");
  const customerById = byId(customers);
  const facilityById = byId(facilities);

  const myDocs = docs.filter((d) => d.varietyId === id).sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || ""));
  const docAlerts = myDocs.filter((d) => validityAlert(d.validUntil, today));
  const myStocks = stocks.filter((s) => s.varietyId === id);
  const myIndividuals = individuals.filter((i) => i.varietyId === id || myStocks.some((s) => s.id === i.stockId));
  const myTrials = trials.filter((t) => t.varietyId === id).sort((a, b) => (b.startAt || "").localeCompare(a.startAt || ""));
  const myProd = prodLots.filter((p) => p.varietyId === id).sort((a, b) => (b.startedAt || "").localeCompare(a.startedAt || ""));
  const mySeed = seedLots.filter((s) => s.varietyId === id).sort((a, b) => (b.producedAt || "").localeCompare(a.producedAt || ""));
  const myOrders = orders.filter((o) => o.varietyId === id && o.status !== "Hủy");
  const mySamples = samples.filter((s) => s.varietyId === id);
  const mySeqs = seqRefs.filter((s) => s.varietyId === id);
  const myDist = distributions.filter((d) => d.varietyId === id).sort((a, b) => b.year - a.year || a.district.localeCompare(b.district, "vi"));
  const myPosts = posts.filter((p) => p.varietyId === id).sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  const myDemands = demands.filter((d) => d.varietyId === id);
  const seedAlerts = mySeed.filter((s) => (s.status === "Đạt" || s.status === "Đã chứng nhận") && validityAlert(s.conformityUntil, today));

  const tabs: DossierTab[] = [
    { key: "tong-quan", label: "Tổng quan & pháp lý", icon: FileText, count: myDocs.length, alert: docAlerts.length > 0 },
    { key: "nguon-goc", label: "Nguồn gốc & phả hệ", icon: GitBranch, count: myStocks.length + myIndividuals.length },
    { key: "khao-nghiem", label: "Khảo nghiệm", icon: ClipboardCheck, count: myTrials.length },
    { key: "san-xuat", label: "Sản xuất & lô giống", icon: Tractor, count: mySeed.length, alert: seedAlerts.length > 0 },
    { key: "adn", label: "ADN & trình tự", icon: Dna, count: mySamples.length + mySeqs.length },
    { key: "phan-bo", label: "Phân bố & thị trường", icon: MapPinned, count: myDist.length + myPosts.length },
  ];

  let body;
  if (tab === "tong-quan") {
    const docFields: CrudField[] = [
      { name: "varietyId", label: "Giống", type: "select", options: [{ value: v.id, label: v.name }], defaultValue: v.id },
      { name: "kind", label: "Loại văn bản", type: "select", options: [...DOC_KINDS] },
      { name: "number", label: "Số hiệu", mono: true },
      { name: "issuedAt", label: "Ngày ban hành", type: "date" },
      { name: "issuer", label: "Cơ quan ban hành" },
      { name: "validUntil", label: "Hiệu lực đến (nếu có)", type: "date" },
      { name: "url", label: "Bản điện tử (https://…)", full: true },
      { name: "note", label: "Ghi chú", type: "textarea" },
    ];
    body = (
      <>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <DossierSection title="Lý lịch giống">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-muted-foreground">Nguồn gốc</dt><dd>{v.origin || "—"}</dd>
              <dt className="text-muted-foreground">Tác giả / chủ sở hữu</dt><dd>{v.owner || "—"}</dd>
              <dt className="text-muted-foreground">Công nhận</dt><dd>{v.recognitionNo ? `QĐ ${v.recognitionNo} ngày ${fmtDateVN(v.recognizedAt)}` : "—"}</dd>
              <dt className="text-muted-foreground">Lưu hành</dt><dd>{v.circulationType}{v.circulationNo && ` · ${v.circulationNo}`}{v.circulationAt && ` · ${fmtDateVN(v.circulationAt)}`}</dd>
              <dt className="text-muted-foreground">Vùng khuyến cáo</dt><dd>{v.regions || "—"}</dd>
              <dt className="text-muted-foreground">Diện tích trên địa bàn</dt><dd>{v.areaHa ? `${vn(v.areaHa)} ha` : "—"}</dd>
              <dt className="text-muted-foreground">Cổng công khai</dt><dd>{v.isPublic ? <Link href="/portal/giong" target="_blank" className="text-primary hover:underline">Đang giới thiệu</Link> : "Không giới thiệu"}</dd>
            </dl>
            {v.traits && <p className="mt-3 whitespace-pre-line text-sm"><span className="text-muted-foreground">Đặc điểm: </span>{v.traits}</p>}
          </DossierSection>
          <DossierSection title="Cần chú ý">
            <ul className="space-y-2 text-sm">
              {docAlerts.map((d) => {
                const a = validityAlert(d.validUntil, today)!;
                return <li key={d.id} className="text-rose-600">{d.kind} {d.number}: {a.kind.toLowerCase()} {a.days} ngày</li>;
              })}
              {seedAlerts.map((s) => {
                const a = validityAlert(s.conformityUntil, today)!;
                return <li key={s.id}><Link href={`/seed-lots/${s.id}`} className="text-amber-700 hover:underline dark:text-amber-400">Lô {s.code}: hợp quy {a.kind.toLowerCase()} {a.days} ngày</Link></li>;
              })}
              {myTrials.filter((t) => t.result === "Đang theo dõi").map((t) => <li key={t.id}><Link href={`/breed-trials/${t.id}`} className="hover:underline">Khảo nghiệm {t.code} đang theo dõi{t.endAt && ` – kết thúc ${fmtDateVN(t.endAt)}`}</Link></li>)}
              {docAlerts.length + seedAlerts.length + myTrials.filter((t) => t.result === "Đang theo dõi").length === 0 && <li className="text-muted-foreground">Không có việc cần chú ý.</li>}
            </ul>
          </DossierSection>
        </div>
        <CrudTableCard
          title="Văn bản pháp lý"
          description="Văn bản có thời hạn được cảnh báo trước 90 ngày khi sắp hết hiệu lực"
          endpoint="/api/variety-documents"
          entity="variety-documents"
          editFields={docFields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/variety-documents" title="Thêm văn bản" fields={docFields} addLabel="Thêm văn bản" />}
          headers={["Loại", "Số hiệu · ngày", "Cơ quan", "Hiệu lực", "Bản điện tử"]}
          emptyText="Chưa có văn bản"
          rows={myDocs.map((d) => {
            const a = validityAlert(d.validUntil, today);
            const url = safeUrl(d.url);
            return {
              id: d.id,
              label: `${d.kind} ${d.number}`,
              initial: d,
              cells: [
                <span key="k" className="text-sm">{d.kind}</span>,
                <div key="n" className="text-xs"><span className="font-mono">{d.number || "—"}</span><div className="text-muted-foreground">{fmtDateVN(d.issuedAt)}</div></div>,
                <span key="i" className="text-xs">{d.issuer || "—"}</span>,
                <span key="v" className={`text-xs ${a ? (a.kind === "Hết hiệu lực" ? "text-rose-600 font-medium" : "text-amber-600") : ""}`}>{d.validUntil ? `${fmtDateVN(d.validUntil)}${a ? ` · ${a.kind.toLowerCase()} ${a.days} ngày` : ""}` : "không thời hạn"}</span>,
                url ? <a key="u" href={url} target="_blank" rel="noreferrer noopener" className="text-xs text-primary inline-flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" />Mở</a> : <span key="u" className="text-xs text-muted-foreground">—</span>,
              ],
            };
          })}
        />
      </>
    );
  } else if (tab === "nguon-goc") {
    const F = inbreeding(individuals);
    body = (
      <div className="grid gap-4 xl:grid-cols-2">
        <DossierSection title="Cây đầu dòng, vườn, đàn giống gốc" action={<Link href="/source-stocks" className="text-xs text-primary hover:underline">Quản lý →</Link>}>
          <MiniTable
            headers={["Mã", "Loại · tên", "Số lượng", "Công nhận", "Trạng thái"]}
            empty="Chưa ghi nguồn giống gốc"
            rows={myStocks.map((s) => {
              const a = validityAlert(s.validUntil, today);
              return [
                <Link key="c" href={`/source-stocks?q=${encodeURIComponent(s.code)}`} className="font-mono text-xs text-primary hover:underline">{s.code}</Link>,
                <div key="n" className="text-xs"><div className="font-medium">{s.name}</div><div className="text-muted-foreground">{s.kind} · {s.location}</div></div>,
                <span key="q" className="text-xs tabular-nums">{vn(s.quantity)}</span>,
                <span key="r" className={`text-xs ${a ? "text-rose-600" : ""}`}>{s.recognitionNo || "—"}{s.validUntil && ` · đến ${fmtDateVN(s.validUntil)}`}</span>,
                <Badge key="s" variant="outline">{s.status}</Badge>,
              ];
            })}
          />
        </DossierSection>
        <DossierSection title="Cá thể & phả hệ" description="Bấm số hiệu để mở cây phả hệ và ghép phối thử" action={<Link href="/pedigree" className="text-xs text-primary hover:underline">Cây phả hệ →</Link>}>
          <MiniTable
            headers={["Số hiệu", "Giới tính · thế hệ", "Bố × mẹ", "F", "Tình trạng"]}
            empty="Chưa có cá thể"
            rows={myIndividuals.slice(0, 50).map((i) => {
              const f = F.of(i.id);
              const code = (x: string) => individuals.find((n) => n.id === x)?.code ?? "?";
              return [
                <Link key="c" href={`/pedigree?id=${i.id}`} className="font-mono text-xs text-primary hover:underline">{i.code}</Link>,
                <span key="s" className="text-xs">{i.sex} · {i.generation || "—"}</span>,
                <span key="p" className="text-xs text-muted-foreground">{i.sireId || i.damId ? `${i.sireId ? code(i.sireId) : "?"} × ${i.damId ? code(i.damId) : "?"}` : "—"}</span>,
                <span key="f" className={`text-xs tabular-nums ${f >= INBREEDING_WARN ? "font-semibold text-rose-600" : ""}`}>{(f * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%</span>,
                <span key="t" className="text-xs">{i.status}</span>,
              ];
            })}
          />
        </DossierSection>
      </div>
    );
  } else if (tab === "khao-nghiem") {
    body = (
      <DossierSection title="Khảo nghiệm VCU, DUS, sản xuất thử" description="Kết quả đánh giá theo bộ chỉ tiêu ở trang chi tiết khảo nghiệm" action={<Link href="/breed-trials" className="text-xs text-primary hover:underline">Tất cả khảo nghiệm →</Link>}>
        {myTrials.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có khảo nghiệm.</p>
        ) : (
          <ol className="relative space-y-4 border-l pl-5">
            {myTrials.map((t) => (
              <li key={t.id} className="relative">
                <span aria-hidden className={`absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-card ${t.result === "Đạt" ? "bg-emerald-500" : t.result === "Không đạt" ? "bg-rose-500" : "bg-amber-400"}`} />
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/breed-trials/${t.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{t.code}</Link>
                  <Badge variant="outline">{t.kind}</Badge>
                  <Badge variant={statusVariant[t.result] ?? "secondary"}>{t.result}</Badge>
                </div>
                <div className="text-sm">{[t.site, t.season].filter(Boolean).join(" · ") || "—"}</div>
                <div className="text-xs text-muted-foreground">{[t.startAt && `${fmtDateVN(t.startAt)} – ${fmtDateVN(t.endAt) || "…"}`, t.leader, t.yield && `năng suất ${t.yield}`].filter(Boolean).join(" · ")}</div>
              </li>
            ))}
          </ol>
        )}
      </DossierSection>
    );
  } else if (tab === "san-xuat") {
    const steps = levelSteps(mySeed, myProd, deliveries);
    const deliveredOf = (orderId: string) => deliveries.filter((d) => d.orderId === orderId).reduce((s, d) => s + d.quantity, 0);
    body = (
      <>
        <DossierSection title="Bậc thang cấp giống" description="Lô giống theo cấp – cấp cao ở trên; lượng còn lại chỉ tính lô đạt / đã chứng nhận" action={<Link href="/seed-workbench" className="text-xs text-primary hover:underline">Bàn sản xuất giống →</Link>}>
          {steps.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có lô sản xuất / lô giống.</p>
          ) : (
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={s.level} className="flex flex-wrap items-center gap-3 rounded-lg border p-3" style={{ marginLeft: `${Math.min(i, 4) * 1}rem` }}>
                  <span className="w-40 shrink-0 text-sm font-semibold">{s.level}</span>
                  <span className="text-xs text-muted-foreground">{s.lots} lô giống · {s.certified} đã chứng nhận · {s.producing} lô đang sản xuất</span>
                  <span className="ml-auto text-sm font-medium tabular-nums text-primary">{qtyByUnit(s.left) || "—"}</span>
                </li>
              ))}
            </ol>
          )}
        </DossierSection>
        <div className="grid gap-4 xl:grid-cols-2">
          <DossierSection title="Lô giống">
            <MiniTable
              headers={["Mã", "Cấp", "Còn / tổng", "Trạng thái", "Hợp quy"]}
              empty="Chưa có lô giống"
              rows={mySeed.map((s) => {
                const a = validityAlert(s.conformityUntil, today);
                return [
                  <Link key="c" href={`/seed-lots/${s.id}`} className="font-mono text-xs text-primary hover:underline">{s.code}</Link>,
                  <span key="l" className="text-xs">{s.level}</span>,
                  <span key="q" className="text-xs tabular-nums">{vn(seedLotLeft(s, deliveries))}/{vn(s.quantity)} {s.unit}</span>,
                  <Badge key="s" variant={statusVariant[s.status] ?? "secondary"}>{s.status}</Badge>,
                  <span key="h" className={`text-xs ${a ? (a.kind === "Hết hiệu lực" ? "text-rose-600" : "text-amber-600") : "text-muted-foreground"}`}>{s.conformityUntil ? fmtDateVN(s.conformityUntil) : "—"}</span>,
                ];
              })}
            />
          </DossierSection>
          <DossierSection title="Lô sản xuất">
            <MiniTable
              headers={["Mã", "Cấp · vụ", "Nơi sản xuất", "Sản lượng", "Trạng thái"]}
              empty="Chưa có lô sản xuất"
              rows={myProd.map((p) => [
                <Link key="c" href={`/breed-production/${p.id}`} className="font-mono text-xs text-primary hover:underline">{p.code}</Link>,
                <span key="l" className="text-xs">{p.level}{p.season && ` · ${p.season}`}</span>,
                <span key="f" className="text-xs">{p.facility || facilityById.get(p.facilityId)?.name || "—"}</span>,
                <span key="q" className="text-xs tabular-nums">{vn(p.actualQty || p.plannedQty)} {p.unit}{!p.actualQty && p.plannedQty ? " (KH)" : ""}</span>,
                <span key="s" className="text-xs">{p.status}</span>,
              ])}
            />
          </DossierSection>
        </div>
        <DossierSection title="Đơn hàng & nhu cầu" action={<Link href="/breed-supply" className="text-xs text-primary hover:underline">Cân đối cung – cầu →</Link>}>
          <MiniTable
            headers={["Đơn", "Khách hàng", "Cấp", "Đã giao / đặt", "Hạn giao", "Trạng thái"]}
            empty="Chưa có đơn hàng"
            rows={myOrders.map((o) => [
              <Link key="c" href={`/breed-orders?q=${encodeURIComponent(o.code)}`} className="font-mono text-xs text-primary hover:underline">{o.code}</Link>,
              <span key="k" className="text-xs">{customerById.get(o.customerId)?.name ?? "—"}</span>,
              <span key="l" className="text-xs">{o.level}</span>,
              <span key="q" className="text-xs tabular-nums">{vn(deliveredOf(o.id))}/{vn(o.quantity)} {o.unit}</span>,
              <span key="d" className="text-xs">{fmtDateVN(o.dueAt)}</span>,
              <span key="s" className="text-xs">{o.status}</span>,
            ])}
          />
          {myDemands.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Nhu cầu đã ghi nhận: {myDemands.map((d) => `${d.area} ${d.season}: ${vn(d.quantity)} ${d.unit}`).join(" · ")}</p>}
        </DossierSection>
      </>
    );
  } else if (tab === "adn") {
    const nCalls = (sampleId: string) => calls.filter((c) => c.sampleId === sampleId).length;
    body = (
      <div className="grid gap-4 xl:grid-cols-2">
        <DossierSection title="Mẫu ADN & kiểu gen" description="Giống tham chiếu dùng để nhận dạng, kiểm tra độ thuần" action={<Link href="/genotypes" className="text-xs text-primary hover:underline">Mẫu ADN →</Link>}>
          <MiniTable
            headers={["Mẫu", "Mục đích", "Mã PTN", "Ngày lấy", "Số chỉ thị"]}
            empty="Chưa có mẫu ADN"
            rows={mySamples.map((s) => [
              <Link key="c" href={`/genotypes/${s.id}`} className="font-mono text-xs text-primary hover:underline">{s.code}</Link>,
              <span key="p" className="text-xs">{s.purpose}</span>,
              <span key="l" className="font-mono text-xs">{s.labSampleCode || "—"}</span>,
              <span key="d" className="text-xs">{fmtDateVN(s.collectedAt)}</span>,
              <span key="n" className="text-xs tabular-nums">{nCalls(s.id)}</span>,
            ])}
          />
        </DossierSection>
        <DossierSection title="Trình tự tham chiếu (BLAST+)" description="Trình tự của giống trong cơ sở dữ liệu đối soát nội bộ" action={<Link href="/blast" className="text-xs text-primary hover:underline">Đối soát trình tự →</Link>}>
          <MiniTable
            headers={["Mã trình tự", "Loại", "Gen / vùng", "Độ dài"]}
            empty="Chưa có trình tự"
            rows={mySeqs.map((s) => [
              <span key="a" className="font-mono text-xs">{s.accession}</span>,
              <span key="m" className="text-xs">{s.molecule}</span>,
              <span key="g" className="text-xs">{s.gene || "—"}</span>,
              <span key="l" className="text-xs tabular-nums">{vn(s.length)} bp</span>,
            ])}
          />
        </DossierSection>
      </div>
    );
  } else {
    const years = [...new Set(myDist.map((d) => d.year))].sort((a, b) => b - a);
    const latest = years[0];
    const latestArea = myDist.filter((d) => d.year === latest).reduce((s, d) => s + d.areaHa, 0);
    const prodFacilities = [...new Set(myProd.map((p) => p.facilityId).filter(Boolean))].map((fid) => facilityById.get(fid)).filter((f): f is NonNullable<typeof f> => Boolean(f));
    body = (
      <>
        <div className="grid gap-4 xl:grid-cols-2">
          <DossierSection title="Phân bố theo địa bàn" description={latest ? `Năm ${latest}: ${vn(latestArea)} ha trên ${myDist.filter((d) => d.year === latest).length} địa bàn` : undefined} action={<Link href="/breed-distributions" className="text-xs text-primary hover:underline">Bản đồ phân bố →</Link>}>
            <MiniTable
              headers={["Năm", "Huyện / thị xã", "Diện tích / quy mô", "Nguồn số liệu"]}
              empty="Chưa có số liệu phân bố"
              rows={myDist.map((d) => [
                <span key="y" className="text-xs tabular-nums">{d.year}</span>,
                <span key="d" className="text-xs">{d.district}</span>,
                <span key="a" className="text-xs tabular-nums">{vn(d.areaHa)} {d.unit || "ha"}</span>,
                <span key="s" className="text-xs text-muted-foreground">{d.source || "—"}</span>,
              ])}
            />
          </DossierSection>
          <DossierSection title="Cơ sở sản xuất giống này" action={<Link href="/breed-facilities" className="text-xs text-primary hover:underline">Bản đồ cơ sở →</Link>}>
            <MiniTable
              headers={["Cơ sở", "Loại", "Địa chỉ"]}
              empty="Chưa gắn cơ sở sản xuất cho lô nào"
              rows={prodFacilities.map((f) => [
                <span key="n" className="text-xs font-medium">{f.code} · {f.name}</span>,
                <span key="k" className="text-xs">{f.kind}</span>,
                <span key="a" className="text-xs text-muted-foreground">{f.address || "—"}</span>,
              ])}
            />
          </DossierSection>
        </div>
        <DossierSection title="Tin thị trường & dịch vụ kỹ thuật" action={<Link href="/market-posts" className="text-xs text-primary hover:underline">Quản lý tin →</Link>}>
          {myPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có tin về giống này.</p>
          ) : (
            <ul className="divide-y">
              {myPosts.map((p) => (
                <li key={p.id} className="py-2">
                  <div className="text-[11px] text-muted-foreground">{[p.kind, fmtDateVN(p.publishedAt), p.area].filter(Boolean).join(" · ")}{p.isPublic && <Badge variant="success" className="ml-2 text-[10px]">Công bố</Badge>}</div>
                  <div className="text-sm font-medium">{p.title}</div>
                  {p.summary && <p className="text-xs text-muted-foreground">{p.summary}</p>}
                </li>
              ))}
            </ul>
          )}
        </DossierSection>
      </>
    );
  }

  return (
    <>
      <Header title={`${v.code} · ${v.name}`} description={`Hồ sơ giống · ${v.kind}${v.species ? ` · ${v.species}` : ""} · ${v.scope}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        <section className="relative overflow-hidden rounded-md border border-t-[3px] border-t-primary bg-card">
          <div className="relative flex flex-wrap items-start gap-4 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              <Link href="/varieties" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Danh mục giống</Link>
              <h2 className="text-xl font-bold tracking-tight">{v.name} <span className="font-mono text-sm font-semibold text-primary">{v.code}</span></h2>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant={statusVariant[v.status] ?? "secondary"}>{v.status}</Badge>
                {v.circulationType && <Badge variant="outline">{v.circulationType}</Badge>}
                {v.isPublic && <Badge variant="success">Trên cổng công khai</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{[v.owner, v.origin, v.regions && `vùng: ${v.regions}`].filter(Boolean).join(" · ")}</p>
            </div>
            {canWrite && <EntityFormDialog mode="edit" endpoint="/api/varieties" id={v.id} title={`Sửa ${v.code}`} fields={varietyFields()} initial={v} />}
          </div>
        </section>
        <DossierTabs base={base} tabs={tabs} active={tab} />
        {body}
      </main>
    </>
  );
}
