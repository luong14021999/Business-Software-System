import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { XForm } from "@/components/m2/lab-ui/x-form";
import { catalogOf, resolveFields } from "@/lib/modules/m2/catalog-registry";
import { currentAccess } from "@/lib/platform/data/access";
import { permissionForEntity } from "@/lib/platform/permissions";
import { subtitleOf } from "../new/page";

export const dynamic = "force-dynamic";

/** Trang Sửa của một bản ghi danh mục Cài đặt. */
export default async function CatalogEditPage({ params }: { params: Promise<{ catalog: string; id: string }> }) {
  const { catalog, id } = await params;
  const def = catalogOf(catalog);
  if (!def) notFound();
  const [rows, access] = await Promise.all([def.store.list(), currentAccess()]);
  const row = rows.find((r) => r.id === id);
  if (!row || (def.filter && !def.filter(row))) notFound();
  return (
    <LabPage title={def.editTitle ? def.editTitle(row) : "Sửa bản ghi"} subtitle={<span className="text-lg text-[#333]">{subtitleOf(def.listTitle, def.formSubtitle)}</span>}>
      <XForm
        fields={await resolveFields(def.fields)}
        initial={row}
        id={id}
        endpoint={`/api/catalog/${def.slug}`}
        backHref={`/${def.slug}`}
        canWrite={access.can(permissionForEntity(def.store.collection))}
      />
    </LabPage>
  );
}
