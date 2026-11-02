// Nhóm Quản lý theo XaLab (migration 0037): hiệu chuẩn / tồn kho thiết bị, nhập – xuất kho thiết bị,
// lô hóa chất nhập – xuất kho, hồ sơ (văn bản) có file đính kèm.
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { calibrationLogStore } from "@/lib/modules/m2/data/calibration-logs";
import type { CalibrationLog } from "@/lib/mock-data";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { instrumentTypeStore } from "@/lib/modules/m2/data/settings";
import { nextCalibrationDue } from "@/lib/modules/m2/manage";

export const EQUIPMENT_CONDITIONS = ["Không rõ", "Tốt", "Bình thường", "Kém", "Hỏng"] as const;

/** Mã hóa chất kế tiếp dạng HC-001. */
export async function nextChemicalCode() {
  if (!isDbConfigured()) return "HC-001";
  const rows = await dbQuery(`select code from public.chemicals where code ~ '^HC-[0-9]+$'`);
  const max = rows.reduce((m, r) => Math.max(m, Number(String(r.code).slice(3)) || 0), 0);
  return `HC-${String(max + 1).padStart(3, "0")}`;
}

/** Mã nhà cung cấp kế tiếp dạng NCC-001. */
export async function nextSupplierCode() {
  if (!isDbConfigured()) return "NCC-001";
  const rows = await dbQuery(`select code from public.suppliers where code ~ '^NCC-[0-9]+$'`);
  const max = rows.reduce((m, r) => Math.max(m, Number(String(r.code).slice(4)) || 0), 0);
  return `NCC-${String(max + 1).padStart(3, "0")}`;
}

export async function chemicalInUse(id: string) {
  if (!isDbConfigured()) return null;
  const [r] = await dbQuery(`select count(*)::int n from public.chemical_import_items where chemical_id = $1`, [id]);
  return Number(r?.n) ? "Hóa chất đã có trong lô nhập kho, không xóa được (đặt Ngừng dùng thay vì xóa)" : null;
}

export async function equipmentInUse(id: string) {
  if (!isDbConfigured()) return null;
  const [r] = await dbQuery(
    `select (select count(*) from public.instrument_move_items where equipment_id = $1) + (select count(*) from public.calibration_logs where equipment_id = $1) n`,
    [id],
  );
  return Number(r?.n) ? "Thiết bị đã có lịch sử hiệu chuẩn hoặc nhập / xuất kho, không xóa được (đặt Ngừng dùng thay vì xóa)" : null;
}

/** Lần hiệu chuẩn gần nhất của từng thiết bị (theo ngày định kỳ / nội bộ mới nhất). */
export async function latestCalibrations(): Promise<Map<string, CalibrationLog>> {
  const logs = (await calibrationLogStore.list()).filter((l) => l.equipmentId);
  const key = (l: CalibrationLog) => [l.date, l.internalDate].filter(Boolean).sort().at(-1) ?? "";
  const out = new Map<string, CalibrationLog>();
  for (const l of logs) {
    const cur = out.get(l.equipmentId!);
    if (!cur || key(l) > key(cur)) out.set(l.equipmentId!, l);
  }
  return out;
}

/** Thiết bị kèm tên loại, lần hiệu chuẩn nội bộ / định kỳ gần nhất, hạn tiếp theo, đang ở kho hay đã xuất. */
export async function instrumentRows() {
  const [equipment, types, latest, stock] = await Promise.all([equipmentStore.list(), instrumentTypeStore.list(), latestCalibrations(), equipmentInStock()]);
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  return equipment
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    .map((e, i) => {
      const cal = latest.get(e.id);
      const lastPeriodic = cal?.date || e.lastCalibration || "";
      return {
        ...e,
        no: i + 1,
        typeName: typeName.get(e.instrumentTypeId ?? "") ?? e.equipmentType ?? "",
        internalDate: cal?.internalDate ?? "",
        internalBy: cal?.internalBy ?? "",
        periodicDate: lastPeriodic,
        calibrationUnit: cal?.place || e.calibrationPlace || "",
        due: nextCalibrationDue(lastPeriodic, e.calibrationDays, e.nextCalibration),
        inStock: stock.get(e.id) ?? true,
      };
    });
}
export type InstrumentRow = Awaited<ReturnType<typeof instrumentRows>>[number];

