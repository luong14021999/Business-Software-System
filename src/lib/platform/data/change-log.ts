// Nhật ký thay đổi chung (ISO/IEC 17025:2017 §7.11.3, §8.4): ai sửa gì, lúc nào, cũ → mới.
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { currentActor } from "@/lib/platform/auth/server";
import { diffFields, show, type FieldChange } from "@/lib/platform/diff";

export { diffFields, type FieldChange };

export type ChangeEntry = {
  id: string;
  at: string;
  actor: string;
  entity: string;
  entityId: string;
  action: string;
  label: string;
  changes: FieldChange[];
};

/** Nhãn tiếng Việt của các collection, dùng trên trang nhật ký. */
export const ENTITY_LABELS: Record<string, string> = {
  "mdm-items": "Danh mục dùng chung",
  "api-clients": "Khóa API",
  integration: "Tích hợp LGSP/NDXP",
  settings: "Cấu hình hệ thống",
  mfa: "Xác thực 2 lớp",
  backup: "Sao lưu",
  customers: "Khách hàng",
  orders: "Đơn hàng",
  "order-samples": "Yêu cầu (mẫu) của đơn hàng",
  "sample-types": "Loại mẫu",
  "lab-analytes": "Chỉ tiêu phân tích",
  specifications: "Quy chuẩn",
  "specification-limits": "Giới hạn quy chuẩn",
  "tissue-materials": "Vật liệu nuôi cấy",
  "mother-plants": "Cây mẹ",
  "production-profiles": "Thông số sản xuất",
  "seedling-orders": "Đơn hàng cây giống",
  "tissue-supplies": "Vật tư nuôi cấy mô",
  "supply-moves": "Nhập / xuất vật tư",
  "lot-sales": "Phiếu xuất cây giống",
  "lot-feedback": "Phản hồi khách hàng cây giống",
  "recipe-chemicals": "Định mức hóa chất",
  "media-batches": "Lô môi trường",
  cabinets: "Tủ cấy",
  "growth-rooms": "Phòng nuôi",
  "media-recipes": "Công thức môi trường",
  "culture-batches": "Mẻ cấy",
  "seedling-lots": "Lô cây giống",
  varieties: "Lý lịch giống",
  germplasm: "Nguồn gen",
  "breed-trials": "Khảo nghiệm giống",
  "variety-documents": "Văn bản pháp lý giống",
  "source-stocks": "Nguồn giống gốc",
  individuals: "Cá thể giống",
  "selection-records": "Chỉ tiêu chọn lọc",
  "breed-standards": "Bộ chỉ tiêu giống",
  "standard-criteria": "Chỉ tiêu trong bộ",
  "trial-observations": "Số đo khảo nghiệm",
  "breed-production-lots": "Lô sản xuất giống",
  "breed-production-logs": "Nhật ký sản xuất giống",
  "seed-lots": "Lô giống",
  "breed-demands": "Nhu cầu giống",
  "breed-orders": "Đơn hàng giống",
  "breed-deliveries": "Giao nhận giống",
  markers: "Chỉ thị phân tử",
  "genotype-samples": "Mẫu phân tích ADN",
  "genotype-calls": "Kiểu gen",
  "breed-facilities": "Cơ sở sản xuất giống",
  "breed-distributions": "Phân bố giống",
  "market-posts": "Tin thị trường giống",
  "sequence-refs": "Trình tự (BLAST+)",
  staff: "Nhân sự",
  equipment: "Thiết bị",
  tools: "Dụng cụ",
  supplies: "Vật tư",
  chemicals: "Hóa chất",
  samples: "Mẫu",
  "test-requests": "Phiếu yêu cầu",
  "archived-samples": "Mẫu lưu",
  environment: "Điều kiện môi trường",
  feedback: "Ý kiến khách hàng",
  "qms-documents": "Tài liệu",
  nonconformities: "Không phù hợp & CAPA",
  "internal-audits": "Đánh giá nội bộ",
  "management-reviews": "Xem xét lãnh đạo",
  "staff-commitments": "Cam kết",
  "test-authorizations": "Ủy quyền phép thử",
  suppliers: "Nhà cung cấp",
  "method-validations": "Xác nhận phương pháp",
  risks: "Rủi ro",
  opportunities: "Cơ hội",
  "decision-rules": "Quy tắc quyết định",
  "qc-charts": "Biểu đồ kiểm soát",
  "qc-points": "Điểm QC",
  "pt-rounds": "Thử nghiệm thành thạo",
  "release-rules": "Quy tắc kiểm soát phát hành",
  "test-reports": "Phiếu kết quả",
  "calibration-logs": "Hiệu chuẩn",
  "maintenance-logs": "Bảo trì",
  "inspection-records": "Kiểm định",
  "equipment-manuals": "Hướng dẫn thiết bị",
  "equipment-usage-logs": "Nhật ký sử dụng thiết bị",
  "chemical-usage-logs": "Nhật ký dùng hóa chất",
  "chemical-profiles": "Hồ sơ hóa chất",
  "tool-usage-logs": "Nhật ký dụng cụ",
  "user-roles": "Phân quyền",
  "calc-templates": "Công thức tính",
  "calibration-curves": "Đường chuẩn",
  "uncertainty-budgets": "Ngân sách ĐKĐBĐ",
  "raw-data-files": "File dữ liệu thô",
  "sample-events": "Hành trình mẫu",
  assignments: "Phân công",
  notebook: "Sổ tay thí nghiệm",
  "system-incidents": "Sự cố hệ thống",
};

export const labelOf = (item: Record<string, unknown> | null | undefined) =>
  show(item?.code || item?.name || item?.title || item?.criterion || item?.staffName || item?.id);

export async function logChange(e: {
  entity: string;
  entityId: string;
  action: string;
  label?: string;
  changes?: FieldChange[];
  actor?: string;
}) {
  if (!isDbConfigured()) return;
  try {
    const actor = e.actor ?? (await currentActor())?.name ?? "Không xác định";
    await dbQuery(
      `insert into public.change_log (actor, entity, entity_id, action, label, changes)
       values ($1, $2, $3, $4, $5, $6::jsonb)`,
      [actor, e.entity, e.entityId, e.action, e.label ?? "", JSON.stringify(e.changes ?? [])],
    );
  } catch (err) {
    console.error("[change-log] ghi nhật ký thất bại:", (err as Error).message);
  }
}

export async function listChanges(opts: { entity?: string; entityId?: string; limit?: number } = {}) {
  if (!isDbConfigured()) return [];
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.entity) {
    params.push(opts.entity);
    where.push(`entity = $${params.length}`);
  }
  if (opts.entityId) {
    params.push(opts.entityId);
    where.push(`entity_id = $${params.length}`);
  }
  params.push(opts.limit ?? 200);
  const rows = await dbQuery(
    `select id, at, actor, entity, entity_id, action, label, changes from public.change_log
     ${where.length ? `where ${where.join(" and ")}` : ""} order by at desc limit $${params.length}`,
    params,
  );
  return rows.map((r) => ({
    id: r.id as string,
    at: r.at as string,
    actor: (r.actor as string) ?? "",
    entity: r.entity as string,
    entityId: (r.entity_id as string) ?? "",
    action: r.action as string,
    label: (r.label as string) ?? "",
    changes: (r.changes as FieldChange[]) ?? [],
  })) as ChangeEntry[];
}
