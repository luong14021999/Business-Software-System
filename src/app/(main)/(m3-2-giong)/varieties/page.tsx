import Link from "next/link";
import { Sprout, Award, FileCheck2, AlertTriangle, LayoutGrid, Table2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { VarietyCard } from "@/components/m3/breed-overview/variety-catalogue";
import { BREED_KINDS, VARIETY_STATUSES, breedTrialStore, seedLotStore, varietyDocumentStore, varietyStore, type Variety } from "@/lib/modules/m3/data/breeding";
import { VARIETY_SCOPES, validityAlert } from "@/lib/modules/m3/breeding-rules";
import { varietyFields } from "@/lib/modules/m3/variety-fields";
import { matches } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Danh mục giống" };

const statusVariant: Record<Variety["status"], "warning" | "success" | "default" | "secondary"> = {
  "Đang khảo nghiệm": "warning",
  "Được công nhận": "success",
  "Lưu hành": "default",
  "Ngừng sản xuất": "secondary",
};

/** M3.2 – danh mục giống (màn hình vào của phần mềm Giống): thẻ giống, bấm để mở hồ sơ; bảng là chế độ xem phụ. */
export default async function VarietiesPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; scope?: string; status?: string; view?: string }> }) {
  const { q = "", kind = "", scope = "", status = "", view = "" } = await searchParams;
  const table = view === "table";
  const [all, trials, docs, seedLots] = await Promise.all([varietyStore.list(), breedTrialStore.list(), varietyDocumentStore.list(), seedLotStore.list()]);
  const today = todayISO();
  const fields = varietyFields();
  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => a.code.localeCompare(b.code))
    .filter((x) => (!kind || x.kind === kind) && (!scope || x.scope === scope) && (!status || x.status === status) && matches(query, x.code, x.name, x.species, x.owner, x.recognitionNo, x.circulationNo, x.regions));
  const expiring = docs.filter((d) => validityAlert(d.validUntil, today));
  const link = (o: { kind?: string; scope?: string; status?: string; view?: string }) => {
    const p = new URLSearchParams();
    const set = (k: string, v: string) => v && p.set(k, v);
    set("q", q);
    set("kind", o.kind ?? kind);
    set("scope", o.scope ?? scope);
    set("status", o.status ?? status);
    set("view", o.view ?? view);
    return `/varieties${p.size ? `?${p}` : ""}`;
  };
  const filterLink = (k: string, s: string) => link({ kind: k, scope: s });
  const chip = (href: string, label: React.ReactNode, active: boolean, key: string) => (
    <Link key={key} href={href} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>{label}</Link>
  );

  return (
    <>
      <Header title="Danh mục giống" description="Giống của Viện và giống trên địa bàn tỉnh – mở một giống để xem toàn bộ hồ sơ: pháp lý, nguồn gốc, khảo nghiệm, sản xuất, ADN, phân bố" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Giống của Viện", value: all.filter((x) => x.scope !== "Giống trên địa bàn tỉnh").length, icon: Sprout, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Giống trên địa bàn tỉnh", value: all.filter((x) => x.scope === "Giống trên địa bàn tỉnh").length, icon: Award, accent: "bg-blue-50 text-blue-600" },
            { label: "Đã lưu hành", value: all.filter((x) => x.circulationType && x.circulationType !== "Chưa lưu hành").length, icon: FileCheck2, accent: "bg-violet-50 text-violet-600" },
            { label: "Văn bản sắp / hết hiệu lực", value: expiring.length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "trong 90 ngày" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {["", ...VARIETY_SCOPES].map((s) => (
            <Link key={s || "all-scope"} href={filterLink(kind, s)} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${scope === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>{s || "Mọi phạm vi"}</Link>
          ))}
          <span className="w-px h-5 bg-border mx-1" />
          {["", ...BREED_KINDS].map((k) => (
            <Link key={k || "all-kind"} href={filterLink(k, scope)} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${kind === k ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
              {k || "Mọi nhóm"} <span className="ml-1.5 opacity-70">{k ? all.filter((x) => x.kind === k).length : all.length}</span>
            </Link>
          ))}
          <span className="w-px h-5 bg-border mx-1" />
          {["", ...VARIETY_STATUSES].map((st) => chip(link({ status: st }), st || "Mọi trạng thái", status === st, st || "all-status"))}
          <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
            <EntitySearchInput basePath="/varieties" placeholder="Tìm mã, tên, loài, tác giả, số QĐ, vùng…" />
            <div className="inline-flex shrink-0 rounded-md border p-0.5" role="group" aria-label="Kiểu hiển thị">
              <Link href={link({ view: "" })} aria-label="Dạng thẻ" className={`inline-flex h-8 w-8 items-center justify-center rounded ${!table ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}><LayoutGrid className="h-4 w-4" /></Link>
              <Link href={link({ view: "table" })} aria-label="Dạng bảng" className={`inline-flex h-8 w-8 items-center justify-center rounded ${table ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}><Table2 className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
        {!table && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{rows.length} giống</h2>
              <div className="ml-auto"><EntityFormDialog mode="add" endpoint="/api/varieties" title="Thêm giống" fields={fields} addLabel="Thêm giống" /></div>
            </div>
            {rows.length === 0 ? (
              <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">{query || kind || scope || status ? "Không có giống phù hợp" : "Chưa có giống nào"}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {rows.map((x) => {
                  const myDocs = docs.filter((d) => d.varietyId === x.id);
                  const expiringDoc = myDocs.map((d) => ({ d, a: validityAlert(d.validUntil, today) })).find((z) => z.a);
                  const nTrials = trials.filter((t) => t.varietyId === x.id).length;
                  const nLots = seedLots.filter((l) => l.varietyId === x.id).length;
                  return (
                    <VarietyCard
                      key={x.id}
                      v={{
                        id: x.id,
                        code: x.code,
                        name: x.name,
                        kind: x.kind,
                        species: x.species,
                        origin: x.origin,
                        owner: x.owner,
                        status: x.status,
                        circulationType: x.circulationType,
                        recognitionNo: x.recognitionNo,
                        regions: x.regions,
                        facts: [x.scope, `${nTrials} khảo nghiệm`, `${nLots} lô giống`, `${myDocs.length} văn bản`].join(" · "),
                        alert: expiringDoc ? `${expiringDoc.d.kind}: ${expiringDoc.a!.kind.toLowerCase()} ${expiringDoc.a!.days} ngày` : undefined,
                      }}
                    />
                  );
                })}
              </ul>
            )}
          </section>
        )}
        {table && <CrudTableCard
          title="Danh sách giống"
          description="Bấm mã giống để xem hồ sơ pháp lý, nguồn giống gốc, khảo nghiệm, sản xuất và lô giống"
          endpoint="/api/varieties"
          entity="varieties"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/varieties" title="Thêm giống" fields={fields} addLabel="Thêm giống" />}
          headers={["Mã / nhóm", "Tên giống", "Công nhận", "Lưu hành", "Khảo nghiệm", "Trạng thái"]}
          emptyText={query || kind || scope ? "Không có giống phù hợp" : "Chưa có giống nào"}
          rows={rows.map((x) => {
            const docAlert = docs.filter((d) => d.varietyId === x.id).some((d) => validityAlert(d.validUntil, today));
            return {
              id: x.id,
              label: x.name,
              initial: x,
              cells: [
                <div key="c"><Link href={`/varieties/${x.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{x.code}</Link><div className="text-[11px] text-muted-foreground">{x.kind} · {x.scope}</div></div>,
                <div key="n" className="max-w-[260px]">
                  <div className="text-sm font-medium">{x.name}{x.isPublic && <Badge variant="success" className="ml-1.5">Cổng</Badge>}</div>
                  <div className="text-[11px] text-muted-foreground">{[x.species, x.owner, clip(x.traits, 50)].filter(Boolean).join(" · ") || "—"}</div>
                </div>,
                <div key="r" className="text-xs"><span className="font-mono">{x.recognitionNo || "—"}</span><div className="text-muted-foreground">{fmtDateVN(x.recognizedAt)}</div></div>,
                <div key="l" className="text-xs">
                  {x.circulationType || "—"}{x.circulationNo && <span className="font-mono"> · {x.circulationNo}</span>}
                  {docAlert && <div className="text-rose-600">văn bản sắp / hết hiệu lực</div>}
                </div>,
                <span key="t" className="text-sm">{trials.filter((t) => t.varietyId === x.id).length}</span>,
                <Badge key="s" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />}
      </main>
    </>
  );
}
