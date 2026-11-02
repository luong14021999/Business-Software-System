// Nạp dữ liệu dùng chung cho các trang con của khách hàng (liên lạc, địa điểm, vị trí, hợp đồng).
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { locationStore } from "@/lib/modules/m2/data/order-extras";
import { currentAccess } from "@/lib/platform/data/access";

/** Khách hàng (và địa điểm nếu có) theo tham số trang; null khi không tìm thấy. */
export async function customerContext(id: string, locId?: string) {
  const [customers, locations, access] = await Promise.all([customerProfileStore.list(), locId ? locationStore.list() : Promise.resolve([]), currentAccess()]);
  const customer = customers.find((c) => c.id === id);
  const location = locId ? locations.find((l) => l.id === locId && l.customerId === id) : undefined;
  if (!customer || (locId && !location)) return null;
  return { customer, location, canWrite: access.can("write.reception") };
}
