import { LabPage, link, table } from "@/components/m2/lab-ui/page";
import { AccreditedTestsTable } from "@/components/m2/accreditation/accredited-tests-table";
import {
  accreditationNotes,
  accreditedTests,
  labInfo,
  type AccreditedMatrix,
} from "@/lib/modules/m2/accreditation";

export const metadata = { title: "Phạm vi công nhận VILAS 1501" };
// Tính "còn X ngày" hiệu lực theo ngày truy cập, không theo lúc build.
export const dynamic = "force-dynamic";

const fmtDate = (iso: string) => iso.split("-").reverse().join("/");

const countBy = (...m: AccreditedMatrix[]) =>
  accreditedTests.filter((t) => m.includes(t.matrix)).length;

const stats: { label: string; value: number }[] = [
  { label: "Đất", value: countBy("Đất") },
  { label: "Nước mặt, nước ngầm", value: countBy("Nước mặt, nước ngầm", "Nước mặt") },
  { label: "Phân bón", value: countBy("Phân bón") },
  { label: "Rau, quả", value: countBy("Rau, quả") },
];

function daysUntil(iso: string) {
  const ms = new Date(`${iso}T23:59:59+07:00`).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

/** Phạm vi công nhận VILAS theo kiểu XaLab: thông tin công nhận, liên hệ, số phép thử, danh mục phép thử, ghi chú. */
export default function AccreditationPage() {
  const daysLeft = daysUntil(labInfo.validTo);
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Số hiệu", value: `${labInfo.vilasCode} – ${labInfo.standard}` },
    { label: "Lĩnh vực", value: `${labInfo.field} / ${labInfo.fieldEn}` },
    { label: "Tên được công nhận", value: `${labInfo.accreditedName} – ${labInfo.organization}` },
    { label: "Quyết định công nhận", value: `Số ${labInfo.decisionNo} ngày ${fmtDate(labInfo.decisionDate)} – Văn phòng Công nhận chất lượng quốc gia (BoA)` },
    {
      label: "Hiệu lực công nhận",
      value: (
        <>
          {fmtDate(labInfo.validFrom)} → {fmtDate(labInfo.validTo)}{" "}
          <span className={daysLeft <= 180 ? "font-bold text-[#a94442]" : "text-[#777]"}>
            ({daysLeft > 0 ? `còn ${daysLeft.toLocaleString("vi-VN")} ngày` : "đã hết hiệu lực"})
          </span>
        </>
      ),
    },
    { label: "Người quản lý", value: labInfo.manager },
    { label: "Địa chỉ", value: labInfo.address },
    { label: "Điện thoại", value: <a href={`tel:${labInfo.phone.replace(/\./g, "")}`} className={link}>{labInfo.phone}</a> },
    { label: "Email", value: <a href={`mailto:${labInfo.email}`} className={link}>{labInfo.email}</a> },
    { label: "Website", value: <a href={labInfo.website} className={link}>{labInfo.website.replace(/^https?:\/\//, "")}</a> },
  ];

  return (
    <LabPage title="Phạm vi công nhận VILAS 1501" subtitle={<span className="text-lg text-[#333]">Danh mục {accreditedTests.length} phép thử được công nhận theo {labInfo.standard} – lĩnh vực {labInfo.field}</span>}>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 text-sm sm:grid-cols-[200px_1fr] sm:gap-x-[30px]">
            <span className="font-bold text-[#333] sm:text-right">{r.label}:</span>
            <span className="break-words">{r.value}</span>
          </div>
        ))}
      </div>

      <h3 className="mb-2 mt-8 text-xl text-[#333]">Số phép thử theo đối tượng</h3>
      <table className={`${table} max-w-xl`}>
        <thead><tr><th>Đối tượng thử</th><th className="text-right">Số phép thử</th></tr></thead>
        <tbody>
          {stats.map((s) => <tr key={s.label}><td>{s.label}</td><td className="text-right">{s.value}</td></tr>)}
          <tr className="font-bold"><td>Cộng</td><td className="text-right">{accreditedTests.length}</td></tr>
        </tbody>
      </table>

      <h3 className="mb-1 mt-8 text-xl text-[#333]">Danh mục phép thử được công nhận</h3>
      <p className="mb-3 text-sm text-[#777]">List of accredited tests – theo phụ lục AFL 01.12, lần ban hành 6.26</p>
      <AccreditedTestsTable />

      <h3 className="mb-2 mt-8 text-xl text-[#333]">Ghi chú</h3>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#555]">
        {accreditationNotes.map((n) => <li key={n}>{n}</li>)}
      </ul>
    </LabPage>
  );
}
