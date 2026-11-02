// Áp chỉ tiêu phụ khi bóc tách / thêm chỉ tiêu vào yêu cầu.
import { analyteStore } from "@/lib/modules/m2/data/orders";
import { analyteMappingStore } from "@/lib/modules/m2/data/settings";
import { expandAccessories, type LineItem } from "@/lib/modules/m2/accessories";

export async function withAccessories<T extends LineItem>(lines: T[], sampleTypeId: string): Promise<LineItem[]> {
  const mappings = await analyteMappingStore.list();
  if (!mappings.length || !sampleTypeId) return lines;
  return expandAccessories(lines, sampleTypeId, await analyteStore.list(), mappings);
}
