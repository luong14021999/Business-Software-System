import { LabPage } from "@/components/m2/lab-ui/page";
import { AccountPanel } from "@/components/platform/account-panel";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Thông tin tài khoản của người đang đăng nhập (mở từ trang chủ các phần mềm, không nằm trong phần mềm nào). */
export default async function AccountPage() {
  const access = await currentAccess();
  return (
    <main className="flex-1 overflow-y-auto bg-white">
      <LabPage title="Thông tin tài khoản" subtitle={<span className="text-lg text-[#333]">Thay đổi thông tin tài khoản</span>}>
        <AccountPanel email={access.actor?.email ?? ""} roles={access.roles} />
      </LabPage>
    </main>
  );
}
