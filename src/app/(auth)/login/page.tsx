import { Suspense } from "react";
import Image from "next/image";
import { FlaskConical, Microscope, Sprout, type LucideIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, getSessionSafe } from "@/lib/platform/auth/server";
import { DongSonDrum } from "@/components/brand/dong-son-drum";
import { GOV } from "@/components/brand/gov-identity";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Đăng nhập – Nền tảng số Viện Nông nghiệp tỉnh Thanh Hóa",
};

/** 3 phần mềm nghiệp vụ của nền tảng (M1 là lớp lõi, không hiện như một phần mềm) – màu đồng bộ với ô vuông ở trang chủ. */
const SOFTWARE: { code: string; name: string; desc: string; icon: LucideIcon }[] = [
  { code: "M2", name: "Phòng thí nghiệm (LIMS)", desc: "Phân tích đất, nước, phân bón – VILAS 1501", icon: FlaskConical },
  { code: "M3.1", name: "Nuôi cấy mô & truy xuất", desc: "Nhân giống in vitro, vườn ươm, mã QR nguồn gốc", icon: Microscope },
  { code: "M3.2", name: "Giống cây trồng, vật nuôi, thủy sản", desc: "Hồ sơ giống, khảo nghiệm, sản xuất theo cấp", icon: Sprout },
];
/** Ảnh ghép nền panel phải (cùng bộ ảnh với trang chủ). */
const PHOTOS = ["/modules/m2-phong-thi-nghiem.jpg", "/modules/m3-1-nuoi-cay-mo.jpg", "/modules/m3-2-giong.jpg"];

export default async function LoginPage() {
  // Đã đăng nhập → về trang chủ.
  if (auth) {
    const { data: session } = await getSessionSafe();
    if (session?.user) redirect("/");
  }

  return (
    <div className="min-h-[100dvh] flex">
      {/* LEFT: form panel */}
      <div className="flex-1 lg:max-w-[560px] flex flex-col justify-center px-6 sm:px-12 py-10 bg-background">
        <div className="w-full max-w-sm mx-auto">
          {/* Khối nhận diện cơ quan: chủ quản → đơn vị → hệ thống */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-4 ring-[hsl(var(--gov-gold))]">
              <Image src="/logo-vnnth.png" alt={GOV.unit} width={128} height={128} className="h-32 w-32 object-contain" priority />
            </div>
            <div className="leading-tight">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--gov-main))]">{GOV.parent}</div>
              <div className="gov-serif mt-1 whitespace-nowrap text-lg font-bold uppercase tracking-wide text-[hsl(var(--gov-main-dark))] sm:text-[1.3rem]">{GOV.unit}</div>
              <div className="mx-auto my-2 flex items-center justify-center gap-2" aria-hidden>
                <span className="h-px w-12 bg-[hsl(var(--gov-gold))]" />
                <span className="text-[hsl(var(--gov-gold))]">★</span>
                <span className="h-px w-12 bg-[hsl(var(--gov-gold))]" />
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-foreground/80">Nền tảng số</div>
            </div>
          </div>

          <h1 className="border-l-4 border-[hsl(var(--gov-main))] pl-3 text-xl font-bold uppercase tracking-wide text-foreground sm:text-2xl">
            Đăng nhập hệ thống
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <span className="text-primary font-medium">
              Liên hệ quản trị hệ thống để được cấp
            </span>
          </p>

          <div className="mt-8">
            <Suspense fallback={<div className="h-[280px]" />}>
              <LoginForm />
            </Suspense>
          </div>

          <div className="mt-10 pt-6 border-t border-border space-y-2 text-xs text-muted-foreground">
            <p className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[hsl(var(--gov-main))]" aria-hidden />Một tài khoản dùng cho tất cả phần mềm; quyền truy cập theo vai trò được giao.</p>
            <p className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[hsl(var(--gov-main))]" aria-hidden />Hỗ trợ xác thực 2 lớp; mọi thao tác được ghi nhật ký.</p>
            {/* Điện thoại: không có panel phải – liệt kê ngắn các phần mềm */}
            <div className="flex flex-wrap gap-1.5 pt-2 lg:hidden">
              {SOFTWARE.map((m) => (
                <span key={m.code} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">{m.code}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: ảnh hoạt động của Viện + 3 phần mềm nghiệp vụ (ẩn trên điện thoại) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[hsl(var(--gov-main-deep))]">
        <div className="absolute inset-0 grid grid-cols-3" aria-hidden>
          {PHOTOS.map((src) => (
            <div key={src} className="relative">
              <Image src={src} alt="" fill sizes="30vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gov-main)/0.93)] via-[hsl(var(--gov-main-dark)/0.9)] to-[hsl(var(--gov-main-deep)/0.96)]" aria-hidden />
        <DongSonDrum className="pointer-events-none absolute -right-40 top-1/2 h-[46rem] w-[46rem] -translate-y-1/2 text-[hsl(var(--gov-gold-light))] opacity-[0.13]" />
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[hsl(var(--gov-gold))] via-[hsl(var(--gov-gold-light))] to-[hsl(var(--gov-gold))]" aria-hidden />

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-20 py-12 text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--gov-gold-light))]">{GOV.parent}</div>
          <h2 className="gov-serif mt-2 text-3xl font-bold uppercase leading-tight xl:text-4xl">
            Nền tảng số
            <br />
            Viện Nông nghiệp Thanh Hóa
          </h2>
          <div className="mt-3 h-1 w-24 bg-[hsl(var(--gov-gold))]" aria-hidden />
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80">
            Hệ thống thống nhất phục vụ nghiên cứu, phân tích – thử nghiệm, nhân giống và chuyển giao khoa học công nghệ:
            dữ liệu dùng chung giữa các đơn vị, một lần đăng nhập.
          </p>

          <ul className="mt-8 grid max-w-xl gap-2.5">
            {SOFTWARE.map((m) => (
              <li key={m.code} className="flex items-center gap-3 rounded-sm border-l-[3px] border-[hsl(var(--gov-gold))] bg-white/[0.07] px-3 py-2.5">
                <span className="min-w-0 leading-tight">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="rounded bg-white/15 px-1.5 py-px font-mono text-[10px]">{m.code}</span>
                    {m.name}
                  </span>
                  <span className="block truncate text-xs text-white/70">{m.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute bottom-6 left-0 right-0 z-10 text-center text-[11px] text-white/55">
          Cơ quan chủ quản: {GOV.parent} · {GOV.unit} · {GOV.address} · ĐT {GOV.phone}
        </div>
      </div>
    </div>
  );
}