// ---- Nhập / xuất kho thiết bị ----

export type InstrumentMove = { id: string; kind: "nhap" | "xuat"; movedAt: string; orderId: string; deliverer: string; receiver: string; note: string; createdAt: string };
export const instrumentMoveStore = createEntityStore<InstrumentMove>(
  "instrument-moves",
  [],
  columnsMapping<InstrumentMove>("instrument_moves", { kind: "text", movedAt: "date", orderId: "ref", deliverer: "text", receiver: "text", note: "text", createdAt: "date" }),
);

export async function moveItems(moveId: string): Promise<string[]> {
  if (!isDbConfigured()) return [];
  return (await dbQuery(`select equipment_id from public.instrument_move_items where move_id = $1`, [moveId])).map((r) => r.equipment_id as string);
}

export async function setMoveItems(moveId: string, equipmentIds: string[]) {
  await dbQuery(`delete from public.instrument_move_items where move_id = $1`, [moveId]);
  if (equipmentIds.length) {
    await dbQuery(
      `insert into public.instrument_move_items (move_id, equipment_id) select $1, x::uuid from unnest($2::text[]) x on conflict do nothing`,
      [moveId, [...new Set(equipmentIds)]],
    );
  }
}

/** Số thiết bị của từng phiếu nhập / xuất. */
export async function moveItemCounts(): Promise<Map<string, number>> {
  if (!isDbConfigured()) return new Map();
  const rows = await dbQuery(`select move_id, count(*)::int n from public.instrument_move_items group by move_id`);
  return new Map(rows.map((r) => [r.move_id as string, Number(r.n)]));
}

/** Thiết bị đang ở kho: chưa từng xuất, hoặc lần nhập / xuất gần nhất là nhập. */
export async function equipmentInStock(): Promise<Map<string, boolean>> {
  if (!isDbConfigured()) return new Map();
  const rows = await dbQuery(
    `select distinct on (i.equipment_id) i.equipment_id, m.kind
     from public.instrument_move_items i join public.instrument_moves m on m.id = i.move_id
     order by i.equipment_id, m.moved_at desc, m.created_at desc`,
  );
  return new Map(rows.map((r) => [r.equipment_id as string, r.kind !== "xuat"]));
}

/** Dòng sổ giao nhận thiết bị trong khoảng ngày. */
export async function moveLines(from: string, to: string) {
  if (!isDbConfigured()) return [];
  return dbQuery(
    `select m.kind, m.moved_at, m.deliverer, m.receiver, m.note, o.code order_code, e.code, e.name
     from public.instrument_moves m
     join public.instrument_move_items i on i.move_id = m.id
     join public.equipment e on e.id = i.equipment_id
     left join public.orders o on o.id = m.order_id
     where ($1 = '' or m.moved_at >= $1::date) and ($2 = '' or m.moved_at <= $2::date)
     order by m.moved_at, m.created_at, e.code`,
    [from, to],
  );
}

export type MoveBody = { kind?: string; movedAt?: string; orderId?: string; deliverer?: string; receiver?: string; note?: string; equipmentIds?: string[] };

/** Kiểm tra phiếu nhập / xuất: ngày hợp lệ, có thiết bị, xuất kho thì thiết bị phải đang ở kho (trừ thiết bị đã thuộc phiếu này). */
export async function checkMove(b: MoveBody, kind: "nhap" | "xuat", currentIds: string[] = []): Promise<string | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.movedAt ?? "")) return "Nhập ngày";
  const ids = [...new Set(b.equipmentIds ?? [])];
  if (!ids.length) return "Chọn ít nhất một thiết bị";
  const known = new Set((await equipmentStore.list()).map((e) => e.id));
  if (ids.some((id) => !known.has(id))) return "Có thiết bị không tồn tại";
  if (kind === "xuat") {
    const stock = await equipmentInStock();
    const out = ids.filter((id) => stock.get(id) === false && !currentIds.includes(id));
    if (out.length) return "Có thiết bị đã xuất kho, chưa nhập lại";
  }
  return null;
}

