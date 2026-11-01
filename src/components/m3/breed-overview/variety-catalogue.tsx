import Link from "next/link";
import { MapPin, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyNote } from "./shared";

export type CatalogueVariety = {
  id: string;
  code: string;
  name: string;
  kind: string;
  species: string;
  origin: string;
  owner: string;
  status: string;
  circulationType: string;
  recognitionNo: string;
  regions: string;
  /** Cảnh báo ngắn (VD văn bản sắp hết hiệu lực). */
  alert?: string;
  /** Số liệu ngắn (VD 3 khảo nghiệm · 2 lô giống). */
  facts?: string;
};

const statusVariant: Record<string, "warning" | "success" | "default" | "secondary"> = {
  "Đang khảo nghiệm": "warning",
  "Được công nhận": "success",
  "Lưu hành": "default",
  "Ngừng sản xuất": "secondary",
};

/** Thẻ giống: ảnh nền luống, mã, nhóm, trạng thái pháp lý – bấm để mở hồ sơ giống. */
export function VarietyCard({ v }: { v: CatalogueVariety }) {
  const author = [v.owner, v.origin].filter(Boolean).join(" · ");
  return (
    <li>
      <Link
        href={`/varieties/${v.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card transition hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between gap-2 border-b border-t-[3px] border-t-primary bg-muted/40 px-3 py-2">
          <span className="font-mono text-[11px] font-semibold text-primary">{v.code}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{v.kind}</span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div>
            <h3 className="text-sm font-semibold leading-snug group-hover:text-primary">{v.name}</h3>
            {v.species && <p className="text-xs italic text-muted-foreground">{v.species}</p>}
          </div>
          {author && (
            <p className="flex items-start gap-1 text-[11px] text-muted-foreground">
              <UserRound className="mt-px w-3 h-3 shrink-0" aria-hidden /> <span className="line-clamp-2">{author}</span>
            </p>
          )}
          {v.regions && (
            <p className="flex items-start gap-1 text-[11px] text-muted-foreground">
              <MapPin className="mt-px w-3 h-3 shrink-0" aria-hidden /> <span className="line-clamp-1">{v.regions}</span>
            </p>
          )}
          {v.facts && <p className="text-[11px] text-muted-foreground">{v.facts}</p>}
          {v.alert && <p className="text-[11px] font-medium text-rose-600">{v.alert}</p>}
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            <Badge variant={statusVariant[v.status] ?? "secondary"} className="text-[10px] px-1.5">{v.status || "Chưa rõ"}</Badge>
            {v.circulationType && v.circulationType !== "Chưa lưu hành" && <Badge variant="outline" className="text-[10px] px-1.5">{v.circulationType}</Badge>}
          </div>
        </div>
      </Link>
    </li>
  );
}

/** Ưu tiên giống đã công nhận / lưu hành, rồi đang khảo nghiệm; giống ngừng sản xuất xếp cuối. */
const RANK: Record<string, number> = { "Được công nhận": 0, "Lưu hành": 1, "Đang khảo nghiệm": 2, "Ngừng sản xuất": 4 };
const pick = (list: CatalogueVariety[], n: number) =>
  [...list].sort((a, b) => (RANK[a.status] ?? 3) - (RANK[b.status] ?? 3) || a.name.localeCompare(b.name, "vi")).slice(0, n);

export function VarietyCatalogue({ varieties, kinds }: { varieties: CatalogueVariety[]; kinds: readonly string[] }) {
  if (varieties.length === 0) return <EmptyNote>Chưa có giống nào trong danh mục – thêm ở trang Lý lịch giống.</EmptyNote>;
  const tabs = [
    { value: "all", label: "Tất cả", items: varieties, href: "/varieties" },
    ...kinds.map((k) => ({ value: k, label: k, items: varieties.filter((v) => v.kind === k), href: `/varieties?kind=${encodeURIComponent(k)}` })),
  ];
  return (
    <Tabs defaultValue="all" className="space-y-3">
      <div className="-mx-1 overflow-x-auto px-1 scrollbar-thin">
        <TabsList aria-label="Lọc theo nhóm giống">
          {tabs.map((t) => {
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                {t.label} <span className="text-[10px] opacity-70">{t.items.length}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      {tabs.map((t) => {
        const shown = pick(t.items, 12);
        return (
          <TabsContent key={t.value} value={t.value} className="space-y-3">
            {shown.length === 0 ? (
              <EmptyNote>Chưa có giống {t.label.toLowerCase()}.</EmptyNote>
            ) : (
              <ul className="grid gap-3 grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {shown.map((v) => <VarietyCard key={v.id} v={v} />)}
              </ul>
            )}
            {t.items.length > shown.length && (
              <p className="text-right text-xs">
                <Link href={t.href} className="font-medium text-primary hover:underline">Xem tất cả {t.items.length} giống {t.value === "all" ? "" : t.label.toLowerCase()} →</Link>
              </p>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
