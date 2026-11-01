import {
  Wrench,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { daysUntil } from "@/lib/platform/dates";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { equipmentUsageLogStore } from "@/lib/modules/m2/data/equipment-usage-logs";
import { calibrationLogStore } from "@/lib/modules/m2/data/calibration-logs";
import { maintenanceLogStore } from "@/lib/modules/m2/data/maintenance-logs";
import { inspectionRecordStore } from "@/lib/modules/m2/data/inspection-records";
import { equipmentManualStore } from "@/lib/modules/m2/data/equipment-manuals";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { CrudTableCard } from "@/components/crud/crud-table-card";

export const dynamic = "force-dynamic";

type EquipmentStatus = "Hoạt động" | "Hiệu chuẩn" | "Bảo trì" | "Ngừng";

const statusVariant: Record<
  EquipmentStatus,
  "success" | "warning" | "secondary" | "destructive"
> = {
  "Hoạt động": "success",
  "Hiệu chuẩn": "warning",
  "Bảo trì": "secondary",
  Ngừng: "destructive",
};


// ===== Field schemas =====
const EQUIPMENT_FIELDS: CrudField[] = [
  { name: "code", label: "Mã thiết bị", required: true, mono: true },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    options: ["Hoạt động", "Hiệu chuẩn", "Bảo trì", "Ngừng"],
  },
  { name: "name", label: "Tên thiết bị", required: true, full: true },
  { name: "model", label: "Model" },
  { name: "serial", label: "Số serial" },
  { name: "manufacturer", label: "Nhà sản xuất" },
  { name: "equipmentType", label: "Loại thiết bị", placeholder: "Theo Cài đặt → Loại thiết bị" },
  { name: "isField", label: "Thiết bị quan trắc (mang ra hiện trường)", type: "bool", boolLabels: ["Có", "Không"], defaultValue: 0 },
  { name: "location", label: "Vị trí" },
  { name: "quantity", label: "Số lượng" },
  { name: "purpose", label: "Dùng cho phép thử", full: true },
  { name: "commissionedAt", label: "Ngày vận hành", type: "date" },
  { name: "usageHours", label: "Giờ chạy", type: "number" },
  { name: "lastCalibration", label: "Hiệu chuẩn gần nhất", type: "date" },
  { name: "nextCalibration", label: "Hiệu chuẩn kế tiếp", type: "date" },
  { name: "calibrationFreq", label: "Tần suất hiệu chuẩn" },
  { name: "calibrationPlace", label: "Nơi hiệu chuẩn" },
  { name: "inspectionFreq", label: "Tần suất kiểm tra/bảo kiểm" },
  { name: "inspectionPlace", label: "Nơi kiểm tra/bảo kiểm" },
];

const USAGE_FIELDS: CrudField[] = [
  { name: "equipmentCode", label: "Mã thiết bị", required: true, mono: true },
  { name: "equipmentName", label: "Tên thiết bị" },
  { name: "technician", label: "KTV / Người dùng" },
  { name: "sampleCode", label: "Mẫu", mono: true },
  { name: "startedAt", label: "Bắt đầu", type: "datetime-local" },
  { name: "durationMin", label: "Thời lượng (phút)", type: "number" },
];

const CALIBRATION_FIELDS: CrudField[] = [
  { name: "equipmentCode", label: "Mã thiết bị", required: true, mono: true },
  { name: "equipmentName", label: "Tên thiết bị" },
  { name: "date", label: "Ngày hiệu chuẩn", type: "date" },
  { name: "result", label: "Kết quả", type: "select", options: ["Đạt", "Không đạt"] },
  { name: "certificate", label: "Số giấy chứng nhận" },
  { name: "place", label: "Nơi thực hiện" },
  { name: "nextDate", label: "Hạn kế tiếp", type: "date" },
  { name: "technician", label: "Người theo dõi" },
  { name: "note", label: "Ghi chú", full: true },
];

const MAINTENANCE_FIELDS: CrudField[] = [
  { name: "equipmentCode", label: "Mã thiết bị", required: true, mono: true },
  { name: "equipmentName", label: "Tên thiết bị" },
  { name: "date", label: "Ngày thực hiện", type: "date" },
  {
    name: "kind",
    label: "Loại",
    type: "select",
    options: ["Bảo trì định kỳ", "Bảo dưỡng", "Sửa chữa"],
  },
  { name: "content", label: "Nội dung", full: true },
  { name: "vendor", label: "Đơn vị thực hiện" },
  { name: "technician", label: "Người theo dõi" },
  { name: "note", label: "Ghi chú", full: true },
];