export const moveFields = (b: MoveBody): Partial<InstrumentMove> => ({
  movedAt: b.movedAt ?? "",
  orderId: b.orderId ?? "",
  deliverer: String(b.deliverer ?? "").trim(),
  receiver: String(b.receiver ?? "").trim(),
  note: String(b.note ?? "").trim(),
});

// ---- Hóa chất: lô nhập kho, phiếu xuất kho ----

export type ChemicalImport = { id: string; name: string; importedAt: string; deliverer: string; receiver: string; note: string; createdAt: string };
export const chemicalImportStore = createEntityStore<ChemicalImport>(
  "chemical-imports",
  [],
  columnsMapping<ChemicalImport>("chemical_imports", { name: "text", importedAt: "date", deliverer: "text", receiver: "text", note: "text", createdAt: "date" }),
);

export type ChemicalExport = { id: string; exportedAt: string; deliverer: string; receiver: string; note: string; createdAt: string };
export const chemicalExportStore = createEntityStore<ChemicalExport>(
  "chemical-exports",
  [],
  columnsMapping<ChemicalExport>("chemical_exports", { exportedAt: "date", deliverer: "text", receiver: "text", note: "text", createdAt: "date" }),
);

export type ImportItem = { id?: string; chemicalId: string; qty: number; expiry: string };
export type ExportItem = { id?: string; importItemId: string; qty: number; purpose: string };

/** Một dòng tồn kho: hóa chất của một lô nhập, lượng nhập / xuất / còn. */
export type ChemicalLot = {
  id: string;
  importId: string;
  lotName: string;
  importedAt: string;
  chemicalId: string;
  chemical: string;
  unit: string;
  expiry: string;
  qtyIn: number;
  qtyOut: number;
  remaining: number;
  disposed: boolean;
  note: string;
};

export async function chemicalLots(): Promise<ChemicalLot[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select i.id, i.import_id, ci.name lot_name, ci.imported_at, i.chemical_id, c.name chemical, c.unit, i.expiry, i.qty, i.disposed, i.note,
            coalesce((select sum(x.qty) from public.chemical_export_items x where x.import_item_id = i.id), 0) qty_out
     from public.chemical_import_items i
     join public.chemical_imports ci on ci.id = i.import_id
     join public.chemicals c on c.id = i.chemical_id
     order by c.name, ci.imported_at, ci.name`,
  );
  return rows.map((r) => {
    const qtyIn = Number(r.qty) || 0;
    const qtyOut = Number(r.qty_out) || 0;
    return {
      id: r.id as string,
      importId: r.import_id as string,
      lotName: (r.lot_name as string) ?? "",
      importedAt: (r.imported_at as string) ?? "",
      chemicalId: r.chemical_id as string,
      chemical: (r.chemical as string) ?? "",
      unit: (r.unit as string) ?? "",
      expiry: (r.expiry as string) ?? "",
      qtyIn,
      qtyOut,
      remaining: Math.round((qtyIn - qtyOut) * 1e6) / 1e6,
      disposed: Boolean(r.disposed),
      note: (r.note as string) ?? "",
    };
  });
}

export async function importItems(importId: string): Promise<(ImportItem & { id: string; used: number })[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select i.id, i.chemical_id, i.qty, i.expiry, coalesce((select sum(x.qty) from public.chemical_export_items x where x.import_item_id = i.id), 0) used
     from public.chemical_import_items i where i.import_id = $1 order by i.id`,
    [importId],
  );
  return rows.map((r) => ({ id: r.id as string, chemicalId: r.chemical_id as string, qty: Number(r.qty) || 0, expiry: (r.expiry as string) ?? "", used: Number(r.used) || 0 }));
}

/** Ghi các dòng của lô nhập: sửa dòng cũ, thêm dòng mới, xóa dòng bị bỏ (dòng đã xuất kho thì không xóa được). */
export async function saveImportItems(importId: string, items: ImportItem[]): Promise<string | null> {
  const old = await importItems(importId);
  const keep = new Set(items.map((i) => i.id).filter(Boolean));
  const dropped = old.filter((o) => !keep.has(o.id));
  if (dropped.some((o) => o.used > 0)) return "Dòng đã xuất kho không xóa được";
  for (const it of items) {
    const cur = old.find((o) => o.id === it.id);
    if (cur && it.qty < cur.used) return "Lượng nhập không được nhỏ hơn lượng đã xuất";
  }
  if (dropped.length) await dbQuery(`delete from public.chemical_import_items where id = any($1::uuid[])`, [dropped.map((o) => o.id)]);
  for (const it of items) {
    if (it.id && old.some((o) => o.id === it.id)) {
      await dbQuery(`update public.chemical_import_items set chemical_id = $2, qty = $3, expiry = nullif($4, '')::date where id = $1`, [it.id, it.chemicalId, it.qty, it.expiry ?? ""]);
    } else {
      await dbQuery(`insert into public.chemical_import_items (import_id, chemical_id, qty, expiry) values ($1, $2, $3, nullif($4, '')::date)`, [importId, it.chemicalId, it.qty, it.expiry ?? ""]);
    }
  }
  return null;
}

