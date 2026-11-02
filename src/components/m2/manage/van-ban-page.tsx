import { LabPage } from "@/components/m2/lab-ui/page";
import { VanBanForm } from "@/components/m2/manage/van-ban-form";
import type { VanBan } from "@/lib/modules/m2/data/manage";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { currentAccess } from "@/lib/platform/data/access";

/** Trang thêm / sửa hồ sơ (văn bản). */
export async function VanBanPage({ doc }: { doc?: VanBan }) {
  const [staff, access] = await Promise.all([staffStore.list(), currentAccess()]);
  return (
    <LabPage title={doc ? `Hồ sơ ${doc.number}` : "Tạo mới"} subtitle={<span className="text-lg text-[#333]">Thông tin hồ sơ</span>}>
      <VanBanForm
        id={doc?.id}
        initial={{ number: doc?.number ?? "", issuedAt: doc?.issuedAt?.slice(0, 10) ?? "", issuer: doc?.issuer ?? "", summary: doc?.summary ?? "", note: doc?.note ?? "", assignees: doc?.assignees ?? [], active: doc?.active ?? true }}
        fileName={doc?.fileName ?? ""}
        staff={staff.map((s) => s.fullName).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"))}
        canWrite={access.can("write.lab")}
      />
    </LabPage>
  );
}
