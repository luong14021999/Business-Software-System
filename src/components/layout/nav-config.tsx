"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  ArrowRightLeft,
  ArrowLeft,
  ClipboardList,
  FlaskConical,
  Wrench,
  Beaker,
  FileText,
  BookOpen,
  Settings,
  Layers,
  Users,
  TestTube,
  Users2,
  Gauge,
  Workflow,
  Database,
  Network,
  Warehouse,
  TrendingUp,
  ShieldAlert,
  HeartPulse,
  UserCog,
  NotebookPen,
  BarChart3,
  Archive,
  Thermometer,
  ShieldCheck,
  AlertOctagon,
  Scale,
  Smartphone,
  FileSignature,
  Telescope,
  ClipboardEdit,
  MessageSquare,
  Award,
  ListChecks,
  FileStack,
  OctagonAlert,
  SearchCheck,
  Presentation,
  ShieldHalf,
  UserCheck,
  Truck,
  FlaskRound,
  ShieldBan,
  History,
  BadgeCheck,
  KeyRound,
  Calculator,
  LineChart,
  ServerCrash,
  Leaf,
  FlaskConicalOff,
  Boxes,
  QrCode,
  Dna,
  Sprout,
  ClipboardCheck,
  PieChart,
  TreeDeciduous,
  CalendarDays,
  Package,
  TreePine,
  GitBranch,
  Tractor,
  ScanSearch,
  SearchCode,
  MapPinned,
  Map as MapIcon,
  Newspaper,
  Microscope,
  type LucideIcon,
} from "lucide-react";
import { pagePermission } from "@/lib/platform/permissions";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Quyền xem bị từ chối của người đang đăng nhập → ẩn các mục menu cần quyền đó (trang vẫn tự chặn). */
const DeniedContext = createContext<readonly string[]>([]);
export const DeniedPermissions = DeniedContext.Provider;
/** Nhóm menu sau khi bỏ các trang không có quyền xem; nhóm rỗng bị bỏ. */
export function useVisibleGroups(groups: NavGroup[]) {
  const denied = useContext(DeniedContext);
  if (!denied.length) return groups;
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => { const p = pagePermission(i.href); return !p || !denied.includes(p); }) }))
    .filter((g) => g.items.length);
}
/** `link`: khung "topnav" hiện nhóm thành 1 mục menu (trang đầu), không xổ danh sách. */
export type NavGroup = { label: string; items: NavItem[]; link?: boolean };
/** Tab chính của phần mềm dùng khung riêng: gom một số trang (theo href trong `groups`), trang đầu là trang vào. */
export type NavTab = { label: string; icon: LucideIcon; hrefs: string[]; /** Hiện ở thanh dưới đáy trên điện thoại. */ mobile?: boolean; };
/**
 * Khung điều hướng: "sidebar" = menu dọc bên trái (phòng thí nghiệm);
 * "bench" = tab lớn + danh mục, thanh dưới đáy trên điện thoại (nuôi cấy mô – dùng tại phòng cấy);
 * "hub" = tab ngang theo khu nghiệp vụ, lấy hồ sơ làm trung tâm (giống);
 * "topnav" = thanh menu ngang, mỗi nhóm là một mục hoặc một menu xổ xuống (phòng thí nghiệm);
 * "console" = bảng điều khiển quản trị: bảng điều hành là trung tâm, các trang có đường dẫn quay về (nền tảng dùng chung).
 */
