import { NextResponse } from "next/server";
import { authorize, currentAccess } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderSampleStore, type OrderSample } from "@/lib/modules/m2/data/orders";
import { itemRoutes } from "@/lib/platform/api/crud";
import { dbQuery } from "@/lib/platform/db";
import { orderOwnerGate } from "@/lib/modules/m2/data/order-access";

/** Phần hiện trường của mẫu – NV lấy mẫu sửa được (chỉ đơn mình đi quan trắc). */
const FIELD_KEYS = ["sampler", "sampledAt", "sampleCondition", "sampleQuantity", "lat", "lng", "envConditions"] as const;

export const dynamic = "force-dynamic";

const routes = itemRoutes<OrderSample>(orderSampleStore, {
  validate: (s) =>
    !s.locationName?.trim()
      ? "Nhập vị trí / tên mẫu"
      : s.lat != null && (s.lat < -90 || s.lat > 90)
        ? "Vĩ độ phải trong khoảng -90 đến 90"
        : s.lng != null && (s.lng < -180 || s.lng > 180)
          ? "Kinh độ phải trong khoảng -180 đến 180"
          : null,
});

/**
 * Sửa yêu cầu (mẫu): người có quyền tiếp nhận sửa toàn bộ; người chỉ có quyền hiện trường (NV lấy mẫu)
 * chỉ sửa người lấy mẫu, thời gian, tình trạng, lượng mẫu, tọa độ, điều kiện môi trường của đơn mình đi quan trắc.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await currentAccess();
  if (access.can("write.reception")) return routes.PATCH(req, ctx);
  const gate = await authorize("write.field");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const s = (await orderSampleStore.list()).find((x) => x.id === id);
  if (!s) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  const owner = s.orderId ? await orderOwnerGate(s.orderId, "field") : null;
  if (owner) return owner;
  const body = (await req.json()) as Record<string, unknown>;
  const other = Object.keys(body).filter((k) => !(FIELD_KEYS as readonly string[]).includes(k));
  if (other.length) return NextResponse.json({ error: "Chỉ được sửa thông tin hiện trường của mẫu" }, { status: 403 });
  const patch = Object.fromEntries(FIELD_KEYS.filter((k) => k in body).map((k) => [k, body[k]]));
  const lat = patch.lat as number | null | undefined;
  const lng = patch.lng as number | null | undefined;
  if ((lat != null && !(Math.abs(lat) <= 90)) || (lng != null && !(Math.abs(lng) <= 180))) return NextResponse.json({ error: "Tọa độ không hợp lệ" }, { status: 400 });
  const item = await orderSampleStore.update(id, patch as Partial<OrderSample>);
  await logChange({ entity: "order-samples", entityId: id, action: "Sửa", label: s.code, changes: [{ field: "thông tin hiện trường", old: "", new: Object.keys(patch).join(", ") }] });
  return NextResponse.json({ ok: true, item });
}

/** Xóa yêu cầu (mẫu) chỉ khi chưa có kết quả nào được nhập; xóa luôn các dòng kết quả trống của mẫu. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const s = (await orderSampleStore.list()).find((x) => x.id === id);
  if (!s) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  const [used] = await dbQuery(
    `select count(*)::int n from public.analysis_results where sample_code = $1 and (status <> 'Đang nhập' or mean is not null or result_prefix is not null)`,
    [s.code],
  );
  if (Number(used?.n) > 0) return NextResponse.json({ error: `Mẫu ${s.code} đã có ${used.n} kết quả – không xóa được (dùng trạng thái "Hủy mẫu")` }, { status: 409 });
  await dbQuery(`delete from public.analysis_results where sample_code = $1`, [s.code]);
  await orderSampleStore.remove(id);
  await logChange({ entity: "order-samples", entityId: id, action: "Xoá", label: s.code, changes: [{ field: "bản ghi", old: `${s.code} · ${s.locationName}`, new: "" }] });
  return NextResponse.json({ ok: true });
}
