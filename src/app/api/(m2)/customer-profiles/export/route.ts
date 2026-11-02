import { authorize } from "@/lib/platform/data/access";
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { csvRow } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Xuất danh sách khách hàng ra CSV (mở bằng Excel). */
export async function GET() {
  const gate = await authorize("view.customers");
  if (!gate.ok) return gate.response;
  const rows = (await customerProfileStore.list()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const csv = [
    csvRow(["#", "Tên khách hàng", "Mã khách hàng", "Mã số thuế", "Số điện thoại", "Email", "Tỉnh/TP", "Địa chỉ", "Địa chỉ hóa đơn", "Người đại diện", "Chức danh"]),
    ...rows.map((c, i) => csvRow([i + 1, c.name, c.code, c.taxCode, c.phone, c.email, c.province, c.address, c.invoiceAddress, c.representative, c.representativeTitle])),
  ].join("\r\n");
  return new Response(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="khach-hang.csv"` } });
}