export type ModuleShell = "sidebar" | "bench" | "hub" | "console" | "topnav";
/** Khóa giao diện: chọn bộ màu `[data-module]` trong globals.css. */
export type ModuleKey = "dh" | "m1" | "m2" | "m3-1" | "m3-2";
/** Phân hệ của nền tảng: mỗi phân hệ gồm nhiều nhóm menu và có bản sắc giao diện riêng. */
export type NavModule = {
  code: string;
  name: string;
  /** Bộ màu riêng của phần mềm. */
  key: ModuleKey;
  icon: LucideIcon;
  /** Một dòng mô tả hiện dưới tên phần mềm ở thanh trên. */
  tagline: string;
  /** Gợi ý trong ô tìm kiếm ở đầu mỗi trang. */
  searchHint: string;
  /** Trang vào phần mềm (ô ở trang chủ). */
  home: string;
  shell?: ModuleShell;
  tabs?: NavTab[];
  groups: NavGroup[];
};

/** Trang chủ: chọn phần mềm (không có sidebar). */
export const navHome: NavItem[] = [{ href: "/", label: "Trang chủ – các phần mềm", icon: LayoutDashboard }];

export const navModules: NavModule[] = [
  {
    code: "ĐH",
    home: "/executive",
    shell: "hub",
    tabs: [
      { label: "Bảng điều hành", icon: Gauge, hrefs: ["/executive"] },
      { label: "Phân tích & dự báo", icon: TrendingUp, hrefs: ["/forecast"] },
      { label: "Kho dữ liệu", icon: Warehouse, hrefs: ["/data-warehouse"] },
    ],
    name: "Điều hành",
    key: "dh",
    icon: Gauge,
    tagline: "Thông tin điều hành dành cho Ban lãnh đạo Viện",
    searchHint: "Tìm chỉ số, báo cáo...",
    groups: [
      {
        label: "Điều hành",
        items: [
          { href: "/executive", label: "Bảng điều hành", icon: Gauge },
          { href: "/forecast", label: "Phân tích & dự báo", icon: TrendingUp },
          { href: "/data-warehouse", label: "Kho dữ liệu", icon: Warehouse },
        ],
      },
    ],
  },
  {
    code: "M1",
    home: "/admin",
    shell: "console",
    name: "Quản trị hệ thống",
    key: "m1",
    icon: Boxes,
    tagline: "Nền tảng dùng chung: tài khoản, danh mục, tích hợp, vận hành",
    searchHint: "Tìm danh mục, khóa API, sự cố...",
    groups: [
      {
        label: "Tổng quan",
        items: [{ href: "/admin", label: "Bảng quản trị", icon: Gauge }],
      },
      {
        label: "Tài khoản & bảo mật",
        items: [
          { href: "/security", label: "An toàn thông tin", icon: ShieldAlert },
          { href: "/access-control", label: "Phân quyền", icon: KeyRound },
        ],
      },
      {
        label: "Dữ liệu dùng chung & tích hợp",
        items: [
          { href: "/master-data", label: "Danh mục dùng chung", icon: Database },
          { href: "/integration", label: "Tích hợp & API (LGSP/NDXP)", icon: Network },
        ],
      },
      {
        label: "Vận hành hệ thống",
        items: [
          { href: "/system", label: "Giám sát & sao lưu", icon: HeartPulse },
          { href: "/change-log", label: "Nhật ký thay đổi", icon: History },
          { href: "/system-incidents", label: "Sự cố hệ thống", icon: ServerCrash },
          { href: "/software-validation", label: "Xác nhận phần mềm", icon: BadgeCheck },
          { href: "/settings", label: "Cấu hình", icon: Settings },
        ],
      },
    ],
  },
  {
    code: "M2",
    home: "/lims",
    name: "Phòng thí nghiệm (LIMS)",
    key: "m2",
    icon: FlaskConical,
    tagline: "Phòng phân tích Đất, nước, phân bón và môi trường · Mã VILAS 1501",
    searchHint: "Tìm mẫu, khách hàng, mã chỉ tiêu...",
    shell: "topnav",
    groups: [
      {
        label: "Trang chủ",
        link: true,
        items: [
          { href: "/lims", label: "Trang chủ", icon: LayoutDashboard },
          { href: "/work-schedule", label: "Lịch công tác", icon: CalendarDays },
        ],
      },
      { label: "Khách hàng", link: true, items: [{ href: "/customers", label: "Khách hàng", icon: Users2 }] },
      { label: "Đơn hàng", link: true, items: [{ href: "/orders", label: "Đơn hàng", icon: ClipboardList }] },
      { label: "Kết quả", link: true, items: [{ href: "/results", label: "Kết quả", icon: ClipboardEdit }] },
      {
        label: "Yêu cầu",
        items: [
          { href: "/requests", label: "Danh sách yêu cầu", icon: ClipboardList },
          { href: "/scan-receive", label: "Quét mã yêu cầu", icon: QrCode },
        ],
      },
      {
        label: "Thống kê",
        items: [
          { href: "/lab-stats/ngay-quan-trac", label: "Ngày quan trắc", icon: BarChart3 },
          { href: "/lab-stats/so-nhan-mau", label: "Ngày nhận mẫu", icon: BookOpen },
          { href: "/lab-stats/thau-phu", label: "Thông số thầu phụ", icon: BarChart3 },
          { href: "/lab-stats/dinh-muc", label: "Bảng định mức", icon: BarChart3 },
          { href: "/lab-stats/cong-no", label: "Công nợ", icon: BarChart3 },
          { href: "/lab-stats/so-phieu", label: "Tổng hợp số phiếu", icon: FileText },
        ],
      },
      {
        label: "Quản lý",
        items: [
          { href: "/instrument-manage", label: "Thiết bị", icon: Wrench },
          { href: "/chemical-manage", label: "Hóa chất", icon: Beaker },
          { href: "/van-bans", label: "Hồ sơ", icon: FileStack },
          { href: "/method-lookup", label: "Tra cứu tài liệu phương pháp phân tích", icon: Award },
          { href: "/batch-sign", label: "Ký duyệt", icon: FileSignature },
        ],
      },
      { label: "Mẻ thử nghiệm", link: true, items: [{ href: "/test-batches", label: "Mẻ thử nghiệm", icon: Boxes }] },
      {
        label: "Cài đặt",
        link: true,
        items: [
          { href: "/lab-settings", label: "Cài đặt", icon: Settings },
          { href: "/sample-types", label: "Loại mẫu", icon: Layers },
          { href: "/lab-methods", label: "Phương pháp phân tích", icon: Settings },
          { href: "/analyte-groups", label: "Nhóm chỉ tiêu", icon: Settings },
          { href: "/instrument-types", label: "Loại thiết bị", icon: Settings },
          { href: "/manufacturers", label: "Nhà sản xuất", icon: Settings },
          { href: "/lab-analytes", label: "Chỉ tiêu phân tích", icon: ListChecks },
          { href: "/specifications", label: "Quy chuẩn", icon: Scale },
          { href: "/price-lists", label: "Bảng giá", icon: Settings },
          { href: "/norm-lists", label: "Bảng định mức", icon: Settings },
          { href: "/bulk-templates", label: "Template bóc tách", icon: Settings },
          { href: "/batch-templates", label: "Template mẻ thử nghiệm", icon: Settings },
          { href: "/subcontractors", label: "Thầu phụ", icon: Settings },
          { href: "/container-types", label: "Dụng cụ lấy mẫu", icon: Settings },
          { href: "/preservations", label: "Bảo quản", icon: Settings },
          { href: "/mtld-groups", label: "Nhóm chỉ tiêu MTLĐ", icon: Settings },
          { href: "/sampling-containers", label: "Nhóm dụng cụ lấy mẫu", icon: Settings },
          { href: "/lab-products", label: "Nhóm dụng cụ phân tích", icon: Settings },
          { href: "/departments", label: "Phòng ban/Chi nhánh", icon: Settings },
          { href: "/lab-formulas", label: "Công thức", icon: Settings },
          { href: "/event-types", label: "Loại kế hoạch", icon: Settings },
          { href: "/industries", label: "Ngành công nghiệp", icon: Settings },
          { href: "/calibration-units", label: "Đơn vị hiệu chuẩn", icon: Settings },
          { href: "/request-priorities", label: "Mức ưu tiên của yêu cầu", icon: Settings },
          { href: "/lab-infos", label: "Thông tin công ty", icon: Settings },
          { href: "/standards", label: "Quy chuẩn", icon: Settings },
          { href: "/test-records", label: "Biên bản thử nghiệm", icon: Settings },
          { href: "/equipment", label: "Mã thiết bị", icon: Settings },
          { href: "/chemicals", label: "Hoá chất", icon: Settings },
          { href: "/analyte-mappings", label: "Chỉ tiêu phụ", icon: Settings },
        ],
      },
      {
        label: "ISO",
        items: [
          { href: "/iso17025", label: "Tổng quan ISO 17025", icon: ListChecks },
          { href: "/lab-dashboard", label: "Bảng điều khiển phòng thí nghiệm", icon: LayoutDashboard },
          { href: "/statistics", label: "Thống kê chung", icon: BarChart3 },
          { href: "/result-entry", label: "Nhập kết quả (phiếu diễn biến phân tích)", icon: ClipboardEdit },
          { href: "/reports", label: "Phiếu kết quả thử nghiệm", icon: FileText },
          { href: "/assignments", label: "Phân công công việc", icon: UserCog },
          { href: "/analysis", label: "Quy trình phân tích", icon: FlaskConical },
          { href: "/notebook", label: "Sổ tay thí nghiệm", icon: NotebookPen },
          { href: "/samples", label: "Tiếp nhận mẫu", icon: ClipboardList },
          { href: "/test-requests", label: "Phiếu yêu cầu thử nghiệm", icon: FileSignature },
          { href: "/campaigns", label: "Quan trắc theo đợt", icon: Telescope },
          { href: "/field", label: "Lấy mẫu hiện trường", icon: Smartphone },
          { href: "/archive", label: "Sổ theo dõi mẫu lưu", icon: Archive },
          { href: "/lab-stats/so-giao-mau", label: "Sổ giao mẫu", icon: BookOpen },
          { href: "/tools", label: "Dụng cụ – Vật tư", icon: TestTube },
          { href: "/environment", label: "Theo dõi điều kiện môi trường", icon: Thermometer },
          { href: "/personnel", label: "Nhân sự", icon: Users },
          { href: "/iso-equipment", label: "Hồ sơ thiết bị (sử dụng, bảo trì, kiểm tra)", icon: Wrench },
          { href: "/iso-chemicals", label: "Hồ sơ hóa chất, chất chuẩn", icon: Beaker },
          { href: "/documents", label: "Kiểm soát tài liệu", icon: FileStack },
          { href: "/accreditation", label: "Phạm vi công nhận VILAS", icon: Award },
          { href: "/authorizations", label: "Ủy quyền phép thử", icon: UserCheck },
          { href: "/commitments", label: "Cam kết khách quan & bảo mật", icon: ShieldHalf },
          { href: "/suppliers", label: "Nhà cung cấp", icon: Truck },
          { href: "/feedback", label: "Ý kiến & khiếu nại", icon: MessageSquare },
          { href: "/nonconformities", label: "Không phù hợp & CAPA", icon: OctagonAlert },
          { href: "/internal-audits", label: "Đánh giá nội bộ", icon: SearchCheck },
          { href: "/management-reviews", label: "Xem xét của lãnh đạo", icon: Presentation },
          { href: "/release-rules", label: "Quy tắc kiểm soát phát hành", icon: ShieldBan },
          { href: "/method-validations", label: "Xác nhận phương pháp", icon: FlaskRound },
          { href: "/calculation-methods", label: "Công thức tính & ĐKĐBĐ", icon: Calculator },
          { href: "/calibration-curves", label: "Đường chuẩn", icon: LineChart },
          { href: "/qc", label: "QC Levey-Jennings", icon: ShieldCheck },
          { href: "/risks", label: "Đăng ký rủi ro", icon: AlertOctagon },
          { href: "/decision-rules", label: "Quy tắc quyết định", icon: Scale },
        ],
      },
    ],
  },
  {
    code: "M3.1",
    home: "/tissue-bench",
    shell: "bench",
    tabs: [
      { label: "Bàn cấy", icon: ArrowRightLeft, hrefs: ["/tissue-bench", "/culture-batches"], mobile: true },
      { label: "Dây chuyền", icon: LayoutDashboard, hrefs: ["/tissue-overview", "/tissue-stats"], mobile: true },
      { label: "Kế hoạch", icon: CalendarDays, hrefs: ["/production-schedule", "/seedling-orders", "/production-profiles"], mobile: true },
      { label: "Phòng nuôi", icon: Thermometer, hrefs: ["/growth-rooms"] },
      { label: "Vườn ươm & xuất", icon: Sprout, hrefs: ["/seedling-lots", "/lot-sales", "/lot-feedback"], mobile: true },
    ],
    name: "Nuôi cấy mô & truy xuất",
    key: "m3-1",
    icon: Microscope,
    tagline: "Nhân giống in vitro & truy xuất nguồn gốc cây giống",
    searchHint: "Tìm mẻ cấy, cây mẹ, lô cây giống...",
    groups: [
      {
        label: "Tổng quan",
        items: [
          { href: "/tissue-overview", label: "Dây chuyền nuôi cấy", icon: LayoutDashboard },
          { href: "/tissue-bench", label: "Bàn cấy", icon: ArrowRightLeft },
          { href: "/production-schedule", label: "Lịch sản xuất", icon: CalendarDays },
          { href: "/tissue-stats", label: "Thống kê tỷ lệ nhiễm", icon: BarChart3 },
        ],
      },
      {
        label: "Nguồn giống & vật liệu",
        items: [
          { href: "/mother-plants", label: "Cây mẹ & nguồn giống", icon: TreeDeciduous },
          { href: "/tissue-materials", label: "Vật liệu khởi đầu", icon: Leaf },
        ],
      },
      {
        label: "Môi trường nuôi cấy",
        items: [
          { href: "/media-recipes", label: "Công thức & định mức", icon: FlaskConicalOff },
          { href: "/media-batches", label: "Lô môi trường", icon: Beaker },
        ],
      },
      {
        label: "Nuôi cấy",
        items: [
          { href: "/culture-batches", label: "Mẻ cấy & cấy chuyển", icon: Boxes },
          { href: "/growth-rooms", label: "Tủ cấy & phòng nuôi", icon: Thermometer },
        ],
      },
      {
        label: "Kế hoạch & điều độ",
        items: [
          { href: "/seedling-orders", label: "Đơn hàng cây giống", icon: ClipboardList },
          { href: "/production-profiles", label: "Thông số sản xuất", icon: Settings },
        ],
      },
      {
        label: "Vườn ươm, xuất bán & truy xuất",
        items: [
          { href: "/seedling-lots", label: "Lô cây giống & vườn ươm", icon: QrCode },
          { href: "/lot-sales", label: "Xuất bán", icon: Truck },
          { href: "/lot-feedback", label: "Phản hồi khách hàng", icon: MessageSquare },
        ],
      },
      {
        label: "Kho & báo cáo",
        items: [
          { href: "/tissue-supplies", label: "Kho vật tư", icon: Package },
          { href: "/tissue-reports", label: "Báo cáo cây giống", icon: PieChart },
        ],
      },
    ],
  },
  {
    code: "M3.2",
    home: "/varieties",
    shell: "hub",
    tabs: [
      { label: "Giống", icon: Sprout, hrefs: ["/varieties", "/breed-overview", "/germplasm"] },
      { label: "Nguồn gốc & chọn lọc", icon: GitBranch, hrefs: ["/source-stocks", "/pedigree", "/individuals"] },
      { label: "Khảo nghiệm & chất lượng", icon: ClipboardCheck, hrefs: ["/breed-trials", "/breed-standards", "/seed-lots"] },
      { label: "Sản xuất & cung ứng", icon: Tractor, hrefs: ["/seed-workbench", "/breed-production", "/breed-supply", "/breed-orders"] },
      { label: "Di truyền", icon: Dna, hrefs: ["/genotypes", "/markers", "/blast"] },
      { label: "Bản đồ & thị trường", icon: MapPinned, hrefs: ["/breed-facilities", "/breed-distributions", "/market-posts"] },
    ],
    name: "Giống cây trồng, vật nuôi, thủy sản",
    key: "m3-2",
    icon: Sprout,
    tagline: "Lý lịch giống, nguồn gen & sản xuất giống",
    searchHint: "Tìm giống, nguồn gen, khảo nghiệm...",
    groups: [
      {
        label: "Tổng quan",
        items: [
          { href: "/breed-overview", label: "Tổng quan", icon: LayoutDashboard },
          { href: "/seed-workbench", label: "Bàn sản xuất giống", icon: Workflow },
        ],
      },
      {
        label: "Danh mục & hồ sơ giống",
        items: [
          { href: "/varieties", label: "Danh mục giống", icon: Sprout },
          { href: "/germplasm", label: "Nguồn gen", icon: Dna },
        ],
      },
      {
        label: "Nguồn giống gốc",
        items: [
          { href: "/source-stocks", label: "Cây đầu dòng, đàn giống", icon: TreePine },
          { href: "/pedigree", label: "Cây phả hệ & ghép phối", icon: Network },
          { href: "/individuals", label: "Phả hệ & chọn lọc", icon: GitBranch },
        ],
      },
      {
        label: "Khảo nghiệm – kiểm định – chứng nhận",
        items: [
          { href: "/breed-standards", label: "Bộ chỉ tiêu", icon: ListChecks },
          { href: "/breed-trials", label: "Khảo nghiệm", icon: ClipboardCheck },
          { href: "/seed-lots", label: "Lô giống & chứng nhận", icon: ShieldCheck },
        ],
      },
      {
        label: "Di truyền phân tử",
        items: [
          { href: "/markers", label: "Chỉ thị phân tử", icon: Dna },
          { href: "/genotypes", label: "Mẫu ADN & kiểu gen", icon: ScanSearch },
          { href: "/blast", label: "Đối soát trình tự (BLAST+)", icon: SearchCode },
        ],
      },
      {
        label: "Sản xuất & cung ứng",
        items: [
          { href: "/breed-production", label: "Sản xuất theo cấp", icon: Tractor },
          { href: "/breed-supply", label: "Nhu cầu & cân đối", icon: Scale },
          { href: "/breed-orders", label: "Đơn hàng & giao nhận", icon: Truck },
        ],
      },
      {
        label: "Bản đồ số & thị trường",
        items: [
          { href: "/breed-facilities", label: "Bản đồ cơ sở sản xuất", icon: MapPinned },
          { href: "/breed-distributions", label: "Phân bố giống & chỉ tiêu", icon: MapIcon },
          { href: "/market-posts", label: "Thị trường & dịch vụ kỹ thuật", icon: Newspaper },
        ],
      },
    ],
  },
];