export async function exportItems(exportId: string): Promise<(ExportItem & { id: string })[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(`select id, import_item_id, qty, purpose from public.chemical_export_items where export_id = $1 order by id`, [exportId]);
  return rows.map((r) => ({ id: r.id as string, importItemId: r.import_item_id as string, qty: Number(r.qty) || 0, purpose: (r.purpose as string) ?? "" }));
}

/** Ghi các dòng phiếu xuất; không cho xuất quá lượng còn của từng lô (tính cả lượng của chính phiếu này). */
export async function saveExportItems(exportId: string, items: ExportItem[]): Promise<string | null> {
  const lots = new Map((await chemicalLots()).map((l) => [l.id, l]));
  const mine = new Map<string, number>();
  for (const o of await exportItems(exportId)) mine.set(o.importItemId, (mine.get(o.importItemId) ?? 0) + o.qty);
  const want = new Map<string, number>();
  for (const it of items) want.set(it.importItemId, (want.get(it.importItemId) ?? 0) + it.qty);
  for (const [lotId, qty] of want) {
    const lot = lots.get(lotId);
    if (!lot) return "Không tìm thấy lô hóa chất";
    if (lot.disposed) return `${lot.chemical} (lô ${lot.lotName}) đã tiêu hủy`;
    if (qty > lot.remaining + (mine.get(lotId) ?? 0) + 1e-9) return `${lot.chemical} (lô ${lot.lotName}) chỉ còn ${lot.remaining + (mine.get(lotId) ?? 0)} ${lot.unit}`;
  }
  await dbQuery(`delete from public.chemical_export_items where export_id = $1`, [exportId]);
  for (const it of items) {
    await dbQuery(`insert into public.chemical_export_items (export_id, import_item_id, qty, purpose) values ($1, $2, $3, $4)`, [exportId, it.importItemId, it.qty, it.purpose ?? ""]);
  }
  return null;
}

export async function setLotNotes(notes: { id: string; note: string }[]) {
  for (const n of notes) await dbQuery(`update public.chemical_import_items set note = $2 where id = $1`, [n.id, n.note]);
}

export async function disposeLots(ids: string[]) {
  if (ids.length) await dbQuery(`update public.chemical_import_items set disposed = true where id = any($1::uuid[])`, [ids]);
}

/** Dòng thống kê nhập kho / sử dụng (xuất kho) hóa chất trong khoảng ngày. */
export async function chemicalMoveLines(kind: "nhap" | "xuat", from: string, to: string, chemicalId: string) {
  if (!isDbConfigured()) return [];
  if (kind === "nhap") {
    return dbQuery(
      `select ci.imported_at d, ci.name lot, c.name chemical, c.unit, i.qty, i.expiry, ci.deliverer, ci.receiver
       from public.chemical_import_items i join public.chemical_imports ci on ci.id = i.import_id join public.chemicals c on c.id = i.chemical_id
       where ($1 = '' or ci.imported_at >= $1::date) and ($2 = '' or ci.imported_at <= $2::date) and ($3 = '' or i.chemical_id::text = $3)
       order by ci.imported_at, c.name`,
      [from, to, chemicalId],
    );
  }
  return dbQuery(
    `select ce.exported_at d, ci.name lot, c.name chemical, c.unit, x.qty, x.purpose, ce.deliverer, ce.receiver
     from public.chemical_export_items x join public.chemical_exports ce on ce.id = x.export_id
     join public.chemical_import_items i on i.id = x.import_item_id join public.chemical_imports ci on ci.id = i.import_id
     join public.chemicals c on c.id = i.chemical_id
     where ($1 = '' or ce.exported_at >= $1::date) and ($2 = '' or ce.exported_at <= $2::date) and ($3 = '' or i.chemical_id::text = $3)
     order by ce.exported_at, c.name`,
    [from, to, chemicalId],
  );
}

