import { RateListsPage } from "@/components/m2/settings/rate-pages";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  return <RateListsPage kind="norm" sp={await searchParams} />;
}
