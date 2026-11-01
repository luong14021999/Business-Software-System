import {
  FileText,
  FileSignature,
  Inbox,
  CheckCircle2,
  Receipt,
  PackageCheck,
  Filter,
  ArrowRight,
  XCircle,
  Phone,
  User,
  Clock,
  Scale,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type TestRequest,
  type TestRequestStatus,
} from "@/lib/mock-data";
import { testRequestsStore } from "@/lib/modules/m2/data/test-requests";
import { AddTestRequestDialog } from "@/components/m2/test-requests/add-test-request-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";

export const dynamic = "force-dynamic";

const statusVariant: Record<
  TestRequestStatus,
  "secondary" | "default" | "warning" | "success" | "outline" | "destructive"
> = {
  "Yêu cầu mới": "secondary",
  "Đã báo giá": "warning",
  "KH chấp nhận": "default",
  "Đã ký HĐ": "success",
  "Đã nhận mẫu": "outline",
  "Đã hủy": "destructive",
};

function totalOf(r: TestRequest) {
  const subtotal =
    r.criteria.reduce((s, c) => s + c.unitPrice, 0) * r.expectedSamples;
  const vat = subtotal * (r.vatRate / 100);
  return { subtotal, vat, total: subtotal + vat };
}

const formatCurrency = (v: number) =>
  v.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

const pipelineStages: { label: string; status: TestRequestStatus }[] = [
  { label: "Yêu cầu mới", status: "Yêu cầu mới" },
  { label: "Đã báo giá", status: "Đã báo giá" },
  { label: "KH chấp nhận", status: "KH chấp nhận" },
  { label: "Đã ký HĐ", status: "Đã ký HĐ" },
  { label: "Đã nhận mẫu", status: "Đã nhận mẫu" },
];

