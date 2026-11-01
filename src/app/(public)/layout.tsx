import Link from "next/link";
import { labInfo } from "@/lib/modules/m2/accreditation";
import { DongSonDrum } from "@/components/brand/dong-son-drum";
import { GovFooter, GovGoldRule, GovIdentity } from "@/components/brand/gov-identity";

const LINKS = [
  { href: "/portal", label: "Trang chủ", short: "Trang chủ" },
  { href: "/trace", label: "Truy xuất nguồn gốc", short: "Truy xuất" },
  { href: "/portal/giong", label: "Giống", short: "Giống" },
];

/** Cổng công khai theo phong cách cổng thông tin cơ quan nhà nước: không cần đăng nhập. */
export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/30">
      <header className="text-white shadow-md">
        <div className="gov-banner relative overflow-hidden">
          <DongSonDrum className="pointer-events-none absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 text-[hsl(var(--gov-gold-light))] opacity-[0.16]" />
          <div className="relative mx-auto flex h-20 max-w-6xl items-center px-4 sm:h-24">
            <Link href="/portal" className="min-w-0">
              <GovIdentity subtitle="Cổng thông tin dịch vụ" />
            </Link>
          </div>
        </div>
        <GovGoldRule />
        <nav className="bg-[hsl(var(--gov-main-dark))]">
          <div className="mx-auto flex max-w-6xl gap-0.5 overflow-x-auto px-2 text-xs font-semibold uppercase tracking-wide sm:px-4 sm:text-[13px]">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-white/90 hover:border-[hsl(var(--gov-gold-light))] hover:bg-white/10 hover:text-white">
                <span className="hidden md:inline">{l.label}</span>
                <span className="md:hidden">{l.short}</span>
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">{children}</main>
      <GovFooter email={labInfo.email} />
    </div>
  );
}
