import { NextResponse } from "next/server";
import { customersStore, getCustomers } from "@/lib/modules/m2/data/customers";
import { createRoute } from "@/lib/platform/api/crud";
import { authorize } from "@/lib/platform/data/access";
import type { Customer } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("view.customers");
  if (!gate.ok) return gate.response;
  const items = await getCustomers();
  return NextResponse.json({ count: items.length, items });
}

// Qua helper CRUD chung → kiểm tra phân quyền + ghi nhật ký thay đổi.
export const POST = createRoute<Customer>(
  customersStore,
  (body) => ({
    id: "",
    code: body.code ?? "",
    name: body.name ?? "",
    kind: body.kind ?? "Doanh nghiệp",
    contact: body.contact ?? "",
    phone: body.phone ?? "",
    address: body.address ?? "",
    samplesYTD: body.samplesYTD ?? 0,
    lastSampleAt: body.lastSampleAt ?? "",
  }),
  (b) => (!b.code || !b.name || !b.kind ? "Thiếu code / name / kind" : null),
);