export default async function TestRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await testRequestsStore.list();
  const query = q.trim().toLowerCase();
  const testRequests = query
    ? all.filter(
        (r) =>
          r.code.toLowerCase().includes(query) ||
          r.customer.toLowerCase().includes(query) ||
          r.matrix.toLowerCase().includes(query) ||
          r.contact.toLowerCase().includes(query),
      )
    : all;

  const counts = all.reduce<Record<TestRequestStatus, number>>(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {
      "Yêu cầu mới": 0,
      "Đã báo giá": 0,
      "KH chấp nhận": 0,
      "Đã ký HĐ": 0,
      "Đã nhận mẫu": 0,
      "Đã hủy": 0,
    },
  );

  const totalValue = all
    .filter((r) => r.status !== "Đã hủy")
    .reduce((sum, r) => sum + totalOf(r).total, 0);

  const stats = [
    {
      label: "Yêu cầu đang xử lý",
      value:
        counts["Yêu cầu mới"] + counts["Đã báo giá"] + counts["KH chấp nhận"],
      icon: Inbox,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Đã ký HĐ trong quý",
      value: counts["Đã ký HĐ"],
      icon: FileSignature,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Đã chuyển thành mẫu",
      value: counts["Đã nhận mẫu"],
      icon: PackageCheck,
      accent: "bg-violet-50 text-violet-600",
    },
    {
      label: "Giá trị HĐ dự kiến",
      value: `${formatCurrency(totalValue / 1_000_000)}M`,
      icon: Receipt,
      accent: "bg-amber-50 text-amber-600",
    },
  ];

  const demoRequest = all.find((r) => r.code.endsWith("00124")) ?? all[0];
  const demoTotals = demoRequest
    ? totalOf(demoRequest)
    : { subtotal: 0, vat: 0, total: 0 };

  return (
    <>
      <Header
        title="Phiếu yêu cầu thử nghiệm"
        description="Lifecycle: KH yêu cầu → Viện báo giá → KH chấp nhận → Ký hợp đồng → Nhận mẫu vào PTN"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          <CardHeader>
            <CardTitle>Pipeline xử lý yêu cầu</CardTitle>
            <CardDescription>
              Số yêu cầu hiện tại theo từng giai đoạn – click vào tab bên dưới để
              xem chi tiết
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <ol className="grid grid-cols-5 gap-2 min-w-[640px]">
                {pipelineStages.map((stage, i) => (
                  <li
                    key={stage.status}
                    className="relative p-3 rounded-md border bg-card text-center"
                  >
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Bước {i + 1}
                    </div>
                    <div className="text-sm font-medium mt-1 leading-tight">
                      {stage.label}
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-primary">
                      {counts[stage.status]}
                    </div>
                    {i < pipelineStages.length - 1 && (
                      <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between space-y-0">
            <div>
              <CardTitle>Danh sách yêu cầu thử nghiệm</CardTitle>
              <CardDescription>
                Tổng {testRequests.length} yêu cầu · giá trị HĐ dự kiến{" "}
                {formatCurrency(totalValue / 1_000_000)} triệu VND
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EntitySearchInput
                basePath="/test-requests"
                placeholder="Tìm mã, khách hàng..."
              />
              <Button variant="outline" size="sm">
                <Filter />
                Lọc
              </Button>
              <AddTestRequestDialog />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="new">Yêu cầu mới</TabsTrigger>
                <TabsTrigger value="quoted">Đã báo giá</TabsTrigger>
                <TabsTrigger value="signed">Đã ký HĐ</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-4 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Mã YC</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Matrix</TableHead>
                    <TableHead className="text-right">Mẫu × Chỉ tiêu</TableHead>
                    <TableHead className="text-right">Giá trị (VND)</TableHead>
                    <TableHead>Hạn KH</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-[110px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testRequests.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {query
                          ? `Không có yêu cầu nào khớp "${query}"`
                          : "Chưa có yêu cầu nào"}
                      </TableCell>
                    </TableRow>
                  )}
                  {testRequests.map((r) => {
                    const total = totalOf(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">
                          {r.code}
                          {r.contractCode && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {r.contractCode}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{r.customer}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {r.contact}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {r.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{r.matrix}</TableCell>
                        <TableCell className="text-right text-xs">
                          {r.expectedSamples} × {r.criteria.length}
                          <div className="text-[10px] text-muted-foreground">
                            = {r.expectedSamples * r.criteria.length} dòng
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          {formatCurrency(total.total)}
                          {r.vatRate > 0 && (
                            <div className="text-[10px] text-muted-foreground font-normal">
                              (VAT {r.vatRate}%)
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {r.expectedDeliveryDays} ngày
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            tạo {r.createdAt.slice(0, 10)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[r.status]}>
                            {r.status === "Đã hủy" && (
                              <XCircle className="w-3 h-3" />
                            )}
                            {r.status === "Đã ký HĐ" && (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DeleteEntityButton
                            entity="test-requests"
                            id={r.id}
                            label={r.code}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {demoRequest && (
        <Card>
          <CardHeader>
            <CardTitle>Demo phiếu yêu cầu thử nghiệm</CardTitle>
            <CardDescription>
              Mẫu phiếu KH gửi đến Viện – tự sinh báo giá từ catalog chỉ tiêu và
              quy tắc quyết định đã phê duyệt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-card p-5 max-w-3xl mx-auto space-y-5">
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Phiếu yêu cầu thử nghiệm
                  </div>
                  <div className="font-mono text-sm font-semibold mt-1">
                    {demoRequest.code}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tạo lúc {demoRequest.createdAt}
                  </div>
                </div>
                <Badge variant={statusVariant[demoRequest.status]}>
                  {demoRequest.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Khách hàng
                  </div>
                  <div className="font-medium">{demoRequest.customer}</div>
                  <div className="text-xs text-muted-foreground">
                    {demoRequest.customerCode}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Đầu mối liên hệ
                  </div>
                  <div className="font-medium">{demoRequest.contact}</div>
                  <div className="text-xs text-muted-foreground">
                    {demoRequest.phone}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Loại mẫu
                  </div>
                  <div className="font-medium">{demoRequest.matrix}</div>
                  <div className="text-xs text-muted-foreground">
                    Dự kiến {demoRequest.expectedSamples} mẫu
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Hạn trả KQ
                  </div>
                  <div className="font-medium">
                    {demoRequest.expectedDeliveryDays} ngày làm việc
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Mục đích yêu cầu
                  </div>
                  <div className="text-sm">{demoRequest.purpose}</div>
                </div>
                <div className="sm:col-span-2 rounded-md bg-primary/5 border border-primary/20 p-2.5">
                  <div className="text-[11px] uppercase text-muted-foreground flex items-center gap-1.5">
                    <Scale className="w-3 h-3" />
                    Quy tắc quyết định
                  </div>
                  <div className="text-sm font-medium">
                    {demoRequest.decisionRule}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase text-muted-foreground mb-2">
                  Báo giá theo chỉ tiêu
                </div>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-xs min-w-[480px]">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-2">Chỉ tiêu</th>
                        <th className="text-left p-2">Phương pháp</th>
                        <th className="text-right p-2">Đơn giá/mẫu</th>
                        <th className="text-right p-2">
                          × {demoRequest.expectedSamples} mẫu
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {demoRequest.criteria.map((c) => (
                        <tr key={c.name} className="border-t">
                          <td className="p-2 font-medium">{c.name}</td>
                          <td className="p-2 text-muted-foreground">
                            {c.method}
                          </td>
                          <td className="p-2 text-right">
                            {formatCurrency(c.unitPrice)}
                          </td>
                          <td className="p-2 text-right font-medium">
                            {formatCurrency(
                              c.unitPrice * demoRequest.expectedSamples,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
                <span className="text-muted-foreground">Cộng (chưa VAT)</span>
                <span className="text-right font-medium">
                  {formatCurrency(demoTotals.subtotal)} đ
                </span>
                <span className="text-muted-foreground">
                  VAT ({demoRequest.vatRate}%)
                </span>
                <span className="text-right font-medium">
                  {formatCurrency(demoTotals.vat)} đ
                </span>
                <span className="text-base font-semibold">Tổng cộng</span>
                <span className="text-right text-base font-semibold text-primary">
                  {formatCurrency(demoTotals.total)} đ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <Button variant="outline">Lưu nháp</Button>
                <Button>
                  <FileSignature />
                  Gửi báo giá cho KH
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <CardTitle>Mối liên kết với các module khác</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {[
                {
                  step: "1",
                  title: "Phiếu yêu cầu",
                  desc: "Module này – ghi nhận yêu cầu, báo giá",
                  link: "/test-requests",
                },
                {
                  step: "2",
                  title: "Khách hàng",
                  desc: "Khi KH chấp nhận – ghép phiếu với hồ sơ khách hàng",
                  link: "/customers",
                },
                {
                  step: "3",
                  title: "Tiếp nhận mẫu",
                  desc: "Khi mẫu đến – /samples tự ghép phiếu YC, sinh mã M-VNNTH-*",
                  link: "/samples",
                },
                {
                  step: "4",
                  title: "Quy trình phân tích",
                  desc: "Bóc tách chỉ tiêu × mẫu sang /analysis",
                  link: "/analysis",
                },
              ].map((s) => (
                <li
                  key={s.step}
                  className="p-3 rounded-md border bg-card flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {s.step}
                    </div>
                    <div className="text-sm font-medium">{s.title}</div>
                  </div>
                  <div className="text-muted-foreground">{s.desc}</div>
                  <div className="text-[11px] font-mono text-primary mt-auto">
                    {s.link}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
