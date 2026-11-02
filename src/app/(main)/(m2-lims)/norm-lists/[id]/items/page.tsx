import { NormItemsPage } from "@/components/m2/settings/rate-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string; q?: string; page?: string }> }) {
  return <NormItemsPage id={(await params).id} sp={await searchParams} />;
}
