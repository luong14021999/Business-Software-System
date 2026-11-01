"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { btnPrimary } from "@/components/m2/lab-ui/page";
import { fmtDateTimeVN } from "@/lib/platform/dates";

type Post = { id: string; author: string; body: string; createdAt: string };

/** Bảng tin nội bộ: ô đăng tin + danh sách tin (người đăng xóa được tin của mình). */
export function PostBox({ posts, me, canPost, isAdmin }: { posts: Post[]; me: string; canPost: boolean; isAdmin: boolean }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();

  async function post() {
    if (!text.trim()) return;
    setBusy(true);
    const res = await fetch("/api/lab-posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không đăng được tin", b.error ?? `HTTP ${res.status}`);
    setText("");
    start(() => router.refresh());
  }
  async function remove(id: string) {
    const res = await fetch(`/api/lab-posts/${id}`, { method: "DELETE" });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không xóa được tin", b.error ?? `HTTP ${res.status}`);
    start(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      {canPost && (
        <div className="flex gap-1">
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={3} placeholder="Đăng tin của bạn ở đây." className="min-h-[86px] flex-1 rounded border border-[#ccc] px-3 py-2 text-sm focus:border-[#66afe9] focus:outline-none" />
          <button type="button" onClick={post} disabled={busy || !text.trim()} className={`${btnPrimary} h-auto self-start px-4 py-2 text-base`}>Đăng</button>
        </div>
      )}
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có tin nào.</p>
      ) : (
        <ul className="divide-y divide-[#d6e9c6] rounded border border-[#d6e9c6] bg-[#dff0d8]/60">
          {posts.map((p) => (
            <li key={p.id} className="group flex items-start gap-2 px-5 py-3 text-[15px]">
              <p className="min-w-0 flex-1 whitespace-pre-line break-words">
                <b>{p.author}:</b> {p.body} <span className="text-muted-foreground">({fmtDateTimeVN(p.createdAt)})</span>
              </p>
              {(p.author === me || isAdmin) && (
                <button type="button" onClick={() => remove(p.id)} aria-label="Xóa tin" className="text-muted-foreground opacity-0 hover:text-[#a94442] focus:opacity-100 group-hover:opacity-100"><X className="h-4 w-4" /></button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
