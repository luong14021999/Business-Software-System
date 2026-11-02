"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { btnPrimary, input, link } from "@/components/m2/lab-ui/page";
import { MfaPanel } from "@/components/platform/mfa-panel";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/platform/auth/client";

/** Thông tin tài khoản như XaLab: email, đổi mật khẩu, vai trò, ứng dụng Authenticator (xác thực 2 lớp). */
export function AccountPanel({ email, roles }: { email: string; roles: string[] }) {
  const [pw, setPw] = useState<{ current: string; next: string; again: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState<boolean | null>(null);
  const [showMfa, setShowMfa] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/mfa/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => alive && setMfa(Boolean(s?.enabled)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [showMfa]);

  async function changePassword() {
    if (!pw) return;
    if (pw.next.length < 8) return toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
    if (pw.next !== pw.again) return toast.error("Nhập lại mật khẩu mới chưa khớp");
    setBusy(true);
    const { error } = await authClient.changePassword({ currentPassword: pw.current, newPassword: pw.next, revokeOtherSessions: true });
    setBusy(false);
    if (error) return toast.error("Không đổi được mật khẩu", error.message ?? "Mật khẩu hiện tại không đúng");
    toast.success("Đã đổi mật khẩu");
    setPw(null);
  }

  const row = "grid grid-cols-[11rem_minmax(0,1fr)] gap-x-5 text-sm";
  const label = "text-right font-bold";
  return (
    <div className="space-y-1">
      <div className={row}><span className={label}>Email:</span><span>{email}</span></div>
      <div className={row}>
        <span className={label}>Mật khẩu:</span>
        <span>[ <button type="button" onClick={() => setPw(pw ? null : { current: "", next: "", again: "" })} className={link}>Đổi mật khẩu</button> ]</span>
      </div>
      {pw && (
        <div className={row}>
          <span />
          <div className="my-2 max-w-sm space-y-2">
            <input type="password" autoComplete="current-password" placeholder="Mật khẩu hiện tại" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={input} />
            <input type="password" autoComplete="new-password" placeholder="Mật khẩu mới (ít nhất 8 ký tự)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={input} />
            <input type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} className={input} />
            <button type="button" disabled={busy} onClick={changePassword} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Lưu mật khẩu</button>
          </div>
        </div>
      )}
      <div className={row}><span className={label}>Vai trò:</span><span>{roles.length ? roles.join(", ") : "Chưa được phân vai trò"}</span></div>
      <div className={row}><span className={label}>Authenticator app:</span><span>{mfa === null ? "…" : mfa ? "Đã cấu hình" : "Chưa cấu hình"}</span></div>
      <div className={row}>
        <span />
        <div className="pt-1">
          {showMfa ? (
            <div className="max-w-md rounded border border-[#ddd] p-3"><MfaPanel mode="manage" /></div>
          ) : (
            <button type="button" onClick={() => setShowMfa(true)} className={btnPrimary}>{mfa ? "Quản lý Authenticator" : "Kích hoạt Authenticator"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
