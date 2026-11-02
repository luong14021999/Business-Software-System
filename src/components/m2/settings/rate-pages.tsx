import Link from "next/link";
import { notFound } from "next/navigation";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { LabPage, btn, btnPrimary, input, link, table } from "@/components/m2/lab-ui/page";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XForm, type XFormField } from "@/components/m2/lab-ui/x-form";
import { XActionLinks, XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { CopyLink } from "@/components/m2/settings/copy-link";
import { FileUpload } from "@/components/m2/settings/file-upload";
import { NormAdd } from "@/components/m2/settings/norm-add";
import { NormPartsForm } from "@/components/m2/settings/norm-parts-form";
import { RateGrid } from "@/components/m2/settings/rate-grid";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { NORM_CATEGORIES, containerTypeStore, instrumentTypeStore, normPartStore, rateItemStore, rateListStore, type RateKind, type RateList } from "@/lib/modules/m2/data/settings";
import { labProductStore, samplingContainerStore } from "@/lib/modules/m2/data/catalogs";
import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { RATE_COLUMNS } from "@/lib/modules/m2/rate-io";
import { currentAccess } from "@/lib/platform/data/access";
import { normalizeVi } from "@/lib/platform/format";

const META: Record<RateKind, { base: string; list: string; one: string; info: string }> = {
  price: { base: "/price-lists", list: "Danh sách bảng giá", one: "bảng giá", info: "Thông tin bảng giá" },
  norm: { base: "/norm-lists", list: "Danh sách bảng định mức", one: "bảng định mức", info: "Thông tin bảng định mức" },
};

type SP = { q?: string; status?: string; page?: string };

/** Danh sách bảng giá / bảng định mức như XaLab: Tên (bảng giá thêm cột Giá vốn); cuối dòng Copy | Chỉ tiêu | Xóa. */
export async function RateListsPage({ kind, sp }: { kind: RateKind; sp: SP }) {
  const m = META[kind];
  const [lists, access] = await Promise.all([rateListStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  const q = normalizeVi(sp.q ?? "");
  const rows = lists
    .filter((l) => l.kind === kind)
    .filter((l) => !sp.status || (sp.status === "dang-dung" ? l.active : !l.active))
    .filter((l) => !q || normalizeVi(l.name).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  return (
    <XListPage
      title={m.list}
      basePath={m.base}
      sp={sp}
      newHref={canWrite ? `${m.base}/new` : undefined}
      headers={kind === "price" ? ["Tên", "Giá vốn"] : ["Tên"]}
      searchPlaceholder={kind === "price" ? "Tên bảng giá..." : "Tên bảng định mức..."}
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((l, i) => ({
        id: l.id,
        no: (page - 1) * 10 + i + 1,
        href: `${m.base}/${l.id}`,
        cells: [<span key="n" className={l.active ? undefined : "line-through"}>{l.name}</span>, ...(kind === "price" ? [<input key="c" type="checkbox" checked={l.costPrice} readOnly disabled aria-label="Giá vốn" />] : [])],
        actions: (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            {canWrite && <><CopyLink url={`/api/rate-lists/${l.id}/copy`} openBase={m.base} label={`${m.one} "${l.name}" kèm các chỉ tiêu`} /><span className="text-[#333]">|</span></>}
            <XActionLinks links={[{ label: "Chỉ tiêu", href: `${m.base}/${l.id}/${kind === "price" ? "tools" : "items"}`, icon: "list" }]} del={canWrite ? <XDeleteLink url={`/api/rate-lists/${l.id}`} label={l.name} /> : undefined} />
          </span>
        ),
      }))}
    />
  );
}

/** Form bảng giá (Tên, Mô tả, Giá vốn) / bảng định mức (Tên, Mô tả). */
export async function RateFormPage({ kind, id }: { kind: RateKind; id?: string }) {
  const m = META[kind];
  const [lists, access] = await Promise.all([rateListStore.list(), currentAccess()]);
  const list = id ? lists.find((l) => l.id === id && l.kind === kind) : undefined;
  if (id && !list) notFound();
  const fields: XFormField[] = [
    { name: "name", label: "Tên", required: true },
    { name: "note", label: "Mô tả" },
    ...(kind === "price" ? [{ name: "costPrice", label: "Giá vốn", type: "checkbox" as const }] : []),
    { name: "active", label: "Đang dùng", type: "checkbox" },
  ];
  return (
    <LabPage title={list ? list.name : "Tạo mới"} subtitle={<span className="text-lg text-[#333]">{m.info}</span>}>
      <XForm
        fields={fields}
        initial={{ name: list?.name ?? "", note: list?.note ?? "", costPrice: list?.costPrice ?? false, active: list?.active ?? true }}
        endpoint="/api/rate-lists"
        id={list?.id}
        extra={{ kind }}
        backHref={m.base}
        editBase={m.base}
        canWrite={access.can("write.quality")}
      />
    </LabPage>
  );
}

const listOr404 = async (id: string, kind: RateKind): Promise<RateList> => {
  const l = (await rateListStore.list()).find((x) => x.id === id && x.kind === kind);
  if (!l) notFound();
  return l;
};

/** "Công cụ" của bảng giá như XaLab: chọn loại mẫu → Xem chỉ tiêu; Xuất Excel; Nhập Excel. */
export async function PriceToolsPage({ id }: { id: string }) {
  const [list, types, access] = await Promise.all([listOr404(id, "price"), sampleTypeStore.list(), currentAccess()]);
  return (
    <LabPage title={`Bảng giá ${list.name}`}>
      <form action={`/price-lists/${id}/items`} className="flex flex-wrap items-center gap-2 py-[10px]">
        <label htmlFor="type" className="w-[165px] text-sm font-bold sm:text-right">Loại mẫu</label>
        <select id="type" name="type" required className={`${input} sm:!w-[262px]`}>
          <option value="">Chọn loại mẫu</option>
          {types.filter((t) => t.active).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className={btnPrimary}>Xem chỉ tiêu</button>
        <a href={`/api/rate-lists/${id}/items`} className={btnPrimary}>Xuất Excel</a>
      </form>
      {access.can("write.quality") && (
        <div className="mt-4 border-t border-[#eee] pt-4">
          <FileUpload url={`/api/rate-lists/${id}/items`} doneHref={`/price-lists/${id}/tools`} />
          <p className="mt-2 text-sm text-[#555]">Nhập Excel: file CSV với các cột {RATE_COLUMNS.join(", ")} (dùng file Xuất Excel làm mẫu). Ô Đơn giá trống thì bỏ chỉ tiêu khỏi bảng giá.</p>
        </div>
      )}
      <div className="mt-4"><Link href="/price-lists" className={btn}>Quay lại</Link></div>
    </LabPage>
  );
}

/** Lưới giá của các chỉ tiêu một loại mẫu trong bảng giá (sửa trực tiếp rồi Lưu). */
export async function PriceGridPage({ id, type }: { id: string; type?: string }) {
  const [list, types, analytes, items, access] = await Promise.all([listOr404(id, "price"), sampleTypeStore.list(), analyteStore.list(), rateItemStore.list(), currentAccess()]);
  const t = types.find((x) => x.id === type);
  if (!t) notFound();
  const mine = items.filter((i) => i.listId === id && i.sampleTypeId === t.id);
  const by = new Map(mine.map((i) => [i.analyte.toLowerCase(), i]));
  const names = [...new Map([...analytes.filter((a) => a.active && a.sampleTypeId === t.id).sort((a, b) => a.sort - b.sort).map((a) => [a.name.toLowerCase(), { name: a.name, unit: a.unit, ref: a.unitPrice }] as const), ...mine.map((i) => [i.analyte.toLowerCase(), { name: i.analyte, unit: "", ref: 0 }] as const)]).values()];
  return (
    <LabPage title={`Bảng giá ${list.name} – ${t.name}`}>
      <RateGrid
        listId={id}
        sampleTypeId={t.id}
        costPrice={list.costPrice}
        backHref={`/price-lists/${id}/tools`}
        canWrite={access.can("write.quality")}
        rows={names.map((n) => ({ analyte: n.name, unit: n.unit, refPrice: n.ref, amount: by.get(n.name.toLowerCase())?.amount ?? null, cost: by.get(n.name.toLowerCase())?.cost ?? null }))}
      />
    </LabPage>
  );
}

/** Bảng định mức: các chỉ tiêu (Loại mẫu, Chỉ tiêu, Cài đặt định mức, Xóa) + thêm chỉ tiêu theo loại mẫu như XaLab. */
export async function NormItemsPage({ id, sp }: { id: string; sp: { type?: string; q?: string; page?: string } }) {
  const [list, types, analytes, items, access] = await Promise.all([listOr404(id, "norm"), sampleTypeStore.list(), analyteStore.list(), rateItemStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const q = normalizeVi(sp.q ?? "");
  const rows = items
    .filter((i) => i.listId === id && (!sp.type || i.sampleTypeId === sp.type))
    .filter((i) => !q || normalizeVi(`${typeName.get(i.sampleTypeId) ?? ""} ${i.analyte}`).includes(q))
    .sort((a, b) => (typeName.get(a.sampleTypeId) ?? "").localeCompare(typeName.get(b.sampleTypeId) ?? "", "vi") || a.analyte.localeCompare(b.analyte, "vi"));
  const { page, pages, slice } = paginate(rows, sp, 20);
  const url = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...patch }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/norm-lists/${id}/items${p.size ? `?${p}` : ""}`;
  };
  const money = (n: number) => n.toLocaleString("vi-VN");
  return (
    <LabPage title={`Bảng định mức ${list.name}`}>
      <div className="flex flex-wrap items-center gap-1">
        <Dropdown filter className={`${btn} rounded-r-none`} label={`Loại mẫu: ${typeName.get(sp.type ?? "") ?? "Tất cả"}`} items={[{ label: "Tất cả", href: url({ type: undefined }), active: !sp.type }, ...types.map((t) => ({ label: t.name, href: url({ type: t.id }), active: sp.type === t.id }))]} />
        <form action={`/norm-lists/${id}/items`} className="-ml-px flex">
          {sp.type && <input type="hidden" name="type" value={sp.type} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Tên loại mẫu hoặc chỉ tiêu..." aria-label="Tìm" className={`${input} !w-60 rounded-none`} />
          <button className={`${btn} rounded-l-none border-l-0`}>Tìm</button>
        </form>
      </div>
      <table className={`${table} mt-4`}>
        <thead><tr><th>Loại mẫu</th><th>Chỉ tiêu phân tích</th><th>Đơn giá định mức (đ)</th><th /></tr></thead>
        <tbody>
          {slice.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Chưa có chỉ tiêu</td></tr>}
          {slice.map((i) => (
            <tr key={i.id}>
              <td>{typeName.get(i.sampleTypeId) ?? ""}</td>
              <td>{i.analyte}</td>
              <td className="text-right">{money(i.amount)}</td>
              <td className="whitespace-nowrap text-right">
                <Link href={`/norm-lists/${id}/items/${i.id}`} className={link}>Cài đặt định mức</Link>
                {canWrite && <> <span className="mx-1 text-[#333]">|</span><XDeleteLink url={`/api/rate-items/${i.id}`} label={i.analyte} /></>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 text-sm">Trang {rows.length ? page : 0} / {pages} {pages > 1 && <>· {page > 1 && <Link className={link} href={`${url({})}${url({}).includes("?") ? "&" : "?"}page=${page - 1}`}>« Trước</Link>} {page < pages && <Link className={link} href={`${url({})}${url({}).includes("?") ? "&" : "?"}page=${page + 1}`}>Sau »</Link>}</>}</div>
      {canWrite && (
        <NormAdd
          listId={id}
          types={types.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }))}
          analytes={analytes.filter((a) => a.active).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "vi")).map((a) => ({ name: a.name, sampleTypeId: a.sampleTypeId }))}
          existing={items.filter((i) => i.listId === id).map((i) => `${i.sampleTypeId}|${i.analyte.toLowerCase()}`)}
        />
      )}
      <div className="mt-4"><Link href="/norm-lists" className={btn}>Quay lại</Link></div>
    </LabPage>
  );
}

/** "Cài đặt định mức - <chỉ tiêu>": các khoản định mức theo 7 nhóm như XaLab. */
export async function NormPartsPage({ id, itemId }: { id: string; itemId: string }) {
  const [list, items, parts, types, containers, samplingContainers, instruments, chemicals, products, access] = await Promise.all([
    listOr404(id, "norm"),
    rateItemStore.list(),
    normPartStore.list(),
    sampleTypeStore.list(),
    containerTypeStore.list(),
    samplingContainerStore.list(),
    instrumentTypeStore.list(),
    chemicalsStore.list(),
    labProductStore.list(),
    currentAccess(),
  ]);
  const item = items.find((i) => i.id === itemId && i.listId === id);
  if (!item) notFound();
  const sorted = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const options: Record<string, string[]> = {
    "Dụng cụ lấy mẫu": sorted([...samplingContainers.map((c) => c.name), ...containers.map((c) => c.name)]),
    "Thiết bị HT": sorted(instruments.filter((t) => t.isField).map((t) => t.name)),
    "Vật liệu HT": sorted(chemicals.map((c) => c.name)),
    "Dụng cụ phân tích": sorted(products.map((p) => p.name)),
    "Thiết bị PTN": sorted(instruments.filter((t) => !t.isField).map((t) => t.name)),
    "Vật liệu PTN": sorted(chemicals.map((c) => c.name)),
  };
  const usedTypes = new Set(items.filter((i) => i.listId === id && i.id !== itemId).map((i) => i.sampleTypeId));
  return (
    <LabPage title={`Cài đặt định mức - ${item.analyte}`} subtitle={<span className="text-lg text-[#333]">Bảng định mức {list.name}</span>}>
      <NormPartsForm
        itemId={itemId}
        backHref={`/norm-lists/${id}/items`}
        categories={[...NORM_CATEGORIES]}
        options={options}
        initial={parts.filter((p) => p.itemId === itemId).sort((a, b) => a.sort - b.sort).map((p) => ({ category: p.category, name: p.name, quantity: String(p.quantity).replace(".", ","), unitPrice: String(p.unitPrice) }))}
        others={items.filter((i) => i.listId === id && i.id !== itemId).map((i) => ({ id: i.id, sampleTypeId: i.sampleTypeId, analyte: i.analyte }))}
        types={types.filter((t) => usedTypes.has(t.id)).map((t) => ({ value: t.id, label: t.name }))}
        canWrite={access.can("write.quality")}
      />
    </LabPage>
  );
}
