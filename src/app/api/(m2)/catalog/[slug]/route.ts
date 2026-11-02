import { NextResponse } from "next/server";
import { catalogOf } from "@/lib/modules/m2/catalog-registry";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** Thêm bản ghi vào một danh mục Cài đặt (khai báo trong catalog-registry); quyền theo collection của kho. */
export async function POST(req: Request, { params }: Ctx) {
  const def = catalogOf((await params).slug);
  if (!def) return NextResponse.json({ error: "Không có danh mục này" }, { status: 404 });
  return collectionRoutes(def.store, def.defaults, def.validate).POST(req);
}
