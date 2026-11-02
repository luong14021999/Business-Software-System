// Dữ liệu chọn sẵn cho form Thêm / Sửa đơn hàng (khách hàng, liên lạc, địa điểm, hợp đồng, ngành, phòng ban…).
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { contactStore, locationStore } from "@/lib/modules/m2/data/order-extras";
import { contractStore, departmentStore, industryStore } from "@/lib/modules/m2/data/catalogs";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { staffStore } from "@/lib/modules/m2/data/staff";

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "vi");

export async function orderFormData() {
  const [customers, staff, contacts, locations, contracts, industries, departments, orders] = await Promise.all([
    customerProfileStore.list(),
    staffStore.list(),
    contactStore.list(),
    locationStore.list(),
    contractStore.list(),
    industryStore.list(),
    departmentStore.list(),
    orderStore.list(),
  ]);
  const active = customers.filter((c) => c.active !== false).sort(byName);
  return {
    customers: active.map((c) => ({ id: c.id, name: c.name })),
    requestingUnits: active.filter((c) => c.isRequestingUnit).map((c) => ({ id: c.id, name: c.name })),
    staff: staff.map((s) => s.fullName).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")),
    contacts: contacts.map((c) => ({ id: c.id, customerId: c.customerId, name: c.name, phone: c.phone })),
    locations: locations.map((l) => ({ id: l.id, customerId: l.customerId, name: l.name })),
    contracts: contracts.map((c) => ({ id: c.id, customerId: c.customerId, name: c.contractNo })),
    industries: industries.sort(byName).map((i) => ({ id: i.id, name: i.name })),
    departments: departments.sort((a, b) => a.sort - b.sort).map((d) => ({ id: d.id, name: d.name })),
    otherOrders: orders.sort((a, b) => b.code.localeCompare(a.code, undefined, { numeric: true })).map((o) => ({ id: o.id, name: `${o.code} · ${o.name}`, customerId: o.customerId })),
  };
}
