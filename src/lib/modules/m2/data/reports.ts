// Phiếu kết quả thử nghiệm (ISO/IEC 17025:2017 §7.8): phát hành từ kết quả đã phê duyệt,
// lưu bản chụp nội dung (§8.4), sửa đổi bằng phiếu thay thế (§7.8.8).
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { labInfo } from "@/lib/modules/m2/accreditation";
import { customersStore } from "./customers";
import { samplesStore } from "./samples";
import { listResults, type ResultRow } from "./results";
import { loadReleaseContext } from "./release-rules";
import { accreditedTests, testNoOf } from "@/lib/modules/m2/accreditation";
import { belowLoq, blockers, parseLoq } from "@/lib/modules/m2/release-checks";
import { SIGN_METHOD, contentHash, reportSignedContent, type ESignature } from "@/lib/platform/signature";

export type ReportLine = {
  resultCode: string;
  /** Giá trị in trên phiếu, VD "< 0,25" khi dưới LOQ (rỗng = in x̄ ± U). */
  reported?: string;
  criterion: string;
  accredited: boolean;
  method: string;
  unit: string;
  mean: number | null;
  uncertainty: number | null;
  decisionRuleType: string;
  decisionLimit: number | null;
  conclusion: string;
  conclusionExplanation: string;
  technician: string;
  startedAt: string;
  finishedAt: string;
  approvedBy: string;
  /** Chữ ký điện tử của bước phê duyệt kết quả (nếu có). */
  approvalSignedAt?: string;
  approvalHash?: string;
};

export type ReportSnapshot = {
  lab: { name: string; organization: string; address: string; phone: string; email: string; vilas: string; standard: string };
  customer: { name: string; address: string; contact: string; phone: string };
  sample: { code: string; type: string; receivedAt: string };
  lines: ReportLine[];
  performedFrom: string;
  performedTo: string;
};

export type TestReport = {
  id: string;
  code: string;
  sampleCode: string;
  revision: number;
  replacesCode: string;
  status: "Đã phát hành" | "Đã thay thế" | "Đã thu hồi";
  issuedAt: string;
  issuedBy: string;
  note: string;
  snapshot: ReportSnapshot;
  contentHash: string;
  signature: ESignature | null;
  revokedAt: string;
  revokedBy: string;
  revokeReason: string;
  revokeSignature: ESignature | null;
};

const COLS =
  "id, code, sample_code, revision, replaces_code, status, issued_at, issued_by, note, snapshot, content_hash, signature, revoked_at, revoked_by, revoke_reason, revoke_signature";

const toReport = (r: Record<string, unknown>): TestReport => ({
  id: r.id as string,
  code: r.code as string,
  sampleCode: (r.sample_code as string) ?? "",
  revision: Number(r.revision ?? 0),
  replacesCode: (r.replaces_code as string) ?? "",
  status: ((r.status as string) || "Đã phát hành") as TestReport["status"],
  issuedAt: (r.issued_at as string) ?? "",
  issuedBy: (r.issued_by as string) ?? "",
  note: (r.note as string) ?? "",
  snapshot: r.snapshot as ReportSnapshot,
  contentHash: (r.content_hash as string) ?? "",
  signature: (r.signature as ESignature) ?? null,
  revokedAt: (r.revoked_at as string) ?? "",
  revokedBy: (r.revoked_by as string) ?? "",
  revokeReason: (r.revoke_reason as string) ?? "",
  revokeSignature: (r.revoke_signature as ESignature) ?? null,
});

/** Mã băm tính lại từ dữ liệu đang lưu – khác content_hash nghĩa là phiếu đã bị sửa sau khi ký. */
export const recomputeHash = (r: TestReport) => contentHash(reportSignedContent(r));

export async function getReportByCode(code: string): Promise<TestReport | null> {
  const [row] = await dbQuery(`select ${COLS} from public.test_reports where code = $1`, [code]);
  return row ? toReport(row) : null;
}

type Signer = { name: string; email: string; roles: string[] };

/** Thu hồi phiếu (M2.6): ghi lý do + chữ ký điện tử của người thu hồi; không xoá phiếu. */
export async function revokeReport(id: string, reason: string, signer: Signer) {
  const report = await getReport(id);
  if (!report) return { error: "Không tìm thấy phiếu" } as const;
  if (report.status === "Đã thu hồi") return { error: "Phiếu đã được thu hồi trước đó" } as const;
  const signature: ESignature = {
    signer: signer.name,
    email: signer.email,
    roles: signer.roles,
    meaning: "Thu hồi phiếu kết quả",
    signedAt: new Date().toISOString(),
    method: SIGN_METHOD,
    contentHash: report.contentHash || recomputeHash(report),
  };
  const [row] = await dbQuery(
    `update public.test_reports set status = 'Đã thu hồi', revoked_at = now(), revoked_by = $2, revoke_reason = $3, revoke_signature = $4::jsonb
     where id = $1 returning ${COLS}`,
    [id, signer.name, reason, JSON.stringify(signature)],
  );
  return { report: toReport(row), previousStatus: report.status } as const;
}

export async function listReports(): Promise<TestReport[]> {
  if (!isDbConfigured()) return [];
  return (await dbQuery(`select ${COLS} from public.test_reports order by issued_at desc`)).map(toReport);
}

export async function getReport(id: string): Promise<TestReport | null> {
  const [row] = await dbQuery(`select ${COLS} from public.test_reports where id = $1`, [id]);
  return row ? toReport(row) : null;
}

