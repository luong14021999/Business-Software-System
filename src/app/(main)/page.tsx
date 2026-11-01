import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { FlaskConical, Gauge, Microscope, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { dbQuery } from "@/lib/platform/db";
import { currentAccess } from "@/lib/platform/data/access";
import { isConsoleOnly } from "@/lib/platform/permissions";
import { GovFooter } from "@/components/brand/gov-identity";
import { DongSonDrum } from "@/components/brand/dong-son-drum";
import { labInfo } from "@/lib/modules/m2/accreditation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nền tảng số – Viện Nông nghiệp tỉnh Thanh Hóa" };

type Mod = {
  code: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  /** Màu nền ô vuông (gradient Tailwind). */
  color: string;
  /** Ảnh nền ô vuông (trong /public); không có thì hiện biểu tượng. */
  image?: string;
  /** Vị trí cắt ảnh trong ô vuông (lớp Tailwind object-position), mặc định giữa. */
  imagePosition?: string;
  href?: string;
  status: "Đang vận hành" | "Đang xây dựng" | "Kế hoạch";
  stats?: { label: string; value: string | number }[];
};

/** Trang chủ: chọn phân hệ của nền tảng số Viện. */
export default async function PortalPage() {
  // Quản trị / Lãnh đạo Viện không dùng các phần mềm nghiệp vụ: vào thẳng bảng quản trị hệ thống.
  const { can, roles } = await currentAccess();
  if (isConsoleOnly(roles)) redirect("/admin");
  const [k] = await dbQuery(
    `select
       (select count(*)::int from analytics.fact_samples where first_issued_at is null) samples_open,
       (select count(*)::int from public.test_reports where status = 'Đã phát hành') reports,
       (select count(*)::int from public.customers) customers,
       (select count(*)::int from public.test_requests where status in ('Yêu cầu mới', 'Đã báo giá')) requests_open`,
  );
  // Bảng M3 nằm ở schema riêng (migration 0015) – chưa chạy migration thì ô vẫn hiện, chỉ thiếu số liệu.
  const [n] = await dbQuery(
    `select
       (select count(*)::int from m3_tissue.culture_batches where status = 'Đang nuôi') batches_growing,
       (select count(*)::int from m3_breed.varieties) varieties`,
  ).catch(() => [{ batches_growing: "—", varieties: "—" }]);
  // M1 (hạ tầng) không là ô ở trang chủ: quản trị vào bằng nút ⚙ trên thanh trên cùng.
  // Ô "Điều hành" chỉ hiện với Ban lãnh đạo Viện.
  const executive: Mod[] = can("view.executive")
    ? [
        {
          code: "ĐH",
          name: "Điều hành",
          desc: "Bảng thông tin điều hành dành cho Ban lãnh đạo Viện: chỉ số nghiệp vụ các phần mềm, xu hướng, phân tích và dự báo",
          icon: Gauge,
          color: "from-emerald-700 to-teal-900",
          href: "/executive",
          status: "Đang vận hành",
          stats: [{ label: "mẫu chưa trả kết quả", value: k.samples_open }],
        },
      ]
    : [];
  const modules: Mod[] = [
    ...executive,
    {
      code: "M2",
      name: "Phòng thí nghiệm (LIMS)",
      desc: "Phòng phân tích Đất, nước, phân bón và môi trường – VILAS 1501: tiếp nhận mẫu, phân tích, QA/QC, phiếu kết quả theo ISO/IEC 17025",
      icon: FlaskConical,
      color: "from-emerald-500 to-teal-700",
      image: "/modules/m2-phong-thi-nghiem.jpg",
      href: "/lims",
      status: "Đang vận hành",
      stats: [{ label: "mẫu chưa trả kết quả", value: k.samples_open }, { label: "phiếu đã phát hành", value: k.reports }],
    },
    {
      code: "M3.1",
      name: "Nuôi cấy mô & truy xuất nguồn gốc",
      desc: "Vật liệu khởi đầu, công thức môi trường, theo dõi mẻ cấy, nhiễm mẫu, ra ngôi, xuất bán và truy xuất nguồn gốc cây giống",
      icon: Microscope,
      color: "from-violet-500 to-purple-700",
      image: "/modules/m3-1-nuoi-cay-mo.jpg",
      // Ảnh ngang: dịch khung sang trái để giữ cả hai kỹ thuật viên.
      imagePosition: "object-[35%_50%]",
      href: "/tissue-bench",
      status: "Đang xây dựng",
      stats: [{ label: "mẻ cấy đang nuôi", value: n.batches_growing }],
    },
    {
      code: "M3.2",
      name: "Giống cây trồng, vật nuôi, thủy sản",
      desc: "Lý lịch giống, nguồn gen, khảo nghiệm, chỉ thị phân tử, BLAST+, sản xuất giống, bản đồ cơ sở giống",
      icon: Sprout,
      color: "from-lime-500 to-green-700",
      // Ảnh ghép 4 khung (lúa, cây giống, thủy sản, cây ăn quả): cắt giữa để thấy cả bốn.
      image: "/modules/m3-2-giong.jpg",
      href: "/varieties",
      status: "Đang xây dựng",
      stats: [{ label: "giống trong lý lịch", value: n.varieties }],
    },
  ];
  return (
    <>
      <main className="flex flex-1 flex-col overflow-y-auto scrollbar-thin">
        <div className="relative flex-1 p-4 sm:p-6">
        <DongSonDrum className="pointer-events-none absolute -right-24 -top-24 hidden h-[28rem] w-[28rem] text-[hsl(var(--gov-main))] opacity-[0.04] lg:block" />
        <div className="relative mb-5 flex flex-wrap items-end gap-3 border-b-2 border-[hsl(var(--gov-gold))] pb-2">
          <h1 className="border-l-4 border-[hsl(var(--gov-main))] pl-3 text-base font-bold uppercase tracking-wide text-[hsl(var(--gov-main-dark))] sm:text-lg">Hệ thống phần mềm nghiệp vụ</h1>
          <p className="text-xs text-muted-foreground sm:ml-auto">Chọn phần mềm để làm việc · dữ liệu dùng chung, một tài khoản đăng nhập</p>
        </div>
        <section className="relative grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 sm:gap-6">
          {modules.map((m) => {
            const body = (
              <>
                {m.image && (
                  <>
                    <Image src={m.image} alt="" fill sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 33vw, 50vw" className={`object-cover ${m.imagePosition ?? "object-center"} transition-transform duration-500 group-hover:scale-105`} />
                    {/* Lớp phủ: tối ở trên và dưới để chữ trắng luôn đọc được */}
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/75" />
                  </>
                )}
                <div className="relative flex items-start justify-between gap-2">
                  <span className="font-mono text-sm sm:text-base font-bold opacity-90">{m.code}</span>
                  <span className="text-[10px] sm:text-xs font-medium rounded-full bg-white/20 px-2 py-0.5 text-right">{m.href ? m.status : "Sắp ra mắt"}</span>
                </div>
                <div className="relative flex-1 flex items-center justify-center">
                  {!m.image && <m.icon className="w-14 h-14 sm:w-20 sm:h-20 transition-transform group-hover:scale-110" strokeWidth={1.5} />}
                </div>
                <div className="relative">
                  <div className="font-semibold text-sm sm:text-lg leading-tight">{m.name}</div>
                  {m.stats?.[0] && (
                    <div className="text-[11px] sm:text-xs opacity-80 mt-1">
                      <span className="font-semibold">{m.stats[0].value}</span> {m.stats[0].label}
                    </div>
                  )}
                </div>
              </>
            );
            const cls = `group relative overflow-hidden aspect-square rounded-2xl p-4 sm:p-5 flex flex-col text-white shadow-sm bg-gradient-to-br ${m.color}`;
            return m.href ? (
              <Link key={m.code} href={m.href} title={m.desc} className={`${cls} transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring`}>
                {body}
              </Link>
            ) : (
              <div key={m.code} title={m.desc} aria-disabled className={`${cls} opacity-50 grayscale-[40%] cursor-not-allowed`}>
                {body}
              </div>
            );
          })}
        </section>
        </div>
        <GovFooter email={labInfo.email} />
      </main>
    </>
  );
}
