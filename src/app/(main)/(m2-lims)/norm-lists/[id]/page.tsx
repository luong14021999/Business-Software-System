import { RateFormPage } from "@/components/m2/settings/rate-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <RateFormPage kind="norm" id={(await params).id} />;
}
