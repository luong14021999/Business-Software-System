import { Search, ShieldCheck, QrCode, Award, FlaskConical, Sprout, Microscope } from "lucide-react";
import { GOV } from "@/components/brand/gov-identity";
import { accreditedTests, labInfo } from "@/lib/modules/m2/accreditation";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Cổng thông tin dịch vụ – Viện Nông nghiệp tỉnh Thanh Hóa",
  description: "Xác minh phiếu kết quả thử nghiệm, truy xuất nguồn gốc lô giống, năng lực phòng thử nghiệm và giống của Viện Nông nghiệp tỉnh Thanh Hóa",
};

const SERVICES = [
  { icon: FlaskConical, title: "Phân tích – thử nghiệm", text: "Đất, nước, phân bón, rau quả – phòng thử nghiệm đạt chuẩn ISO/IEC 17025, VILAS 1501" },
  { icon: Microscope, title: "Nuôi cấy mô – cây giống", text: "Nhân giống in vitro, cung ứng cây giống sạch bệnh có truy xuất nguồn gốc" },
  { icon: Sprout, title: "Giống cây trồng, vật nuôi, thủy sản", text: "Khảo nghiệm, sản xuất và cung ứng giống" },
];

function LookupBox({ icon: Icon, title, hint, action, placeholder }: { icon: typeof Search; title: string; hint: string; action: string; placeholder: string }) {
  return (
    <form action={action} method="get" className="rounded-xl border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 font-semibold"><Icon className="w-5 h-5 text-primary" />{title}</div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex gap-2 mt-auto">
        <input name="code" required maxLength={64} placeholder={placeholder} className="flex-1 min-w-0 h-9 rounded-md border border-input bg-background px-3 text-sm font-mono" />
        <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium">Tra cứu</button>
      </div>
    </form>
  );
}

export default function PortalPage() {
  const matrices = [...new Set(accreditedTests.map((t) => t.matrix))];

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-card border p-5 sm:p-8">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Cổng thông tin dịch vụ</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-3xl">
          Xác minh phiếu kết quả thử nghiệm và truy xuất nguồn gốc cây giống của Viện Nông nghiệp tỉnh Thanh Hóa.
        </p>
        <p className="text-sm mt-4">
          Liên hệ gửi mẫu, đặt mua cây giống, giống: {GOV.unit}, {GOV.address}, điện thoại{" "}
          <a href={`tel:${GOV.phone.replace(/\D/g, "")}`} className="font-semibold text-primary hover:underline">{GOV.phone}</a>.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LookupBox icon={ShieldCheck} title="Xác minh phiếu kết quả" hint="Nhập số phiếu in trên phiếu kết quả thử nghiệm, hoặc quét mã QR trên phiếu." action="/portal/verify" placeholder="Số phiếu" />
        <LookupBox icon={QrCode} title="Truy xuất nguồn gốc lô giống" hint="Nhập mã lô in trên tem, hoặc quét mã QR trên tem cây giống." action="/trace" placeholder="VD: LO-2026-001" />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Dịch vụ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-xl border bg-card p-4">
              <s.icon className="w-6 h-6 text-primary" />
              <div className="font-medium mt-2">{s.title}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="nang-luc">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Năng lực & phạm vi công nhận</h2>
        <p className="text-sm text-muted-foreground mb-3">
          {labInfo.accreditedName} – {labInfo.vilasCode} theo {labInfo.standard}, Quyết định {labInfo.decisionNo} ngày {fmtDateVN(labInfo.decisionDate)}, hiệu lực đến {fmtDateVN(labInfo.validTo)}.
        </p>
        <div className="space-y-2">
          {matrices.map((m) => {
            const tests = accreditedTests.filter((t) => t.matrix === m);
            return (
              <details key={m} className="rounded-lg border bg-card">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium flex items-center justify-between">
                  {m} <span className="text-xs text-muted-foreground font-normal">{tests.length} phép thử</span>
                </summary>
                <ul className="px-4 pb-3 divide-y text-xs">
                  {tests.map((t) => (
                    <li key={t.no} className="py-1.5 flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4">
                      <span>{t.name}</span>
                      <span className="text-muted-foreground font-mono whitespace-nowrap">{t.method}</span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </section>

    </div>
  );
}
