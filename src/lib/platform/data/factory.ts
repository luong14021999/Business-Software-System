import {
  readCollection,
  writeCollection,
  appendItem,
  updateItem,
  deleteItem,
} from "@/lib/platform/storage/file-storage";
import { dbQuery, ident, isDbConfigured } from "@/lib/platform/db";

export type EntityStore<T extends { id: string }> = {
  collection: string;
  list: () => Promise<T[]>;
  create: (item: T) => Promise<T>;
  update: (id: string, patch: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  replaceAll: (items: T[]) => Promise<void>;
};

/**
 * Cấu hình mapping camelCase TS ↔ snake_case Postgres.
 * Khi cấu hình + DATABASE_URL OK → CRUD đi qua Neon, ngược lại fallback file.
 */
export type DbMapping<T> = {
  /** Tên bảng; có thể kèm schema phân hệ, VD "m3_tissue.orders". Không có schema → public. */
  table: string;
  /** Danh sách cột, VD "id, code, name" – dùng nguyên văn trong SELECT/RETURNING. */
  select: string;
  toEntity: (row: Record<string, unknown>) => T;
  toRow: (entity: Partial<T>) => Record<string, unknown>;
};

/**
 * Convert empty string → null cho date/timestamp columns.
 * Postgres không nhận "" cho type date/timestamptz.
 */
export const dateOrNull = (v?: string | null) =>
  v && v !== "" ? v : null;

/** ref = khóa ngoại uuid: "" (chưa chọn) → null. optnum = số có thể trống (null = không có giá trị, khác 0). */
export type ColumnKind = "text" | "number" | "bool" | "date" | "json" | "ref" | "optnum";

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const emptyOf: Record<ColumnKind, unknown> = {
  text: "",
  number: 0,
  bool: false,
  date: "",
  json: [],
  ref: "",
  optnum: null,
};

/**
 * Sinh DbMapping từ danh sách cột camelCase → snake_case, cho các entity
 * mà mỗi field ứng đúng 1 cột cùng tên. `id` luôn được đọc, không bao giờ ghi.
 */
export function columnsMapping<T extends { id: string }>(
  table: string,
  columns: { [K in Exclude<keyof T, "id">]-?: ColumnKind },
): DbMapping<T> {
  const entries = Object.entries(columns) as [string, ColumnKind][];
  return {
    table,
    select: ["id", ...entries.map(([k]) => toSnake(k))].join(", "),
    toEntity: (row) => {
      const e: Record<string, unknown> = { id: row.id };
      for (const [k, kind] of entries) e[k] = row[toSnake(k)] ?? emptyOf[kind];
      return e as T;
    },
    toRow: (entity) => {
      const r: Record<string, unknown> = {};
      for (const [k, kind] of entries) {
        const v = (entity as Record<string, unknown>)[k];
        if (v === undefined) continue;
        r[toSnake(k)] = kind === "date" || kind === "ref" ? dateOrNull(v as string) : kind === "optnum" ? (v === "" || v == null ? null : Number(v)) : v;
      }
      return r;
    },
  };
}

/** "m3_tissue.orders" → "m3_tissue"."orders"; "customers" → public."customers". */
export const qualifiedTable = (table: string) => {
  const dot = table.indexOf(".");
  return dot < 0 ? `public.${ident(table)}` : `${ident(table.slice(0, dot))}.${ident(table.slice(dot + 1))}`;
};

/**
 * Truyền cả row dưới dạng 1 tham số JSON rồi để Postgres ép kiểu theo
 * định nghĩa bảng (json_populate_record) → mảng text[], jsonb, date… đều đúng.
 */
const fromJson = (table: string) =>
  `json_populate_record(null::${qualifiedTable(table)}, $1::json)`;

export function createEntityStore<T extends { id: string }>(
  collection: string,
  mockData: T[],
  db?: DbMapping<T>,
): EntityStore<T> {
  const dbEnabled = () => Boolean(db) && isDbConfigured();

  return {
    collection,

    async list() {
      if (dbEnabled() && db) {
        try {
          const rows = await dbQuery(
            `select ${db.select} from ${qualifiedTable(db.table)}`,
          );
          return rows.map(db.toEntity);
        } catch (e) {
          console.error(
            `[${collection}] db list error:`,
            (e as Error).message,
          );
        }
      }
      return readCollection<T>(collection, mockData);
    },

    async create(item: T) {
      if (dbEnabled() && db) {
        const row = db.toRow(item);
        const cols = Object.keys(row).map(ident).join(", ");
        const [created] = await dbQuery(
          `insert into ${qualifiedTable(db.table)} (${cols})
           select ${cols} from ${fromJson(db.table)}
           returning ${db.select}`,
          [JSON.stringify(row)],
        );
        return db.toEntity(created);
      }
      return appendItem<T>(collection, item, mockData);
    },

    async update(id, patch) {
      if (dbEnabled() && db) {
        const row = db.toRow(patch);
        const cols = Object.keys(row).map(ident).join(", ");
        const table = qualifiedTable(db.table);
        try {
          const [updated] = cols
            ? await dbQuery(
                `update ${table} set (${cols}) = (select ${cols} from ${fromJson(db.table)})
                 where id = $2 returning ${db.select}`,
                [JSON.stringify(row), id],
              )
            : await dbQuery(
                `select ${db.select} from ${table} where id = $1`,
                [id],
              );
          return updated ? db.toEntity(updated) : null;
        } catch (e) {
          // Trùng khóa duy nhất: báo cho route xử lý (409), không coi là "không tìm thấy".
          if (/duplicate key value|unique constraint/i.test((e as Error).message)) throw e;
          console.error(
            `[${collection}] db update error:`,
            (e as Error).message,
          );
          return null;
        }
      }
      return updateItem<T>(collection, id, patch, mockData);
    },

    async remove(id) {
      if (dbEnabled() && db) {
        try {
          const rows = await dbQuery(
            `delete from ${qualifiedTable(db.table)} where id = $1 returning id`,
            [id],
          );
          return rows.length > 0;
        } catch (e) {
          console.error(
            `[${collection}] db delete error:`,
            (e as Error).message,
          );
          return false;
        }
      }
      return deleteItem<T>(collection, id, mockData);
    },

    replaceAll: (items) => writeCollection<T>(collection, items),
  };
}
