import Link from "next/link";
import { AlertCircle, CalendarClock, ClipboardCheck } from "lucide-react";
import { HomeTabs } from "@/components/m2/home/home-tabs";
import { PostBox } from "@/components/m2/home/post-box";
import { btn, link } from "@/components/m2/lab-ui/page";
import { assignmentStore } from "@/lib/modules/m2/data/custody";
import { labPostStore, linesByOrder, orderStore, workScheduleStore } from "@/lib/modules/m2/data/orders";
import { addDays, overdueDays } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN, todayISO, vnDateOf } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/**
 * Trang chủ phòng thí nghiệm: bảng tin nội bộ, công việc cá nhân, công việc của đơn vị
 * (cảnh báo đơn hàng quá hạn, sự kiện sắp diễn ra, công việc hôm nay).
 */
export default async function LabHomePage({ searchParams }: { searchParams: Promise<{ tin?: string }> }) {
  const { tin } = await searchParams;
  const access = await currentAccess();
  const me = access.actor?.name ?? "";
  const today = todayISO();
  const [posts, orders, schedule, assignments, returned, waitQa, waitManager] = await Promise.all([
    labPostStore.list(),
    orderStore.list(),
    workScheduleStore.list(),
    assignmentStore.list(),
    me ? linesByOrder(["Trả lại sửa"], me) : Promise.resolve([]),
    access.can("results.qa") ? linesByOrder(["Chờ QA/QC"]) : Promise.resolve([]),
    access.can("results.approve") ? linesByOrder(["Chờ Trưởng phòng"]) : Promise.resolve([]),
  ]);

  const shownPosts = posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, tin === "all" ? 30 : 3);
  const overField = orders
    .filter((o) => (o.status === "Báo giá" || o.status === "Quan trắc") && overdueDays(vnDateOf(o.fieldAt), today) > 0)
    .map((o) => ({ ...o, late: overdueDays(vnDateOf(o.fieldAt), today) }))
    .sort((a, b) => a.late - b.late);
  const overDue = orders
    .filter((o) => (o.status === "Quan trắc" || o.status === "Phân tích") && overdueDays(vnDateOf(o.dueAt), today) > 0)
    .map((o) => ({ ...o, late: overdueDays(vnDateOf(o.dueAt), today) }))
    .sort((a, b) => a.late - b.late);
  const myAssignments = assignments.filter((a) => a.assignee === me && (a.status === "Đã giao" || a.status === "Đang làm"));
  const mySchedule = schedule.filter((w) => w.staffName === me && w.day >= today && w.day <= addDays(today, 6)).sort((a, b) => a.day.localeCompare(b.day));
  const upcoming = schedule.filter((w) => w.day > today && w.day <= addDays(today, 7)).sort((a, b) => a.day.localeCompare(b.day)).slice(0, 8);
  const todayWork = schedule.filter((w) => w.day === today).sort((a, b) => a.staffName.localeCompare(b.staffName));

  const h2 = "text-[26px] font-medium uppercase leading-tight text-[#333] sm:text-[30px]";
  const h3 = "flex items-center gap-2 text-lg font-medium uppercase text-[#333] sm:text-xl";
  const col = "min-w-0 space-y-4 p-4";
  return (
    <main className="flex-1 overflow-y-auto bg-white scrollbar-thin">
      <div className="mx-auto max-w-[1500px] px-4 pb-10 pt-5">
        <HomeTabs active="news" />
        <div className="mt-0 grid divide-y border border-[#ddd] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <section className={col} aria-labelledby="h-news">
            <h2 id="h-news" className={h2}>Bảng tin nội bộ</h2>
            <PostBox posts={shownPosts} me={me} canPost={access.can("write.any")} isAdmin={access.roles.includes("Quản trị")} />
            {posts.length > 3 && (
              <Link href={tin === "all" ? "/lims" : "/lims?tin=all"} className={`${btn} w-full justify-center`}>{tin === "all" ? "Thu gọn" : "Xem thêm"}</Link>
            )}
          </section>

          <section className={col} aria-labelledby="h-me">
            <h2 id="h-me" className={h2}>Công việc cá nhân</h2>
            {!myAssignments.length && !returned.length && !waitQa.length && !waitManager.length && !mySchedule.length && (
              <p className="text-sm text-muted-foreground">Không có việc nào đang chờ bạn.</p>
            )}
            {returned.length > 0 && (
              <Block title="Kết quả bị trả lại cần sửa" tone="danger">
                {returned.map((o) => <li key={o.id}>Đơn hàng <Link href={`/orders/${o.id}/results`} className={link}>{o.code}</Link> – {o.n} chỉ tiêu</li>)}
              </Block>
            )}
            {waitQa.length > 0 && (
              <Block title="Chờ QA/QC duyệt">
                {waitQa.map((o) => <li key={o.id}>Đơn hàng <Link href={`/orders/${o.id}/results`} className={link}>{o.code}</Link> – {o.n} chỉ tiêu</li>)}
              </Block>
            )}
            {waitManager.length > 0 && (
              <Block title="Chờ Trưởng phòng phê duyệt">
                {waitManager.map((o) => <li key={o.id}>Đơn hàng <Link href={`/orders/${o.id}/results`} className={link}>{o.code}</Link> – {o.n} chỉ tiêu</li>)}
              </Block>
            )}
            {myAssignments.length > 0 && (
              <Block title={`Chỉ tiêu được phân công (${myAssignments.length})`}>
                {myAssignments.slice(0, 6).map((a) => <li key={a.id}>{a.sampleCode} · {a.testLabel.split(" · ")[0]}{a.dueAt && <> – hạn {fmtDateVN(a.dueAt)}</>}</li>)}
                {myAssignments.length > 6 && <li><Link href="/assignments" className={link}>Xem tất cả »</Link></li>}
              </Block>
            )}
            {mySchedule.length > 0 && (
              <Block title="Lịch công tác 7 ngày tới">
                {mySchedule.map((w) => <li key={w.id}>{fmtDateVN(w.day)} · {w.kind}: {w.title}</li>)}
              </Block>
            )}
          </section>

          <section className={col} aria-labelledby="h-unit">
            <h2 id="h-unit" className={h2}>Công việc của đơn vị</h2>
            <h3 className={h3}><AlertCircle className="h-9 w-9 shrink-0 text-[#d9534f]" aria-hidden />Cảnh báo quá hạn</h3>
            {!overField.length && !overDue.length && <p className="text-sm text-muted-foreground">Không có đơn hàng quá hạn.</p>}
            {overField.length > 0 && (
              <>
                <ul className="list-disc space-y-1 pl-6 text-[15px]">
                  {overField.slice(0, 3).map((o) => <li key={o.id}>Đơn hàng <Link href={`/orders/${o.id}`} className={link}>{o.code}</Link> quá hạn quan trắc <b>{o.late}</b> ngày</li>)}
                </ul>
                <Link href="/orders?quaHan=quan-trac" className={btn}>Xem <b>{overField.length}</b> đơn hàng quá hạn quan trắc »</Link>
              </>
            )}
            {overDue.length > 0 && (
              <>
                <ul className="list-disc space-y-1 pl-6 text-[15px]">
                  {overDue.slice(0, 3).map((o) => <li key={o.id}>Đơn hàng <Link href={`/orders/${o.id}`} className={link}>{o.code}</Link> quá hạn trả kết quả <b>{o.late}</b> ngày</li>)}
                </ul>
                <Link href="/orders?quaHan=tra-ket-qua" className={btn}>Xem <b>{overDue.length}</b> đơn hàng chậm trả kết quả »</Link>
              </>
            )}
            <h3 className={h3}><CalendarClock className="h-9 w-9 shrink-0 text-[#337ab7]" aria-hidden />Sự kiện sắp diễn ra</h3>
            {upcoming.length ? (
              <ul className="list-disc space-y-1 pl-6 text-[15px]">
                {upcoming.map((w) => <li key={w.id}>{fmtDateVN(w.day)} · {w.staffName} – {w.kind}: {w.title}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có lịch trong 7 ngày tới.</p>
            )}
            <h3 className={h3}><ClipboardCheck className="h-9 w-9 shrink-0 text-[#d9534f]" aria-hidden />Công việc hôm nay</h3>
            {todayWork.length ? (
              <ul className="list-disc space-y-1 pl-6 text-[15px]">
                {todayWork.map((w) => <li key={w.id}>{w.staffName} – {w.kind}: {w.title}{w.hours ? ` (${w.hours} giờ)` : ""}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có việc nào trong lịch công tác hôm nay. <Link href="/work-schedule" className={link}>Mở lịch công tác</Link></p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Block({ title, tone, children }: { title: string; tone?: "danger"; children: React.ReactNode }) {
  return (
    <div>
      <div className={tone === "danger" ? "font-semibold text-[#a94442]" : "font-semibold"}>{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-6 text-[15px]">{children}</ul>
    </div>
  );
}
