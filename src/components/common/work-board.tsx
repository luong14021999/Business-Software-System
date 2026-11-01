import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type Tone = "red" | "amber" | "green" | "muted";

export type WorkCard = {
  id: string;
  code: string;
  href: string;
  title: string;
  facts: string[];
  /** Dòng chỉ số tô màu (VD tỷ lệ nhiễm, giá trị còn nợ). */
  metric?: { label: string; tone: Tone } | null;
  due?: { label: string; tone: Tone };
  actions?: ReactNode;
};

export type WorkColumn = {
  key: string;
  name: string;
  hint: string;
  summary: string;
  icon: LucideIcon;
  cards: WorkCard[];
  emptyText: string;
};

const toneText: Record<Tone, string> = {
  red: "text-rose-600 dark:text-rose-400 font-medium",
  amber: "text-amber-700 dark:text-amber-400 font-medium",
  green: "text-emerald-700 dark:text-emerald-400",
  muted: "text-muted-foreground",
};
const toneEdge: Record<Tone, string> = {
  red: "border-l-rose-500",
  amber: "border-l-amber-500",
  green: "border-l-emerald-500",
  muted: "border-l-border",
};

function Card({ card }: { card: WorkCard }) {
  return (
    <li className={`rounded-xl border border-l-4 ${toneEdge[card.due?.tone ?? "muted"]} bg-card p-3 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <Link href={card.href} className="font-mono text-xs font-semibold text-primary hover:underline">{card.code}</Link>
        {card.due && <span className={`text-[11px] whitespace-nowrap ${toneText[card.due.tone]}`}>{card.due.label}</span>}
      </div>
      <div className="truncate text-sm font-medium" title={card.title}>{card.title || "Chưa rõ giống"}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{card.facts.filter(Boolean).join(" · ")}</div>
      {card.metric && <div className={`mt-1 text-[11px] ${toneText[card.metric.tone]}`}>{card.metric.label}</div>}
      {card.actions && <div className="mt-2 flex flex-wrap gap-1.5">{card.actions}</div>}
    </li>
  );
}

/** Bảng làm việc dạng Kanban: mỗi cột một bước, thẻ có nút thao tác trực tiếp (VD bàn cấy M3.1). */
export function WorkBoard({ columns }: { columns: WorkColumn[] }) {
  return (
    <ol className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x">
      {columns.map((c) => {
        const Icon = c.icon;
        return (
          <li key={c.key} className="flex w-[17rem] shrink-0 snap-start flex-col rounded-2xl border border-primary/15 bg-primary/[0.05] p-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold">{c.name}</h2>
              <span className="ml-auto rounded-full bg-primary/15 px-2 text-xs font-semibold tabular-nums text-primary">{c.cards.length}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{c.hint}</p>
            <p className="text-[11px] font-medium">{c.summary}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {c.cards.length === 0 ? <li className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">{c.emptyText}</li> : c.cards.map((card) => <Card key={card.id} card={card} />)}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
