import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { isDbConfigured } from "@/lib/platform/db";
import { customers as mockCustomers, type Customer } from "@/lib/mock-data";

export type CustomerListItem = Customer & { source: "db" | "file" };

const SELECT =
  "id, code, name, kind, contact, phone, address, samples_ytd, last_sample_at";

export const customersStore = createEntityStore<Customer>(
  "customers",
  mockCustomers,
  {
    table: "customers",
    select: SELECT,
    toEntity: (row) => ({
      id: row.id as string,
      code: (row.code as string) ?? "",
      name: (row.name as string) ?? "",
      kind: (row.kind as Customer["kind"]) ?? "Doanh nghiệp",
      contact: (row.contact as string) ?? "",
      phone: (row.phone as string) ?? "",
      address: (row.address as string) ?? "",
      samplesYTD: (row.samples_ytd as number) ?? 0,
      lastSampleAt: (row.last_sample_at as string) ?? "",
    }),
    toRow: (c) => {
      const r: Record<string, unknown> = {};
      if (c.code !== undefined) r.code = c.code;
      if (c.name !== undefined) r.name = c.name;
      if (c.kind !== undefined) r.kind = c.kind;
      if (c.contact !== undefined) r.contact = c.contact || null;
      if (c.phone !== undefined) r.phone = c.phone || null;
      if (c.address !== undefined) r.address = c.address || null;
      if (c.samplesYTD !== undefined) r.samples_ytd = c.samplesYTD;
      if (c.lastSampleAt !== undefined)
        r.last_sample_at = dateOrNull(c.lastSampleAt);
      return r;
    },
  },
);

// Backward-compat wrappers – các API routes + page hiện đang import 4 hàm này.
export async function getCustomers(): Promise<CustomerListItem[]> {
  const items = await customersStore.list();
  const source: "db" | "file" = isDbConfigured() ? "db" : "file";
  // factory.list không sort → sort ở đây để page hiển thị nhất quán.
  return items
    .sort((a, b) => b.samplesYTD - a.samplesYTD)
    .map((c) => ({ ...c, source }));
}

export const createCustomer = (c: Customer) => customersStore.create(c);
export const patchCustomer = (id: string, patch: Partial<Customer>) =>
  customersStore.update(id, patch);
export const removeCustomer = (id: string) => customersStore.remove(id);