// ---- Hồ sơ (văn bản) ----

export type VanBan = { id: string; number: string; issuedAt: string; issuer: string; summary: string; note: string; assignees: string[]; active: boolean; fileName: string; fileType: string };
export const vanBanStore = createEntityStore<VanBan>(
  "van-bans",
  [],
  columnsMapping<VanBan>("van_bans", { number: "text", issuedAt: "date", issuer: "text", summary: "text", note: "text", assignees: "json", active: "bool", fileName: "text", fileType: "text" }),
);

/** File đính kèm tối đa 10 MB (lưu trong CSDL). */
export const VAN_BAN_MAX_BYTES = 10 * 1024 * 1024;

export async function setVanBanFile(id: string, name: string, type: string, data: Buffer | null) {
  await dbQuery(`update public.van_bans set file_name = $2, file_type = $3, file_data = decode($4, 'base64') where id = $1`, [id, data ? name : null, data ? type : null, data ? data.toString("base64") : null]);
}

export async function getVanBanFile(id: string): Promise<{ name: string; type: string; data: Buffer } | null> {
  if (!isDbConfigured()) return null;
  const [r] = await dbQuery(`select file_name, file_type, encode(file_data, 'base64') b64 from public.van_bans where id = $1 and file_data is not null`, [id]);
  return r ? { name: (r.file_name as string) || "tep-dinh-kem", type: (r.file_type as string) || "application/octet-stream", data: Buffer.from(String(r.b64), "base64") } : null;
}

/** Số dòng hóa chất của từng lô nhập / phiếu xuất. */
export async function chemicalLineCounts(kind: "nhap" | "xuat"): Promise<Map<string, number>> {
  if (!isDbConfigured()) return new Map();
  const rows = await dbQuery(
    kind === "nhap"
      ? `select import_id k, count(*)::int n from public.chemical_import_items group by import_id`
      : `select export_id k, count(*)::int n from public.chemical_export_items group by export_id`,
  );
  return new Map(rows.map((r) => [r.k as string, Number(r.n)]));
}

/** Lô nhập đã có hóa chất xuất kho thì không xóa được. */
export async function importHasExports(importId: string) {
  if (!isDbConfigured()) return false;
  const [r] = await dbQuery(`select count(*)::int n from public.chemical_export_items x join public.chemical_import_items i on i.id = x.import_item_id where i.import_id = $1`, [importId]);
  return Number(r?.n) > 0;
}

export type ChemMoveBody = { name?: string; date?: string; deliverer?: string; receiver?: string; note?: string; items?: Record<string, unknown>[] };

/** Đọc dòng lô nhập từ body; trả lỗi nếu thiếu hóa chất / lượng / ngày hết hạn sai. */
export function parseImportItems(items: Record<string, unknown>[] = []): ImportItem[] | string {
  const out: ImportItem[] = [];
  for (const it of items) {
    const qty = Number(it.qty);
    const expiry = String(it.expiry ?? "").slice(0, 10);
    if (!it.chemicalId) return "Chọn hóa chất cho mọi dòng";
    if (!(qty > 0)) return "Lượng phải lớn hơn 0";
    if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return "Ngày hết hạn không hợp lệ";
    out.push({ id: it.id ? String(it.id) : undefined, chemicalId: String(it.chemicalId), qty, expiry });
  }
  return out.length ? out : "Thêm ít nhất một hóa chất";
}

export function parseExportItems(items: Record<string, unknown>[] = []): ExportItem[] | string {
  const out: ExportItem[] = [];
  for (const it of items) {
    const qty = Number(it.qty);
    if (!it.importItemId) return "Chọn lô hóa chất cho mọi dòng";
    if (!(qty > 0)) return "Lượng phải lớn hơn 0";
    out.push({ importItemId: String(it.importItemId), qty, purpose: String(it.purpose ?? "").trim() });
  }
  return out.length ? out : "Thêm ít nhất một dòng xuất kho";
}
