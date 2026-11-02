import { NormPartsPage } from "@/components/m2/settings/rate-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { id, itemId } = await params;
  return <NormPartsPage id={id} itemId={itemId} />;
}
