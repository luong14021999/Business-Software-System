import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { XForm } from "@/components/m2/lab-ui/x-form";
import { catalogOf, resolveFields, subtitleOf } from "@/lib/modules/m2/catalog-registry";
import { currentAccess } from "@/lib/platform/data/access";
import { permissionForEntity } from "@/lib/platform/permissions";

export const dynamic = "force-dynamic";

/** Trang Thêm của một danh mục Cài đặt. */
export default async function CatalogNewPage({ params }: { params: Promise<{ catalog: string }> }) {
  const def = catalogOf((await params).catalog);
  if (!def) notFound();
  const access = await currentAccess();
  return (
    <LabPage title={def.newTitle ?? "Tạo mới"} subtitle={<span className="text-lg text-[#333]">{subtitleOf(def.listTitle, def.formSubtitle)}</span>}>
      <XForm
        fields={await resolveFields(def.fields)}
        initial={def.defaults}
        endpoint={`/api/catalog/${def.slug}`}
        backHref={`/${def.slug}`}
        editBase={`/${def.slug}`}
        canWrite={access.can(permissionForEntity(def.store.collection))}
      />
    </LabPage>
  );
}
