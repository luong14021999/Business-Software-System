import { RateListPage } from "@/components/m2/settings/rate-pages";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  const [{ id }, { type }] = await Promise.all([params, searchParams]);
  return <RateListPage kind="price" id={id} typeFilter={type} />;
}
