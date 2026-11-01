import { LabPage } from "@/components/m2/lab-ui/page";
import { ScanReceive } from "@/components/m2/orders/scan-receive";

export const dynamic = "force-dynamic";

export default function ScanReceivePage() {
  return (
    <LabPage title="Quét mã yêu cầu" subtitle="Dùng máy quét mã vạch / QR trên tem mẫu hoặc gõ mã; chỉ mẫu đang đợi lấy mẫu / đã lấy mẫu mới được chuyển sang nhận mẫu">
      <ScanReceive />
    </LabPage>
  );
}
