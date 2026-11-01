import { authorize } from "@/lib/platform/data/access";
import { analyteMethodStore, setDefaultMethod, type AnalyteMethod } from "@/lib/modules/m2/data/settings";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

const patch = patchRoute<AnalyteMethod>(analyteMethodStore);

/** Sửa giới hạn phát hiện / thầu phụ; isDefault = true → đặt làm phương pháp mặc định của chỉ tiêu. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const body = (await req.clone().json()) as Partial<AnalyteMethod>;
  const res = await patch(req, ctx);
  if (res.ok && body.isDefault) {
    const gate = await authorize("write.quality");
    if (!gate.ok) return gate.response;
    const { id } = await ctx.params;
    const m = (await analyteMethodStore.list()).find((x) => x.id === id);
    if (m) await setDefaultMethod(m.analyteId, m.id);
  }
  return res;
}

export const DELETE = deleteRoute<AnalyteMethod>(analyteMethodStore);
