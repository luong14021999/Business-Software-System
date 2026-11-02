import {
  Beaker,
  AlertTriangle,
  CalendarOff,
  ShieldAlert,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { daysUntil } from "@/lib/platform/dates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { chemicalProfileStore } from "@/lib/modules/m2/data/chemical-profiles";
import { chemicalUsageLogStore } from "@/lib/modules/m2/data/chemical-usage-logs";
import { AddChemicalDialog } from "@/components/m2/chemicals/add-chemical-dialog";
import { EditChemicalDialog } from "@/components/m2/chemicals/edit-chemical-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { CrudTableCard } from "@/components/crud/crud-table-card";

export const dynamic = "force-dynamic";


const PROFILE_FIELDS: CrudField[] = [
  { name: "chemicalCode", label: "Mã hóa chất", required: true, mono: true },
  { name: "chemicalName", label: "Tên hóa chất / chất chuẩn" },
  {
    name: "docType",
    label: "Loại hồ sơ",
    type: "select",
    options: ["CoA", "MSDS", "Chứng nhận", "Khác"],
  },
  { name: "docCode", label: "Mã hồ sơ", mono: true },
  { name: "issuedBy", label: "Đơn vị cấp" },
  { name: "issueDate", label: "Ngày cấp", type: "date" },
  { name: "fileUrl", label: "Link tài liệu", full: true },
  { name: "note", label: "Ghi chú", full: true },
];

const CHEM_USAGE_FIELDS: CrudField[] = [
  { name: "chemicalCode", label: "Mã hóa chất", required: true, mono: true },
  { name: "chemicalName", label: "Tên hóa chất / chất chuẩn" },
  { name: "category", label: "Chủng loại" },
  { name: "unit", label: "Đơn vị tính" },
  { name: "qty", label: "Số lượng", type: "number" },
  { name: "usedAt", label: "Ngày xuất", type: "date" },
  { name: "remaining", label: "Khối lượng dư", type: "number" },
  { name: "purpose", label: "Mục đích sử dụng", full: true },
  { name: "technician", label: "Người sử dụng" },
  { name: "sampleCode", label: "Mẫu", mono: true },
  { name: "method", label: "Phép thử" },
];

export default async function ChemicalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await chemicalsStore.list();
  const query = q.trim().toLowerCase();
  const chemicals = query
    ? all.filter(
        (c) =>
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.cas.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query),
      )
    : all;

  const [chemicalProfiles, chemicalUsageLogs] = await Promise.all([
    chemicalProfileStore.list(),
    chemicalUsageLogStore.list(),
  ]);

  const stats = [
    {
      label: "Mặt hàng đang quản lý",
      value: all.length,
      icon: Beaker,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Sắp hết hạn (≤ 120 ngày)",
      value: all.filter((c) => daysUntil(c.expiry) <= 120).length,
      icon: CalendarOff,
      accent: "bg-amber-50 text-amber-600",
    },
    {
      label: "Tồn dưới mức tối thiểu",
      value: all.filter((c) => c.stock < c.minStock).length,
      icon: AlertTriangle,
      accent: "bg-rose-50 text-rose-600",
    },
    {
      label: "Hóa chất nguy hiểm",
      value: all.filter((c) =>
        ["Độc hại", "Dễ cháy", "Ăn mòn"].includes(c.hazard),
      ).length,
      icon: ShieldAlert,
      accent: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <>
      <Header
        title="Quản lý hóa chất, chất chuẩn"
        description="Danh mục, hồ sơ (CoA/MSDS), nhật ký sử dụng, hạn dùng và cảnh báo an toàn"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {s.label}
                  </div>
                  <div className="text-3xl font-semibold mt-1.5">{s.value}</div>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.accent}`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between space-y-0">
            <div>
              <CardTitle>Danh mục hóa chất, chất chuẩn</CardTitle>
              <CardDescription>
                Đặc tính kỹ thuật, điều kiện & vị trí bảo quản, ngày nhận và hạn
                sử dụng
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EntitySearchInput
                basePath="/iso-chemicals"
                placeholder="Tìm theo tên, mã..."
              />
              <AddChemicalDialog />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Mã hiệu</TableHead>
                    <TableHead>Tên hóa chất</TableHead>
                    <TableHead>Đặc tính kỹ thuật</TableHead>
                    <TableHead>Ngày SX</TableHead>
                    <TableHead>Điều kiện bảo quản</TableHead>
                    <TableHead>Vị trí bảo quản</TableHead>
                    <TableHead>Dùng cho phép thử</TableHead>
                    <TableHead>Ngày nhận</TableHead>
                    <TableHead>Hạn sử dụng</TableHead>
                    <TableHead className="w-[160px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chemicals.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {query
                          ? `Không có hóa chất nào khớp "${query}"`
                          : "Chưa có hóa chất nào"}
                      </TableCell>
                    </TableRow>
                  )}
                  {chemicals.map((c) => {
                    const expDays = daysUntil(c.expiry);
                    const expiringSoon = expDays <= 120;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.code}</TableCell>
                        <TableCell className="font-medium max-w-[240px]">
                          {c.name}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          {c.technicalSpec || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {c.manufactureDate || "—"}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          {c.storageCondition || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {c.location || "—"}
                        </TableCell>
                        <TableCell>
                          {c.usedFor.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {c.usedFor.map((u) => (
                                <Badge
                                  key={u}
                                  variant="secondary"
                                  className="text-[11px] font-normal"
                                >
                                  {u}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {c.receivedAt || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                expiringSoon
                                  ? "text-warning font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              {c.expiry || "—"}
                            </span>
                            {c.expiry && expiringSoon && (
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <EditChemicalDialog row={c} />
                            <DeleteEntityButton
                              entity="chemicals"
                              id={c.id}
                              label={c.name}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Hồ sơ hóa chất, chất chuẩn */}
        <CrudTableCard
          title="Hồ sơ hóa chất, chất chuẩn"
          description="CoA / MSDS / chứng nhận – phục vụ truy xuất ISO/IEC 17025"
          endpoint="/api/chemical-profiles"
          entity="chemical-profiles"
          editFields={PROFILE_FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/chemical-profiles"
              title="Thêm hồ sơ hóa chất"
              addLabel="Thêm hồ sơ"
              fields={PROFILE_FIELDS}
              submitLabel="Lưu"
            />
          }
          headers={["Hóa chất", "Loại", "Mã hồ sơ", "Đơn vị cấp", "Ngày cấp", "Liên kết"]}
          rows={chemicalProfiles.map((p) => ({
            id: p.id,
            label: p.chemicalName || p.chemicalCode,
            initial: p,
            cells: [
              <div key="hc">
                <div className="font-medium text-sm">{p.chemicalName}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {p.chemicalCode}
                </div>
              </div>,
              <Badge key="loai" variant="outline">
                {p.docType}
              </Badge>,
              <span key="ma" className="font-mono text-xs">
                {p.docCode}
              </span>,
              p.issuedBy,
              <span key="ngay" className="text-muted-foreground text-sm">
                {p.issueDate}
              </span>,
              p.fileUrl ? (
                <a
                  key="lk"
                  href={p.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  Mở
                </a>
              ) : (
                <span key="lk" className="text-muted-foreground text-xs">
                  —
                </span>
              ),
            ],
          }))}
        />

        {/* Nhật ký sử dụng hóa chất, chất chuẩn */}
        <CrudTableCard
          title="Nhật ký sử dụng hóa chất, chất chuẩn"
          description="Chủng loại, số lượng xuất, khối lượng dư, mục đích và người sử dụng"
          endpoint="/api/chemical-usage-logs"
          entity="chemical-usage-logs"
          editFields={CHEM_USAGE_FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/chemical-usage-logs"
              title="Thêm nhật ký sử dụng"
              addLabel="Thêm nhật ký"
              fields={CHEM_USAGE_FIELDS}
              submitLabel="Lưu"
            />
          }
          headers={["Hóa chất", "Chủng loại", "Số lượng", "Ngày xuất", "Dư", "Mục đích", "Người dùng"]}
          rows={chemicalUsageLogs.map((u) => ({
            id: u.id,
            label: u.chemicalName || u.chemicalCode,
            initial: u,
            cells: [
              <div key="hc">
                <div className="font-medium text-sm">{u.chemicalName}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {u.chemicalCode}
                </div>
              </div>,
              <span key="cl" className="text-sm">
                {u.category || "—"}
              </span>,
              <span key="sl" className="text-sm">
                {u.qty} {u.unit}
              </span>,
              <span key="nx" className="text-muted-foreground text-xs">
                {u.usedAt}
              </span>,
              <span key="du" className="text-sm">
                {u.remaining ? `${u.remaining} ${u.unit}` : "—"}
              </span>,
              <span key="md" className="text-sm">
                {u.purpose || u.method || "—"}
              </span>,
              u.technician,
            ],
          }))}
        />
      </main>
    </>
  );
}