const INSPECTION_FIELDS: CrudField[] = [
  { name: "equipmentCode", label: "Mã thiết bị", required: true, mono: true },
  { name: "equipmentName", label: "Tên thiết bị" },
  { name: "date", label: "Ngày", type: "date" },
  { name: "type", label: "Loại", type: "select", options: ["Kiểm tra", "Kiểm định"] },
  { name: "result", label: "Kết quả", type: "select", options: ["Đạt", "Không đạt"] },
  { name: "conclusion", label: "Kết luận", full: true },
  { name: "inspector", label: "Người/đơn vị kiểm định" },
  { name: "note", label: "Ghi chú", full: true },
];

const MANUAL_FIELDS: CrudField[] = [
  { name: "equipmentCode", label: "Mã thiết bị", required: true, mono: true },
  { name: "equipmentName", label: "Tên thiết bị" },
  { name: "title", label: "Tên tài liệu", required: true, full: true },
  { name: "docCode", label: "Mã tài liệu", mono: true },
  { name: "version", label: "Phiên bản" },
  { name: "fileUrl", label: "Link tài liệu", full: true },
  { name: "note", label: "Ghi chú", full: true },
];


export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await equipmentStore.list();
  const query = q.trim().toLowerCase();
  const equipments = query
    ? all.filter(
        (e) =>
          e.code.toLowerCase().includes(query) ||
          e.name.toLowerCase().includes(query) ||
          e.model.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query),
      )
    : all;

  const [usageLogs, calibrationLogs, maintenanceLogs, inspectionRecords, manuals] =
    await Promise.all([
      equipmentUsageLogStore.list(),
      calibrationLogStore.list(),
      maintenanceLogStore.list(),
      inspectionRecordStore.list(),
      equipmentManualStore.list(),
    ]);

  const stats = [
    {
      label: "Thiết bị đang hoạt động",
      value: all.filter((e) => e.status === "Hoạt động").length,
      icon: CheckCircle2,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Đang hiệu chuẩn / bảo trì",
      value: all.filter((e) => ["Hiệu chuẩn", "Bảo trì"].includes(e.status))
        .length,
      icon: Wrench,
      accent: "bg-amber-50 text-amber-600",
    },
    {
      label: "Sắp đến hạn hiệu chuẩn",
      value: all.filter((e) => daysUntil(e.nextCalibration) <= 60).length,
      icon: CalendarClock,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Cảnh báo quá hạn",
      value: all.filter((e) => daysUntil(e.nextCalibration) < 0).length,
      icon: AlertTriangle,
      accent: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <>
      <Header
        title="Quản lý thiết bị phòng thí nghiệm"
        description="Danh mục thiết bị, hiệu chuẩn – bảo trì, nhật ký sử dụng, biên bản kiểm định và hướng dẫn sử dụng"
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

        {/* 1. Danh mục thiết bị */}
        <section>
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
              <div>
                <CardTitle>Danh mục thiết bị</CardTitle>
                <CardDescription>
                  Mã, serial/model, nhà sản xuất, ngày vận hành, tần suất và lịch
                  hiệu chuẩn / kiểm định
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EntitySearchInput
                  basePath="/equipment"
                  placeholder="Tìm theo mã, tên..."
                />
                <EntityFormDialog
                  mode="add"
                  endpoint="/api/equipment"
                  title="Thêm thiết bị mới"
                  addLabel="Thêm thiết bị"
                  fields={EQUIPMENT_FIELDS}
                  submitLabel="Lưu thiết bị"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-0">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Thiết bị
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Nhà SX / Serial
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Vị trí
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Hiệu chuẩn (gần / kế tiếp)
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Trạng thái
                      </TableHead>
                      <TableHead className="w-[160px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipments.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-sm text-muted-foreground py-8"
                        >
                          {query
                            ? `Không có thiết bị nào khớp "${query}"`
                            : "Chưa có thiết bị nào"}
                        </TableCell>
                      </TableRow>
                    )}
                    {equipments.map((e) => {
                      const days = daysUntil(e.nextCalibration);
                      const dueSoon = days <= 30 && days >= 0;
                      const overdue = days < 0;
                      return (
                        <TableRow
                          key={e.id}
                          className="hover:bg-primary/[0.04] transition-colors"
                        >
                          <TableCell>
                            <div className="font-medium">{e.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {e.code}
                              {e.model ? ` · ${e.model}` : ""}
                              {e.quantity ? ` · SL: ${e.quantity}` : ""}
                            </div>
                            {e.purpose && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Dùng cho: {e.purpose}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{e.manufacturer || "—"}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {e.serial || ""}
                            </div>
                          </TableCell>
                          <TableCell>{e.location}</TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {e.lastCalibration || "—"}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={
                                  overdue
                                    ? "text-destructive font-medium"
                                    : dueSoon
                                      ? "text-warning font-medium"
                                      : ""
                                }
                              >
                                {e.nextCalibration || "—"}
                              </span>
                              {(dueSoon || overdue) && (
                                <AlertTriangle
                                  className={`w-3.5 h-3.5 ${overdue ? "text-destructive" : "text-warning"}`}
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[e.status]}>
                              {e.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1.5">
                              <EntityFormDialog
                                mode="edit"
                                endpoint="/api/equipment"
                                id={e.id}
                                title="Sửa thiết bị"
                                fields={EQUIPMENT_FIELDS}
                                initial={e}
                                submitLabel="Lưu thay đổi"
                              />
                              <DeleteEntityButton
                                entity="equipment"
                                id={e.id}
                                label={e.name}
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
        </section>

        {/* 4. Nhật ký sử dụng thiết bị */}
        <CrudTableCard
          title="Nhật ký sử dụng thiết bị"
          description="Logbook: người dùng, mẫu liên quan và thời lượng vận hành"
          endpoint="/api/equipment-usage-logs"
          entity="equipment-usage-logs"
          editFields={USAGE_FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/equipment-usage-logs"
              title="Thêm nhật ký sử dụng"
              addLabel="Thêm nhật ký"
              fields={USAGE_FIELDS}
              submitLabel="Lưu"
            />
          }
          headers={["Thiết bị", "KTV", "Mẫu", "Bắt đầu", "Thời lượng"]}
          rows={usageLogs.map((u) => ({
            id: u.id,
            label: u.equipmentName || u.equipmentCode,
            initial: u,
            cells: [
              <div key="tb">
                <div className="font-medium text-sm">{u.equipmentName}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {u.equipmentCode}
                </div>
              </div>,
              u.technician,
              <span key="mau" className="font-mono text-xs">
                {u.sampleCode}
              </span>,
              <span key="bd" className="text-muted-foreground text-xs">
                {u.startedAt}
              </span>,
              <span key="tl" className="text-xs">
                {u.durationMin} phút
              </span>,
            ],
          }))}
        />

        {/* 5. Nhật ký hiệu chuẩn thiết bị */}
        <CrudTableCard
          title="Nhật ký theo dõi hiệu chuẩn thiết bị"
          description="Ngày hiệu chuẩn, kết quả, giấy chứng nhận, nơi thực hiện và hạn kế tiếp"
          endpoint="/api/calibration-logs"
          entity="calibration-logs"
          editFields={CALIBRATION_FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/calibration-logs"
              title="Thêm nhật ký hiệu chuẩn"
              addLabel="Thêm hiệu chuẩn"
              fields={CALIBRATION_FIELDS}
              submitLabel="Lưu"
            />
          }
          headers={["Thiết bị", "Ngày", "Kết quả", "Giấy CN", "Nơi thực hiện", "Hạn kế tiếp"]}
          rows={calibrationLogs.map((c) => ({
            id: c.id,
            label: c.equipmentName || c.equipmentCode,
            initial: c,
            cells: [
              <div key="tb">
                <div className="font-medium text-sm">{c.equipmentName}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {c.equipmentCode}
                </div>
              </div>,
              <span key="ngay" className="text-muted-foreground text-sm">
                {c.date}
              </span>,
              <Badge key="kq" variant={c.result === "Đạt" ? "success" : "destructive"}>
                {c.result}
              </Badge>,
              <span key="cn" className="font-mono text-xs">
                {c.certificate}
              </span>,
              c.place,
              <span key="han" className="text-muted-foreground text-sm">
                {c.nextDate}
              </span>,
            ],
          }))}
        />

        {/* 6. Nhật ký bảo trì, bảo dưỡng thiết bị */}
        <CrudTableCard
          title="Nhật ký theo dõi bảo trì, bảo dưỡng thiết bị"
          description="Loại công việc, nội dung, đơn vị thực hiện"
          endpoint="/api/maintenance-logs"
          entity="maintenance-logs"
          editFields={MAINTENANCE_FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/maintenance-logs"
              title="Thêm nhật ký bảo trì / bảo dưỡng"
              addLabel="Thêm bảo trì"
              fields={MAINTENANCE_FIELDS}
              submitLabel="Lưu"
            />
          }
          headers={["Thiết bị", "Ngày", "Loại", "Nội dung", "Đơn vị"]}
          rows={maintenanceLogs.map((m) => ({
            id: m.id,
            label: m.equipmentName || m.equipmentCode,
            initial: m,
            cells: [
              <div key="tb">
                <div className="font-medium text-sm">{m.equipmentName}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {m.equipmentCode}
                </div>
              </div>,
              <span key="ngay" className="text-muted-foreground text-sm">
                {m.date}
              </span>,
              <Badge key="loai" variant="secondary" className="font-normal">
                {m.kind}
              </Badge>,
              <span key="nd" className="text-sm">
                {m.content}
              </span>,
              m.vendor,
            ],
          }))}
        />

        {/* 3. Biên bản kiểm tra/kiểm định thiết bị */}
        <CrudTableCard
          title="Biên bản kiểm tra / kiểm định thiết bị"
          description="Hồ sơ đánh giá thiết bị – phục vụ truy xuất ISO/IEC 17025"
          endpoint="/api/inspection-records"
          entity="inspection-records"
          editFields={INSPECTION_FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/inspection-records"
              title="Thêm biên bản kiểm tra / kiểm định"
              addLabel="Thêm biên bản"
              fields={INSPECTION_FIELDS}
              submitLabel="Lưu"
            />
          }
          headers={["Thiết bị", "Ngày", "Loại", "Kết quả", "Kết luận", "Người/ĐV"]}
          rows={inspectionRecords.map((r) => ({
            id: r.id,
            label: r.equipmentName || r.equipmentCode,
            initial: r,
            cells: [
              <div key="tb">
                <div className="font-medium text-sm">{r.equipmentName}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {r.equipmentCode}
                </div>
              </div>,
              <span key="ngay" className="text-muted-foreground text-sm">
                {r.date}
              </span>,
              <Badge key="loai" variant="outline">
                {r.type}
              </Badge>,
              <Badge key="kq" variant={r.result === "Đạt" ? "success" : "destructive"}>
                {r.result}
              </Badge>,
              <span key="kl" className="text-sm">
                {r.conclusion}
              </span>,
              r.inspector,
            ],
          }))}
        />

        {/* 2. Hướng dẫn sử dụng thiết bị */}
        <CrudTableCard
          title="Hướng dẫn sử dụng thiết bị"
          description="Tài liệu HDSD theo thiết bị – mã tài liệu, phiên bản, liên kết"
          endpoint="/api/equipment-manuals"
          entity="equipment-manuals"
          editFields={MANUAL_FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/equipment-manuals"
              title="Thêm hướng dẫn sử dụng"
              addLabel="Thêm tài liệu"
              fields={MANUAL_FIELDS}
              submitLabel="Lưu"
            />
          }
          headers={["Thiết bị", "Tên tài liệu", "Mã TL", "Phiên bản", "Liên kết"]}
          rows={manuals.map((m) => ({
            id: m.id,
            label: m.title,
            initial: m,
            cells: [
              <div key="tb">
                <div className="font-medium text-sm">{m.equipmentName}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {m.equipmentCode}
                </div>
              </div>,
              <span key="tt" className="text-sm">
                {m.title}
              </span>,
              <span key="ma" className="font-mono text-xs">
                {m.docCode}
              </span>,
              m.version,
              m.fileUrl ? (
                <a
                  key="lk"
                  href={m.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
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
      </main>
    </>
  );
}
