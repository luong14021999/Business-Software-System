import { LabPage } from "@/components/m2/lab-ui/page";
import { AccountPanel } from "@/components/m2/account/account-panel";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Thông tin tài khoản của người đang đăng nhập. */
export default async function LabAccountPage() {
  const access = await currentAccess();
  return (
    <LabPage title="Thông tin tài khoản." subtitle={<span className="text-lg text-[#333]">Thay đổi thông tin tài khoản</span>}>
      <AccountPanel email={access.actor?.email ?? ""} roles={access.roles} />
    </LabPage>
  );
}
