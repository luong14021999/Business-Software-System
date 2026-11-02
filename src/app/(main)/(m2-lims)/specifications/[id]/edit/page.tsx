import { notFound } from "next/navigation";
import { SpecFormPage } from "@/components/m2/settings/spec-form-page";
import { specById } from "@/lib/modules/m2/data/specs";

export const dynamic = "force-dynamic";

export default async function EditSpecificationPage({ params }: { params: Promise<{ id: string }> }) {
  const spec = await specById((await params).id);
  if (!spec) notFound();
  return <SpecFormPage spec={spec} />;
}
