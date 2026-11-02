import { MappingPage } from "@/components/m2/settings/mapping-page";

export const dynamic = "force-dynamic";

export default function NewMappingPage() {
  return <MappingPage initial={{ sampleTypeId: "", mainAnalyteId: "", method: "", accessoryIds: [], hideAccessory: false }} />;
}
