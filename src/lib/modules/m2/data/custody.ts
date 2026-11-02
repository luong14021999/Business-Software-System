// Chuỗi hành trình mẫu (M2.1, §7.4), phân công theo năng lực (M2.2, §6.2), sổ tay thí nghiệm điện tử (§7.5).
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { columnsMapping, createEntityStore } from "../../../platform/data/factory";
import { samplesStore } from "./samples";
import { archivedSamplesStore } from "./archived-samples";
import { listResults } from "./results";
import { listReports } from "./reports";
import { isActiveAuthorization, testAuthorizationStore } from "./competence";
import { testNoOf } from "@/lib/modules/m2/accreditation";
import { contentHash } from "@/lib/platform/signature";

// ── Sự kiện hành trình ghi tay ──────────────────────────────────────
export const SAMPLE_EVENTS = ["Bàn giao", "Chuyển phân tích", "Bảo quản", "Lưu mẫu", "Trả mẫu", "Hủy mẫu", "Ghi nhận khác"] as const;

export type SampleEvent = {
  id: string;
  sampleCode: string;
  at: string;
  actor: string;
  event: (typeof SAMPLE_EVENTS)[number];
  location: string;
  condition: string;
  receiver: string;
  note: string;
};

export const sampleEventStore = createEntityStore<SampleEvent>(
  "sample-events",
  [],
  columnsMapping<SampleEvent>("sample_events", {
    sampleCode: "text",
    at: "date",
    actor: "text",
    event: "text",
    location: "text",
    condition: "text",
    receiver: "text",
    note: "text",
  }),
);

export type TimelineItem = { at: string; kind: "auto" | "manual"; event: string; detail: string; actor: string; link?: string; id?: string };

