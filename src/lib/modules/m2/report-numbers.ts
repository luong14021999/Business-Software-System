// Số phiếu kết quả cấp tự động: đánh số liên tục theo năm và loại số phiếu (VILAS / VIMCERTS / Nội bộ).

/** Số bắt đầu của lần cấp mới = số lớn nhất đã cấp (chưa xóa) + 1. */
export function nextReportStart(issued: { startNo: number; quantity: number }[]) {
  return issued.reduce((m, r) => Math.max(m, r.startNo + Math.max(1, r.quantity) - 1), 0) + 1;
}

/** Số phiếu ghi trên đơn: "12/2026" hoặc khoảng "12-14/2026". */
export function formatReportNo(start: number, quantity: number, year: number) {
  return `${quantity > 1 ? `${start}-${start + quantity - 1}` : start}/${year}`;
}
