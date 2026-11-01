import { TopBar } from "@/components/layout/topbar";
import { ModuleFrame } from "@/components/layout/module-frame";
import { ModuleScope } from "@/components/layout/module-scope";
import { currentAccess } from "@/lib/platform/data/access";

// Khung chính đọc quyền của người đang đăng nhập (cookie) → mọi trang bên trong đều dựng theo yêu cầu.
export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Lối vào khu Quản trị / Danh mục chỉ hiện với người có quyền (trang vẫn tự chặn theo quyền).
  const { can } = await currentAccess().catch(() => ({ can: () => false }));
  return (
    <ModuleScope className="flex flex-col h-[100dvh] w-full overflow-hidden bg-muted/30">
      <TopBar canAdmin={can("admin.view")} canCatalog={can("write.mdm")} />
      <ModuleFrame canAdmin={can("admin.view")}>{children}</ModuleFrame>
    </ModuleScope>
  );
}