/** Ghép dòng thời gian của 1 mẫu từ mọi nguồn dữ liệu (tự động) + sự kiện ghi tay. */
export async function buildTimeline(sampleCode: string): Promise<TimelineItem[]> {
  const [samples, archived, results, reports, events, assigns] = await Promise.all([
    samplesStore.list(),
    archivedSamplesStore.list(),
    listResults(),
    listReports(),
    sampleEventStore.list(),
    assignmentStore.list(),
  ]);
  const out: TimelineItem[] = [];
  const s = samples.find((x) => x.code === sampleCode);
  if (s?.receivedAt) out.push({ at: s.receivedAt, kind: "auto", event: "Tiếp nhận mẫu", detail: `${s.type} · ${s.customer}`, actor: s.technician, link: "/requests" });
  for (const a of assigns.filter((x) => x.sampleCode === sampleCode)) {
    out.push({ at: a.assignedAt, kind: "auto", event: "Phân công", detail: `${a.testLabel.split(" · ").slice(0, 1).join("")} ${a.testLabel.split(" · ")[2] ?? ""} → ${a.assignee} (${a.status})`, actor: a.assignedBy, link: "/assignments" });
  }
  for (const r of results.filter((x) => x.sampleCode === sampleCode)) {
    out.push({ at: r.startedAt || r.createdAt, kind: "auto", event: "Bắt đầu phân tích", detail: `${r.resultCode} · ${r.criterion}`, actor: r.technician, link: `/result-entry?id=${r.id}` });
    for (const ap of r.approvals.filter((x) => x.decision !== "Chờ" && x.signedAt)) {
      out.push({ at: ap.signedAt!.replace(" ", "T") + ":00+07:00", kind: "auto", event: ap.step === "KTV nhập" ? "Nộp kết quả" : ap.decision === "Đạt" ? ap.step : `${ap.step} – trả lại`, detail: `${r.resultCode}${ap.comment ? ` · ${ap.comment}` : ""}`, actor: ap.actor, link: `/result-entry?id=${r.id}` });
    }
  }
  for (const p of reports.filter((x) => x.sampleCode === sampleCode)) {
    out.push({ at: p.issuedAt, kind: "auto", event: p.revision ? `Phát hành phiếu sửa đổi lần ${p.revision}` : "Phát hành phiếu kết quả", detail: p.code, actor: p.issuedBy, link: `/report-print/${p.id}` });
    if (p.revokedAt) out.push({ at: p.revokedAt, kind: "auto", event: "Thu hồi phiếu", detail: `${p.code} · ${p.revokeReason}`, actor: p.revokedBy, link: `/report-print/${p.id}` });
  }
  for (const a of archived.filter((x) => x.originalSampleCode === sampleCode)) {
    out.push({ at: a.archivedAt, kind: "auto", event: "Lưu mẫu", detail: `${a.archiveCode} · ${a.location} · ${a.storageCondition} · hạn ${a.expiryAt}`, actor: "", link: "/archive" });
  }
  for (const e of events.filter((x) => x.sampleCode === sampleCode)) {
    out.push({
      at: e.at,
      kind: "manual",
      event: e.event,
      detail: [e.location && `Vị trí: ${e.location}`, e.condition && `Tình trạng: ${e.condition}`, e.receiver && `Người nhận: ${e.receiver}`, e.note].filter(Boolean).join(" · "),
      actor: e.actor,
      id: e.id,
    });
  }
  return out.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

// ── Phân công ───────────────────────────────────────────────────────
export const ASSIGNMENT_STATUSES = ["Đã giao", "Đang làm", "Hoàn thành", "Hủy"] as const;

export type Assignment = {
  id: string;
  sampleCode: string;
  testLabel: string;
  assignee: string;
  assignedBy: string;
  assignedAt: string;
  dueAt: string;
  status: (typeof ASSIGNMENT_STATUSES)[number];
  note: string;
};

export const assignmentStore = createEntityStore<Assignment>(
  "assignments",
  [],
  columnsMapping<Assignment>("assignments", {
    sampleCode: "text",
    testLabel: "text",
    assignee: "text",
    assignedBy: "text",
    assignedAt: "date",
    dueAt: "date",
    status: "text",
    note: "text",
  }),
);

/** KTV đủ điều kiện = đang có ủy quyền "Thực hiện phép thử" còn hiệu lực cho phép thử (§6.2.6). */
export async function eligibleAssignees(testLabel: string) {
  const auths = await testAuthorizationStore.list();
  const no = testNoOf(testLabel);
  return [...new Set(auths.filter((a) => isActiveAuthorization(a) && a.role === "Thực hiện phép thử" && testNoOf(a.testLabel) === no).map((a) => a.staffName))];
}

/** Đồng bộ trạng thái phân công theo kết quả: có kết quả → Đang làm; Trưởng phòng phê duyệt → Hoàn thành. */
export async function syncAssignment(sampleCode: string, criterion: string, status: "Đang làm" | "Hoàn thành") {
  const no = testNoOf(criterion);
  if (!isDbConfigured() || !Number.isFinite(no)) return;
  await dbQuery(
    `update public.assignments set status = $3
     where sample_code = $1 and test_label like $2 and status in (${status === "Đang làm" ? "'Đã giao'" : "'Đã giao', 'Đang làm'"})`,
    [sampleCode, `#${no} ·%`, status],
  );
}

// ── Sổ tay thí nghiệm điện tử (chỉ ghi thêm) ─────────────────────────
export type NotebookEntry = {
  id: string;
  code: string;
  at: string;
  author: string;
  sampleCode: string;
  testLabel: string;
  title: string;
  content: string;
  equipment: string;
  conditions: string;
  correctsCode: string;
  contentHash: string;
};

const NB_COLS = "id, code, at, author, sample_code, test_label, title, content, equipment, conditions, corrects_code, content_hash";
const toEntry = (r: Record<string, unknown>): NotebookEntry => ({
  id: r.id as string,
  code: r.code as string,
  at: r.at as string,
  author: (r.author as string) ?? "",
  sampleCode: (r.sample_code as string) ?? "",
  testLabel: (r.test_label as string) ?? "",
  title: (r.title as string) ?? "",
  content: (r.content as string) ?? "",
  equipment: (r.equipment as string) ?? "",
  conditions: (r.conditions as string) ?? "",
  correctsCode: (r.corrects_code as string) ?? "",
  contentHash: (r.content_hash as string) ?? "",
});

export const notebookSignedContent = (e: Pick<NotebookEntry, "code" | "author" | "sampleCode" | "testLabel" | "title" | "content" | "equipment" | "conditions" | "correctsCode">) => ({
  code: e.code, author: e.author, sampleCode: e.sampleCode, testLabel: e.testLabel, title: e.title, content: e.content,
  equipment: e.equipment, conditions: e.conditions, correctsCode: e.correctsCode,
});

export async function listNotebook(): Promise<NotebookEntry[]> {
  if (!isDbConfigured()) return [];
  return (await dbQuery(`select ${NB_COLS} from public.notebook_entries order by at desc`)).map(toEntry);
}

export async function addNotebookEntry(e: Omit<NotebookEntry, "id" | "code" | "at" | "contentHash">) {
  const year = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date());
  const prefix = `NK-${year}-`;
  const [seq] = await dbQuery(
    `select coalesce(max(substring(code from $2)::int), 0) as n from public.notebook_entries where code like $1`,
    [`${prefix}%`, `^${prefix}(\\d+)$`],
  );
  const code = `${prefix}${String(Number(seq?.n ?? 0) + 1).padStart(5, "0")}`;
  const hash = contentHash(notebookSignedContent({ ...e, code }));
  const [row] = await dbQuery(
    `insert into public.notebook_entries (code, author, sample_code, test_label, title, content, equipment, conditions, corrects_code, content_hash)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning ${NB_COLS}`,
    [code, e.author, e.sampleCode || null, e.testLabel || null, e.title, e.content, e.equipment || null, e.conditions || null, e.correctsCode || null, hash],
  );
  return toEntry(row);
}