/** Tất cả mục menu (dùng cho tìm kiếm / kiểm thử). */
export const navGroups: NavGroup[] = [{ label: "Tổng quan", items: navHome }, ...navModules.flatMap((m) => m.groups)];

export const isActiveHref = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

/** Phân hệ chứa trang hiện tại (theo menu); trang in / hồ sơ mẫu thuộc M2. */
export function moduleOf(pathname: string): NavModule | undefined {
  const byMenu = navModules.find((m) => m.groups.some((g) => g.items.some((i) => isActiveHref(i.href, pathname))));
  if (byMenu) return byMenu;
  if (/^\/(sample-labels|report-print|order-print|batch-print|verify|lab-account)(\/|$)/.test(pathname)) return navModules.find((m) => m.code === "M2");
  return undefined;
}

/** Khung điều hướng của phần mềm (mặc định menu dọc). */
export const shellOf = (m: NavModule | undefined): ModuleShell | null => (m ? (m.shell ?? "sidebar") : null);

const allItems = (m: NavModule) => m.groups.flatMap((g) => g.items);

/** Các tab chính kèm trang con (lấy nhãn, biểu tượng từ `groups`). */
export function tabsOf(m: NavModule) {
  const byHref = new Map(allItems(m).map((i) => [i.href, i]));
  return (m.tabs ?? []).map((t) => ({ ...t, items: t.hrefs.map((h) => byHref.get(h)).filter((i): i is NavItem => Boolean(i)) }));
}

