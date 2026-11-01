import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin", "vietnamese"] });
/** Chữ có chân cho tên cơ quan (phong cách hành chính nhà nước). */
const govSerif = Noto_Serif({ subsets: ["latin", "vietnamese"], weight: ["700"], variable: "--font-gov-serif" });

export const viewport: Viewport = {
  themeColor: "#19703f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Nền tảng số Viện Nông nghiệp Thanh Hóa",
  description:
    "Nền tảng số dùng chung của Viện: phòng thí nghiệm (LIMS, VILAS 1501), nuôi cấy mô, giống cây trồng, vật nuôi, thủy sản – một tài khoản cho tất cả phân hệ",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-vnnth.png",
    apple: "/logo-vnnth.png",
    shortcut: "/logo-vnnth.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VNN Thanh Hóa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`h-full ${govSerif.variable}`}>
      <body className={`${inter.className} h-full antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
