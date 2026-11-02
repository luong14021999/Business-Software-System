import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderSampleStore, type OrderSample } from "@/lib/modules/m2/data/orders";
import { itemRoutes } from "@/lib/platform/api/crud";
import { dbQuery } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

export const { PATCH } = itemRoutes<OrderSample>(orderSampleStore, {
  validate: (s) =>
    !s.locationName?.trim()
      ? "Nhập vị trí / tên mẫu"
      : s.lat != null && (s.lat < -90 || s.lat > 90)
        ? "Vĩ độ phải trong khoảng -90 đến 90"
        : s.lng != null && (s.lng < -180 || s.lng > 180)
          ? "Kinh độ phải trong khoảng -180 đến 180"
          : null,
});

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
