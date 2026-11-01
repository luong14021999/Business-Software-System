// Giới hạn tần suất API công khai theo IP đã băm (bảng public.public_hits).
import { dbQuery } from "@/lib/platform/db";

export const RATE_LIMITS = {
  /** Phản hồi khách mua cây giống qua trang QR (M3.1.6). */
  feedback: { perIp: 5, windowMinutes: 60, perDayTotal: 200 },
} as const;

/** Ghi 1 lượt và cho biết còn trong giới hạn không (đếm cả lượt vừa ghi). */
export async function withinPublicLimit(action: keyof typeof RATE_LIMITS, hash: string) {
  const lim = RATE_LIMITS[action];
  await dbQuery(`insert into public.public_hits (action, ip_hash) values ($1, $2)`, [action, hash]);
  // Dọn lượt cũ (thỉnh thoảng) để bảng không phình.
  if (Math.random() < 0.02) await dbQuery(`delete from public.public_hits where at < now() - interval '2 days'`);
  const [r] = await dbQuery(
    `select
       (select count(*)::int from public.public_hits where action = $1 and ip_hash = $2 and at > now() - make_interval(mins => $3)) per_ip,
       (select count(*)::int from public.public_hits where action = $1 and at > now() - interval '1 day') per_day`,
    [action, hash, lim.windowMinutes],
  );
  return Number(r.per_ip) <= lim.perIp && Number(r.per_day) <= lim.perDayTotal;
}
