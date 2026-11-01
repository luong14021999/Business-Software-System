import Link from "next/link";
import {
  ClipboardCheck,
  Dna,
  Factory,
  Package,
  Truck,
  Layers,
  MapPin,
  Newspaper,
  Fence,
  ScanSearch,
  ShoppingCart,
  Sprout,
  Wheat,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { FacilityMap } from "@/components/m3/facility-map";
import { VarietyCatalogue, type CatalogueVariety } from "@/components/m3/breed-overview/variety-catalogue";
import { SeedLadder, type LadderStep } from "@/components/m3/breed-overview/seed-ladder";
import { TrialPipeline, TrialTrack, type TrackTrial } from "@/components/m3/breed-overview/trial-track";
import { EmptyNote, Plot, SectionHeading, brandStyle, fmtNum, furrowStyle } from "@/components/m3/breed-overview/shared";
import {
  BREED_KINDS,
  breedOrderStore,
  breedTrialStore,
  germplasmStore,
  productionLotStore,
  seedLotStore,
  sourceStockStore,
  varietyStore,
  type ProductionLot,
  type SeedLot,
  type SourceStock,
} from "@/lib/modules/m3/data/breeding";
import { facilityStore, genotypeSampleStore, marketPostStore, markerStore, sequenceRefStore } from "@/lib/modules/m3/data/genomics";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tổng quan giống" };

/** Mỗi truy vấn tự đỡ lỗi – CSDL chưa sẵn sàng thì khối tương ứng hiện trống, trang vẫn dựng được. */
const safe = <T,>(p: Promise<T[]>) => p.catch(() => [] as T[]);

const CROP_STOCKS = new Set(["Cây đầu dòng", "Vườn cây đầu dòng"]);
const OPEN_ORDER = new Set(["Mới", "Đã xác nhận", "Giao một phần"]);

type LadderDef = { label: string; hint?: string; levels: string[] }[];
const CROP_LADDER: LadderDef = [
  { label: "Giống tác giả", levels: ["Giống tác giả"] },
  { label: "Siêu nguyên chủng", levels: ["Siêu nguyên chủng"] },
  { label: "Nguyên chủng", levels: ["Nguyên chủng"] },
  { label: "Xác nhận", hint: "XN, XN1, XN2", levels: ["Xác nhận", "Xác nhận 1", "Xác nhận 2"] },
];
const ANIMAL_LADDER: LadderDef = [
  { label: "Giống cụ kỵ", levels: ["Giống cụ kỵ"] },
  { label: "Giống ông bà", levels: ["Giống ông bà"] },
  { label: "Giống bố mẹ", levels: ["Giống bố mẹ"] },
  { label: "Giống thương phẩm", levels: ["Giống thương phẩm"] },
];

function buildLadder(def: LadderDef, sources: SourceStock[], sourceHint: string, sourceUnit: string, seedLots: SeedLot[], production: ProductionLot[]): LadderStep[] {
  const head: LadderStep = {
    label: "Nguồn giống gốc",
    hint: sourceHint,
    lots: sources.length,
    certified: sources.filter((s) => s.recognitionNo).length,
    producing: 0,
    quantities: sources.map((s) => ({ quantity: s.quantity, unit: sourceUnit })),
    href: "/source-stocks",
  };
  return [
    head,
    ...def.map((d) => {
      const lots = seedLots.filter((s) => d.levels.includes(s.level));
      return {
        label: d.label,
        hint: d.hint,
        lots: lots.length,
        certified: lots.filter((s) => s.status === "Đạt" || s.status === "Đã chứng nhận").length,
        producing: production.filter((p) => d.levels.includes(p.level) && p.status === "Đang sản xuất").length,
        quantities: lots,
        href: `/seed-lots?q=${encodeURIComponent(d.levels[0])}`,
      };
    }),
  ];
}

/** % thời gian đã trôi qua giữa ngày bắt đầu và ngày kết thúc dự kiến. */
function progressOf(startAt: string, endAt: string, today: string) {
  const s = Date.parse(startAt), e = Date.parse(endAt), t = Date.parse(today);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return null;
  return Math.max(0, Math.min(100, Math.round(((t - s) / (e - s)) * 100)));
}

export default async function BreedOverviewPage() {
  const [varieties, trials, germplasm, sources, production, seedLots, orders, facilities, markers, samples, sequences, posts] = await Promise.all([
    safe(varietyStore.list()),
    safe(breedTrialStore.list()),
    safe(germplasmStore.list()),
    safe(sourceStockStore.list()),
    safe(productionLotStore.list()),
    safe(seedLotStore.list()),
    safe(breedOrderStore.list()),
    safe(facilityStore.list()),
    safe(markerStore.list()),
    safe(genotypeSampleStore.list()),
    safe(sequenceRefStore.list()),
    safe(marketPostStore.list()),
  ]);
  const today = todayISO();
  const varietyById = byId(varieties);
  const varietyName = (id: string) => varietyById.get(id)?.name ?? "";
  const kindOf = (id: string) => varietyById.get(id)?.kind ?? "";

  // ── Danh mục giống ────────────────────────────────────────────────
  const catalogue: CatalogueVariety[] = varieties.map((v) => ({
    id: v.id,
    code: v.code,
    name: v.name,
    kind: v.kind,
    species: v.species,
    origin: v.origin,
    owner: v.owner,
    status: v.status,
    circulationType: v.circulationType,
    recognitionNo: v.recognitionNo,
    regions: v.regions,
  }));
  const recognized = varieties.filter((v) => v.recognitionNo).length;
  const circulating = varieties.filter((v) => v.circulationType && v.circulationType !== "Chưa lưu hành").length;

  // ── Bậc thang cấp giống ──────────────────────────────────────────
  const isAnimalLot = (s: { varietyId: string }) => kindOf(s.varietyId) === "Vật nuôi" || kindOf(s.varietyId) === "Thủy sản";
  const cropLadder = buildLadder(
    CROP_LADDER,
    sources.filter((s) => CROP_STOCKS.has(s.kind)),
    "cây / vườn đầu dòng",
    "cây",
    seedLots.filter((s) => !isAnimalLot(s)),
    production.filter((p) => !isAnimalLot(p)),
  );
  const animalLadder = buildLadder(
    ANIMAL_LADDER,
    sources.filter((s) => !CROP_STOCKS.has(s.kind)),
    "đàn giống gốc",
    "con",
    seedLots.filter(isAnimalLot),
    production.filter(isAnimalLot),
  );

  // ── Khảo nghiệm – kiểm định – chứng nhận ─────────────────────────
  const ongoing = trials.filter((t) => t.result === "Đang theo dõi");
  const trackTrials: TrackTrial[] = [...ongoing]
    .sort((a, b) => (a.endAt || "9999").localeCompare(b.endAt || "9999"))
    .slice(0, 5)
    .map((t) => ({ id: t.id, code: t.code, variety: varietyName(t.varietyId), kind: t.kind, site: t.site, season: t.season, startAt: t.startAt, endAt: t.endAt, leader: t.leader, progress: progressOf(t.startAt, t.endAt, today) }));
  const stages = [
    { label: "Đang khảo nghiệm", value: ongoing.length, hint: "VCU, DUS, sản xuất thử", href: "/breed-trials" },
    { label: "Khảo nghiệm đạt", value: trials.filter((t) => t.result === "Đạt").length, hint: `/${trials.length} khảo nghiệm`, href: "/breed-trials" },
    { label: "Lô chờ kiểm định", value: seedLots.filter((s) => s.status === "Chờ kiểm định").length, hint: "kiểm định đồng ruộng, lấy mẫu", href: "/seed-lots" },
    { label: "Lô đã chứng nhận", value: seedLots.filter((s) => s.status === "Đã chứng nhận").length, hint: "chứng nhận, hợp quy", href: "/seed-lots" },
  ];

  // ── Nguồn gen & phân tử ──────────────────────────────────────────
  const conserving = germplasm.filter((g) => g.status === "Đang lưu giữ").length;
  const needRestore = germplasm.filter((g) => g.status === "Cần phục tráng").length;
  const byMethod = [...germplasm.reduce((m, g) => m.set(g.conservation || "Khác", (m.get(g.conservation || "Khác") ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);

  // ── Cơ sở sản xuất ───────────────────────────────────────────────
  const activeFacilities = facilities.filter((f) => f.status === "Đang hoạt động");
  const byDistrict = [...activeFacilities.reduce((m, f) => m.set(f.district || "Chưa rõ", (m.get(f.district || "Chưa rõ") ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const maxDistrict = Math.max(1, ...byDistrict.map(([, n]) => n));
  const points = facilities
    .filter((f) => f.latitude != null && f.longitude != null)
    .map((f) => ({ id: f.id, lat: f.latitude!, lng: f.longitude!, title: `${f.code} · ${f.name}`, subtitle: [f.kind, f.species, f.scale].filter(Boolean).join(" · "), kind: f.kind }));

  // ── Thị trường & cung ứng ────────────────────────────────────────
  const latestPosts = [...posts].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")).slice(0, 4);
  const openOrders = orders.filter((o) => OPEN_ORDER.has(o.status));
  const nextOrders = [...openOrders].sort((a, b) => (a.dueAt || "9999").localeCompare(b.dueAt || "9999")).slice(0, 4);

  return (
    <>
      <Header title="Tổng quan giống" description="Danh mục giống, hệ thống sản xuất theo cấp, khảo nghiệm – chứng nhận, nguồn gen và cung ứng giống" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        {/* Băng giới thiệu: số liệu nằm trong câu chữ, không dùng lưới thẻ thống kê. */}
        <section aria-labelledby="breed-hero" className="relative overflow-hidden rounded-2xl text-primary-foreground shadow-sm" style={brandStyle}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(160deg, rgb(255 255 255 / 0.10) 0 2px, transparent 2px 22px)" }} aria-hidden />
          <Sprout className="absolute -right-6 -bottom-8 w-40 h-40 text-white/10 sm:w-56 sm:h-56" strokeWidth={1} aria-hidden />
          <div className="relative p-5 sm:p-7 space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">M3.2 · Giống cây trồng, vật nuôi, thủy sản</p>
              <h2 id="breed-hero" className="text-xl sm:text-2xl font-bold leading-tight">Từ hạt giống tác giả đến ruộng của nông dân</h2>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-10">
              {[
                { k: "giống trong danh mục", v: varieties.length },
                { k: "được công nhận", v: recognized },
                { k: "đã lưu hành", v: circulating },
              ].map((x) => (
                <div key={x.k} className="flex flex-col-reverse">
                  <dt className="text-xs text-white/75">{x.k}</dt>
                  <dd className="text-2xl sm:text-3xl font-bold tabular-nums">{fmtNum(x.v)}</dd>
                </div>
              ))}
            </dl>
            <nav aria-label="Lối tắt" className="flex flex-wrap gap-2">
              {[
                { href: "/varieties", label: "Lý lịch giống" },
                { href: "/breed-production", label: "Sản xuất theo cấp" },
                { href: "/blast", label: "Tra cứu BLAST" },
                { href: "/breed-facilities", label: "Bản đồ cơ sở" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <Plot labelledBy="breed-catalogue">
          <SectionHeading id="breed-catalogue" icon={Wheat} title="Danh mục giống" description="Giống đã công nhận, lưu hành được ưu tiên hiển thị – bấm thẻ để xem lý lịch và hồ sơ pháp lý" href="/varieties" />
          <VarietyCatalogue varieties={catalogue} kinds={BREED_KINDS} />
        </Plot>

        <Plot labelledBy="breed-ladder">
          <SectionHeading id="breed-ladder" icon={Layers} title="Hệ thống giống theo cấp" description="Số lô giống và sản lượng ở từng cấp, từ nguồn giống gốc đến giống xác nhận / thương phẩm" href="/breed-production" linkLabel="Sản xuất theo cấp" />
          <div className="grid gap-4 lg:grid-cols-2">
            <SeedLadder title="Cây trồng" icon={Wheat} steps={cropLadder} />
            <SeedLadder title="Vật nuôi · thủy sản" icon={Fence} steps={animalLadder} />
          </div>
        </Plot>

        <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
          <Plot labelledBy="breed-trials">
            <SectionHeading id="breed-trials" icon={ClipboardCheck} title="Khảo nghiệm – kiểm định – chứng nhận" description="Khảo nghiệm đang theo dõi, sắp xếp theo ngày kết thúc dự kiến" href="/breed-trials" />
            <TrialPipeline stages={stages} />
            <TrialTrack trials={trackTrials} />
          </Plot>

          <Plot labelledBy="breed-genetics">
            <SectionHeading id="breed-genetics" icon={Dna} title="Nguồn gen & chỉ thị phân tử" description="Lưu giữ, phục tráng nguồn gen; nhận dạng giống bằng chỉ thị ADN" href="/germplasm" linkLabel="Nguồn gen" />
            <div className="rounded-xl p-4" style={furrowStyle}>
              <p className="text-3xl font-bold tabular-nums text-primary">{fmtNum(germplasm.length)}</p>
              <p className="text-xs text-muted-foreground">mẫu nguồn gen · {fmtNum(conserving)} đang lưu giữ{needRestore > 0 && <> · <span className="font-medium text-amber-700 dark:text-amber-400">{fmtNum(needRestore)} cần phục tráng</span></>}</p>
              {byMethod.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Phương thức bảo tồn">
                  {byMethod.map(([m, n]) => <li key={m}><Badge variant="outline" className="bg-card/80 text-[10px]">{m} · {n}</Badge></li>)}
                </ul>
              )}
            </div>
            <ul className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "chỉ thị", value: markers.length, href: "/markers" },
                { label: "mẫu kiểu gen", value: samples.length, href: "/genotypes" },
                { label: "trình tự tham chiếu", value: sequences.length, href: "/blast" },
              ].map((x) => (
                <li key={x.label}>
                  <Link href={x.href} className="block rounded-lg border border-border bg-muted/40 px-2 py-2 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="block text-lg font-semibold tabular-nums">{fmtNum(x.value)}</span>
                    <span className="block text-[11px] leading-tight text-muted-foreground">{x.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/blast" className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="grid place-items-center w-9 h-9 shrink-0 rounded-lg bg-primary text-primary-foreground" aria-hidden><ScanSearch className="w-4 h-4" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">So khớp trình tự BLAST</span>
                <span className="block text-[11px] text-muted-foreground">Dán trình tự ADN để đối chiếu với cơ sở dữ liệu gen của Viện</span>
              </span>
            </Link>
          </Plot>
        </div>

        <Plot labelledBy="breed-facilities">
          <SectionHeading id="breed-facilities" icon={Factory} title="Cơ sở sản xuất giống" description={`${fmtNum(activeFacilities.length)} cơ sở đang hoạt động · ${fmtNum(activeFacilities.filter((f) => f.kind === "Của Viện").length)} của Viện, ${fmtNum(activeFacilities.filter((f) => f.kind === "Liên kết").length)} liên kết`} href="/breed-facilities" linkLabel="Mở bản đồ" />
          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><MapPin className="w-3.5 h-3.5" aria-hidden /> Theo huyện / thị xã</h3>
              {byDistrict.length === 0 ? (
                <EmptyNote>Chưa có cơ sở đang hoạt động.</EmptyNote>
              ) : (
                <ul className="space-y-2">
                  {byDistrict.slice(0, 8).map(([d, n]) => (
                    <li key={d} className="grid grid-cols-[7rem_1fr_1.5rem] items-center gap-2 text-xs">
                      <span className="truncate" title={d}>{d}</span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-primary/10" aria-hidden>
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round((n / maxDistrict) * 100)}%` }} />
                      </span>
                      <span className="text-right tabular-nums font-medium">{n}</span>
                    </li>
                  ))}
                  {byDistrict.length > 8 && <li className="text-[11px] text-muted-foreground">và {byDistrict.length - 8} địa bàn khác</li>}
                </ul>
              )}
            </div>
            {points.length > 0 ? (
              <FacilityMap points={points} />
            ) : (
              <div className="grid min-h-48 place-items-center rounded-xl text-center" style={furrowStyle}>
                <div className="space-y-1 p-4">
                  <MapPin className="mx-auto w-8 h-8 text-primary/50" aria-hidden />
                  <p className="text-xs text-muted-foreground">Chưa có cơ sở nào được gắn tọa độ.</p>
                  <Link href="/breed-facilities" className="text-xs font-medium text-primary hover:underline">Nhập vĩ độ, kinh độ ở trang cơ sở →</Link>
                </div>
              </div>
            )}
          </div>
        </Plot>

        <div className="grid gap-6 lg:grid-cols-2">
          <Plot labelledBy="breed-market">
            <SectionHeading id="breed-market" icon={Newspaper} title="Tin thị trường & kỹ thuật" description="Thông tin thị trường, mô hình hiệu quả, nguồn giống" href="/market-posts" />
            {latestPosts.length === 0 ? (
              <EmptyNote>Chưa có bản tin.</EmptyNote>
            ) : (
              <ul className="space-y-3">
                {latestPosts.map((p) => (
                  <li key={p.id} className="flex gap-3">
                    <span className="grid place-items-center w-12 h-12 shrink-0 rounded-lg" style={furrowStyle} aria-hidden><Sprout className="w-5 h-5 text-primary/60" /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5">{p.kind}</Badge>
                        {p.isPublic && <Badge variant="success" className="text-[10px] px-1.5">Công khai</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm font-medium leading-snug line-clamp-2">{p.title}</p>
                      <p className="text-[11px] text-muted-foreground">{[fmtDateVN(p.publishedAt), varietyName(p.varietyId), p.area, p.priceNote].filter(Boolean).join(" · ")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Plot>

          <Plot labelledBy="breed-orders">
            <SectionHeading id="breed-orders" icon={ShoppingCart} title="Đơn đặt giống đang mở" description={`${fmtNum(openOrders.length)} đơn mới, đã xác nhận hoặc đang giao – gần hạn giao trước`} href="/breed-orders" />
            {nextOrders.length === 0 ? (
              <EmptyNote>Không có đơn đang mở.</EmptyNote>
            ) : (
              <ul className="divide-y divide-border">
                {nextOrders.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-2.5">
                    <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-accent text-primary" aria-hidden><Package className="w-4 h-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium"><span className="font-mono text-[11px] text-primary">{o.code}</span> · {varietyName(o.varietyId) || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">{[o.level, o.season, o.dueAt && `hạn ${fmtDateVN(o.dueAt)}`].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{fmtNum(o.quantity)} <span className="text-[11px] font-normal text-muted-foreground">{o.unit}</span></p>
                      <Badge variant={o.status === "Mới" ? "warning" : "outline"} className="text-[10px] px-1.5">{o.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/breed-supply" className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Truck className="w-3.5 h-3.5 text-primary" aria-hidden /> Cân đối cung – cầu giống theo vùng, mùa vụ →
            </Link>
          </Plot>
        </div>
      </main>
    </>
  );
}
