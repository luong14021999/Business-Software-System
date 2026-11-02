"use client";

import { useState } from "react";
import { btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Khung "Tần suất quan trắc" cuối danh sách khách hàng: chọn khoảng ngày (và khách hàng) rồi xuất Excel. */
export function ScheduleExport({ customers }: { customers: { value: string; label: string }[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customerId, setCustomerId] = useState("");
  function go() {
    if (!from || !to || to < from) return toast.error("Chọn khoảng ngày hợp lệ");
    window.location.href = `/api/customer-schedules/export?${new URLSearchParams({ from, to, ...(customerId ? { customerId } : {}) })}`;
  }
  return (
    <section className="mt-10">
      <hr className="mb-5 border-[#eee]" />
      <h2 className="mb-3 text-[30px] font-medium leading-tight text-[#333]">Tần suất quan trắc</h2>
      <div className="grid items-center gap-3 sm:grid-cols-[80px_160px_70px_160px_110px_255px_auto]">
        <span className="text-sm font-bold sm:text-center">Từ ngày:</span>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Từ ngày" className={input} />
        <span className="text-sm font-bold sm:text-center">đến:</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Đến ngày" className={input} />
        <span className="text-sm font-bold sm:text-center">Khách hàng</span>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} aria-label="Khách hàng" className={input}>
          <option value="" />
          {customers.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button type="button" onClick={go} className={`${btnPrimary} justify-self-start`}>Xuất Excel</button>
      </div>
    </section>
  );
}
