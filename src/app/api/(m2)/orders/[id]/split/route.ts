import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { orderSampleStore, orderStore, sampleCodesLike, sampleTypeStore, type OrderSample } from "@/lib/modules/m2/data/orders";
import { initialApprovals, insertResult, nextResultCode } from "@/lib/modules/m2/data/results";
import { nextSampleCodes } from "@/lib/modules/m2/orders";
import { todayISO, vnDateOf } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

type Line = { name: string; unit?: string; method?: string; subcontractor?: string };
type Body = {
  locationName?: string;
  sampleTypeId?: string;
  customerSampleCode?: string;
  count?: number;
  isQc?: boolean;
  isDuplicate?: boolean;
  specId?: string;
  lines?: Line[];
};

/**
 * Bóc tách: tạo `count` yêu cầu (mẫu) cùng vị trí / loại mẫu / danh sách chỉ tiêu cho đơn hàng.
 * Mã mẫu = tiền tố loại mẫu + ngày quan trắc (hoặc hôm nay) + số thứ tự; mỗi chỉ tiêu một dòng kết quả "Đang nhập".
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const b = (await req.json()) as Body;
  const order = (await orderStore.list()).find((o) => o.id === id);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  if (order.status === "Hủy" || order.status === "Thanh lý") return NextResponse.json({ error: `Đơn hàng đã ${order.status.toLowerCase()}` }, { status: 409 });
  const type = (await sampleTypeStore.list()).find((t) => t.id === b.sampleTypeId);
  if (!type) return NextResponse.json({ error: "Chọn loại mẫu" }, { status: 400 });
  const location = String(b.locationName ?? "").trim();
  if (!location) return NextResponse.json({ error: "Nhập vị trí / tên mẫu" }, { status: 400 });
  const lines = (b.lines ?? []).filter((l) => String(l.name ?? "").trim());
  if (!lines.length) return NextResponse.json({ error: "Thêm ít nhất một chỉ tiêu" }, { status: 400 });
  const count = Math.min(50, Math.max(1, Math.round(Number(b.count) || 1)));

  const day = vnDateOf(order.fieldAt) || todayISO();
  const codes = nextSampleCodes(type.prefix, day, await sampleCodesLike(type.prefix), count);
  const customer = (await getCustomers()).find((c) => c.id === order.customerId);
  const year = todayISO().slice(0, 4);
  const stage = order.kind === "Mẫu gửi" ? "Nhận mẫu" : "Đợi lấy mẫu";

  const created: OrderSample[] = [];
  for (const code of codes) {
    const sample = await orderSampleStore.create({
      id: "",
      code,
      customerId: order.customerId,
      customer: customer?.name ?? "",
      type: type.name,
      receivedAt: stage === "Nhận mẫu" ? vnDateOf(order.receivedAt) || todayISO() : "",
      dueAt: vnDateOf(order.dueAt),
      status: "Đã tiếp nhận",
      criteria: lines.map((l) => l.name.trim()),
      orderId: order.id,
      sampleTypeId: type.id,
      locationName: count > 1 ? `${location} #${created.length + 1}` : location,
      customerSampleCode: String(b.customerSampleCode ?? "").trim(),
      isQc: Boolean(b.isQc),
      isDuplicate: Boolean(b.isDuplicate),
      sampledAt: "",
      stage,
      specId: b.specId ?? "",
    });
    created.push(sample);
    let sort = 0;
    for (const l of lines) {
      await insertResult({
        result_code: await nextResultCode(year),
        sample_code: code,
        customer_name: customer?.name ?? "",
        matrix: type.name,
        criterion: l.name.trim(),
        unit: l.unit ?? "",
        method: l.method ?? "",
        subcontractor: l.subcontractor ?? "",
        sort: ++sort,
        status: "Đang nhập",
        approvals: initialApprovals(),
        replicates: [],
        raw_files: [],
        conclusion: "Báo cáo giá trị",
      });
    }
  }
  await logChange({
    entity: "orders",
    entityId: order.id,
    action: "Bóc tách",
    label: `${order.code} · ${order.name}`,
    changes: [{ field: "mẫu", old: "", new: `${codes.join(", ")} · ${lines.length} chỉ tiêu/mẫu` }],
  });
  return NextResponse.json({ ok: true, codes, samples: created.length, lines: created.length * lines.length }, { status: 201 });
}