/** Nội dung phiếu từ các kết quả đã phê duyệt của mẫu. */
/** Kết quả đã phê duyệt của mẫu nhưng vi phạm quy tắc kiểm soát hiện hành → không được phát hành. */
export async function releaseBlockers(sampleCode: string) {
  const [results, { evaluate, version }] = await Promise.all([listResults(), loadReleaseContext()]);
  const approved = results.filter((r) => r.sampleCode === sampleCode && r.status === "Đã duyệt");
  const issues = approved.flatMap((r: ResultRow) => {
    const approver = r.approvals.find((a) => a.step === "Trưởng phòng duyệt")?.actor;
    return blockers(evaluate(r, approver)).map((c) => `${r.resultCode}: ${c.message}`);
  });
  return { version, issues };
}

export async function buildSnapshot(sampleCode: string): Promise<ReportSnapshot | null> {
  const [results, samples, customers] = await Promise.all([listResults(), samplesStore.list(), customersStore.list()]);
  const approved = results
    .filter((r) => r.sampleCode === sampleCode && r.status === "Đã duyệt")
    .sort((a, b) => a.criterion.localeCompare(b.criterion, "vi", { numeric: true }));
  if (!approved.length) return null;
  const sample = samples.find((s) => s.code === sampleCode);
  const customer = customers.find((c) => c.name === (sample?.customer ?? approved[0].customerName));
  const fin = (v: number) => (Number.isFinite(v) ? v : null);
  const dates = approved.flatMap((r) => [r.startedAt, r.finishedAt ?? ""]).filter(Boolean).sort();
  return {
    lab: {
      name: labInfo.accreditedName,
      organization: labInfo.organization,
      address: labInfo.address,
      phone: labInfo.phone,
      email: labInfo.email,
      vilas: labInfo.vilasCode,
      standard: labInfo.standard,
    },
    customer: {
      name: customer?.name ?? sample?.customer ?? approved[0].customerName,
      address: customer?.address ?? "",
      contact: customer?.contact ?? "",
      phone: customer?.phone ?? "",
    },
    sample: { code: sampleCode, type: sample?.type ?? approved[0].matrix, receivedAt: sample?.receivedAt ?? "" },
    lines: approved.map((r) => ({
      resultCode: r.resultCode,
      reported: (() => {
        const loq = parseLoq(accreditedTests.find((t) => t.no === testNoOf(r.criterion))?.loq ?? "");
        return Number.isFinite(r.mean) && belowLoq(r.mean, r.unit, loq) && loq?.kind === "min"
          ? `< ${String(loq.value).replace(".", ",")}`
          : "";
      })(),
      criterion: r.criterion.replace(/^#\d+\s*/, ""),
      accredited: /^#\d+/.test(r.criterion),
      method: r.method,
      unit: r.unit,
      mean: fin(r.mean),
      uncertainty: fin(r.uncertainty),
      decisionRuleType: r.decisionRuleType,
      decisionLimit: fin(r.decisionLimit),
      conclusion: r.conclusion,
      conclusionExplanation: r.conclusionExplanation,
      technician: r.technician,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt ?? "",
      approvedBy: r.approvals.find((a) => a.step === "Trưởng phòng duyệt")?.actor ?? "",
      approvalSignedAt: r.approvals.find((a) => a.step === "Trưởng phòng duyệt")?.signedAt,
      approvalHash: r.approvals.find((a) => a.step === "Trưởng phòng duyệt")?.signatureHash,
    })),
    performedFrom: dates[0] ?? "",
    performedTo: dates.at(-1) ?? "",
  };
}

/** Phát hành phiếu; nếu mẫu đã có phiếu hiệu lực → phiếu mới là bản sửa đổi thay thế. */
export async function issueReport(sampleCode: string, signer: Signer, note: string) {
  const issuedBy = signer.name;
  const { version, issues } = await releaseBlockers(sampleCode);
  if (issues.length) {
    return { error: `Không phát hành được – vi phạm quy tắc kiểm soát (phiên bản ${version}): ${issues.join("; ")}` } as const;
  }
  const snapshot = await buildSnapshot(sampleCode);
  if (!snapshot) return { error: "Mẫu chưa có kết quả nào được Trưởng phòng phê duyệt" } as const;

  const [prev] = await dbQuery(
    `select code, revision from public.test_reports where sample_code = $1 and status = 'Đã phát hành'
     order by revision desc limit 1`,
    [sampleCode],
  );
  const year = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date());
  const prefix = `PKQ-VNNTH-${year}-`;
  const [seq] = await dbQuery(
    `select coalesce(max(substring(code from $2)::int), 0) as n from public.test_reports where code like $1`,
    [`${prefix}%`, `^${prefix}(\\d+)$`],
  );
  const code = `${prefix}${String(Number(seq?.n ?? 0) + 1).padStart(5, "0")}`;

  if (prev) {
    await dbQuery(`update public.test_reports set status = 'Đã thay thế' where code = $1`, [prev.code]);
  }
  const revision = prev ? Number(prev.revision) + 1 : 0;
  const hash = contentHash(reportSignedContent({ code, sampleCode, revision, replacesCode: prev?.code ?? "", note, snapshot }));
  const signature: ESignature = {
    signer: issuedBy,
    email: signer.email,
    roles: signer.roles,
    meaning: "Phát hành phiếu kết quả",
    signedAt: new Date().toISOString(),
    method: SIGN_METHOD,
    contentHash: hash,
  };
  const [row] = await dbQuery(
    `insert into public.test_reports (code, sample_code, revision, replaces_code, issued_by, note, snapshot, content_hash, signature)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb) returning ${COLS}`,
    [code, sampleCode, revision, prev?.code ?? null, issuedBy, note || null, JSON.stringify(snapshot), hash, JSON.stringify(signature)],
  );
  return { report: toReport(row) } as const;
}