/** Nhóm "Danh mục": các trang không thuộc tab chính nào. */
export function catalogOf(m: NavModule): NavGroup[] {
  const inTabs = new Set((m.tabs ?? []).flatMap((t) => t.hrefs));
  return m.groups.map((g) => ({ ...g, items: g.items.filter((i) => !inTabs.has(i.href)) })).filter((g) => g.items.length);
}

export function SidebarBrand() {
  return (
    <div className="min-h-16 py-2 flex items-center gap-2.5 px-3 border-b border-sidebar-border">
      <div className="w-9 h-9 rounded-full bg-white ring-1 ring-white/40 flex items-center justify-center shrink-0 overflow-hidden">
        <Image
          src="/logo-vnnth.png"
          alt="Viện Nông nghiệp tỉnh Thanh Hóa"
          width={36}
          height={36}
          className="w-9 h-9 object-contain"
          priority
        />
      </div>
      <div className="leading-tight min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-white leading-snug">
          Nền tảng số Viện Nông nghiệp
        </div>
        <div className="text-[10.5px] text-sidebar-foreground/60 mt-0.5 leading-snug">
          tỉnh Thanh Hóa
        </div>
      </div>
    </div>
  );
}

export function SidebarFooter() {
  return (
    <div className="p-3 border-t border-sidebar-border">
      <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-sidebar-accent/40">
        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-white text-xs font-semibold">
          NL
        </div>
        <div className="leading-tight text-xs min-w-0">
          <div className="text-white font-medium truncate">
            Nguyễn Đình Lương
          </div>
          <div className="text-sidebar-foreground/60 truncate">
            Trưởng phòng PTN
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const current = moduleOf(pathname);
  const groups = useVisibleGroups(current?.groups ?? []);
  const item = (it: NavItem) => {
    const active = isActiveHref(it.href, pathname);
    const Icon = it.icon;
    return (
      <li key={it.href}>
        <Link
          href={it.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{it.label}</span>
        </Link>
      </li>
    );
  };
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2.5 py-2 mb-3 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <span>Về trang chủ – các phần mềm</span>
      </Link>
      {current && (
        <>
          <div className="flex items-center gap-2 px-2 pb-3 mb-1 border-b border-sidebar-border">
            <span className="w-9 h-9 rounded-lg bg-sidebar-accent text-white flex items-center justify-center shrink-0 shadow-sm">
              <current.icon className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0 leading-tight">
              <span className="block text-[10px] font-bold font-mono text-sidebar-foreground/60">{current.code}</span>
              <span className="block text-[13px] font-semibold text-white">{current.name}</span>
            </span>
          </div>
          {groups.map((group) => (
            <div key={group.label} className="mt-3 mb-3 pl-1">
              <div className="px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{group.label}</div>
              <ul className="space-y-0.5">{group.items.map(item)}</ul>
            </div>
          ))}
        </>
      )}
    </nav>
  );
}
