import {
  Filter,
  Building2,
  Sprout,
  Landmark,
  GraduationCap,
  Phone,
  MapPin,
  Download,
  HardDrive,
  Database as DatabaseIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatGrid, type Stat } from "@/components/common/stat-grid";
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
import { type CustomerKind } from "@/lib/mock-data";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { AddCustomerDialog } from "@/components/m2/customers/add-customer-dialog";
import { DeleteCustomerButton } from "@/components/m2/customers/delete-customer-button";
import { CustomerSearchInput } from "@/components/m2/customers/search-input";

export const dynamic = "force-dynamic";

const kindIcon: Record<CustomerKind, LucideIcon> = {
  "Doanh nghiệp": Building2,
  "HTX / Trang trại": Sprout,
  "Nông hộ": Sprout,
  "Cơ quan nhà nước": Landmark,
  "Viện / Trường": GraduationCap,
};

const kindVariant: Record<
  CustomerKind,
  "secondary" | "default" | "warning" | "success" | "outline"
> = {
  "Doanh nghiệp": "default",
  "HTX / Trang trại": "success",
  "Nông hộ": "secondary",
  "Cơ quan nhà nước": "warning",
  "Viện / Trường": "outline",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await getCustomers();
  const query = q.trim().toLowerCase();
  const customers = query
    ? all.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query) ||
          c.contact.toLowerCase().includes(query) ||
          c.address.toLowerCase().includes(query),
      )
    : all;

  const totalSamples = all.reduce((sum, c) => sum + c.samplesYTD, 0);
  const kindCounts = all.reduce<Record<CustomerKind, number>>(
    (acc, c) => {
      acc[c.kind] = (acc[c.kind] || 0) + 1;
      return acc;
    },
    {} as Record<CustomerKind, number>,
  );
  const topCustomers = [...all]
    .sort((a, b) => b.samplesYTD - a.samplesYTD)
    .slice(0, 5);

  const stats: Stat[] = [
    { label: "Tổng khách hàng", value: all.length, accent: "" },
    { label: "Mẫu YTD đã tiếp nhận", value: totalSamples, accent: "" },
    { label: "HTX / Trang trại", value: all.filter((c) => c.kind === "HTX / Trang trại").length, accent: "" },
    { label: "Cơ quan nhà nước", value: all.filter((c) => c.kind === "Cơ quan nhà nước").length, accent: "" },
  ];

  return (
    <>
      <Header
        title="Quản lý khách hàng"
        description="Tổ chức, hợp tác xã, nông hộ và cơ quan gửi mẫu phân tích về Viện"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          {all[0]?.source === "db" ? (
            <Badge variant="success">
              <DatabaseIcon className="w-3 h-3" />
              Dữ liệu live từ Neon
            </Badge>
          ) : (
            <Badge variant="default">
              <HardDrive className="w-3 h-3" />
              Dữ liệu lưu trong{" "}
              <code className="font-mono ml-1">data/customers.json</code>
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {customers.length}
            {query && all.length !== customers.length
              ? ` / ${all.length}`
              : ""}{" "}
            khách hàng
          </span>
        </div>

        <StatGrid stats={stats} />

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between space-y-0">
            <div>
              <CardTitle>Danh sách khách hàng</CardTitle>
              <CardDescription>
                Quản lý thông tin liên hệ, địa chỉ và lịch sử gửi mẫu
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CustomerSearchInput />
              <Button variant="outline" size="sm">
                <Filter />
                Lọc
              </Button>
              <Button variant="outline" size="sm">
                <Download />
                Xuất Excel
              </Button>
              <AddCustomerDialog />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="htx">HTX / Trang trại</TabsTrigger>
                <TabsTrigger value="dn">Doanh nghiệp</TabsTrigger>
                <TabsTrigger value="cq">Cơ quan nhà nước</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-4 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên khách hàng</TableHead>
                    <TableHead>Phân loại</TableHead>
                    <TableHead>Đầu mối liên hệ</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead className="text-right">Mẫu YTD</TableHead>
                    <TableHead>Mẫu gần nhất</TableHead>
                    <TableHead className="w-[110px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => {
                    const Icon = kindIcon[c.kind];
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">
                          {c.code}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">{c.name}</span>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {c.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={kindVariant[c.kind]}>
                            {Icon && <Icon className="w-3 h-3" />}
                            {c.kind}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{c.contact}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[260px]">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {c.samplesYTD}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.lastSampleAt}
                        </TableCell>
                        <TableCell>
                          <DeleteCustomerButton id={c.id} name={c.name} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {customers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {query
                          ? `Không có KH nào khớp "${query}"`
                          : "Chưa có khách hàng nào"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Khách hàng gửi mẫu nhiều nhất</CardTitle>
              <CardDescription>
                Theo số mẫu năm nay – hỗ trợ chính sách CSKH & tự chủ tài chính
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {topCustomers.map((c, idx) => {
                  const pct =
                    totalSamples > 0
                      ? Math.round((c.samplesYTD / totalSamples) * 100)
                      : 0;
                  return (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-md border bg-card"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {c.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.kind}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {c.samplesYTD} mẫu
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pct}% tổng
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cơ cấu khách hàng</CardTitle>
              <CardDescription>Tỷ trọng theo nhóm đối tượng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(kindCounts) as CustomerKind[]).map((k) => {
                const count = kindCounts[k];
                const pct =
                  customers.length > 0
                    ? Math.round((count / customers.length) * 100)
                    : 0;
                const Icon = kindIcon[k];
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 truncate pr-2">
                        {Icon && (
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        {k}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
