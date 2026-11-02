import Link from "next/link";
import { CalendarDays, Tag } from "lucide-react";
import { HomeTabs } from "@/components/m2/home/home-tabs";
import { PostBox } from "@/components/m2/home/post-box";
import { LabFooter, btn, link } from "@/components/m2/lab-ui/page";
import { assignmentStore } from "@/lib/modules/m2/data/custody";
import { labPostStore, linesByOrder, orderStore } from "@/lib/modules/m2/data/orders";
import { orderEventsBetween, scheduleBetween } from "@/lib/modules/m2/data/home";
import { addDays, overdueDays } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN, todayISO, vnDateOf } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/**
 * Trang chủ phòng thí nghiệm: bảng tin nội bộ, công việc cá nhân, công việc của đơn vị
 * (cảnh báo đơn hàng quá hạn, sự kiện sắp diễn ra, công việc hôm nay – gồm cả mốc quan trắc / trả kết quả của đơn hàng).
 */
export default async function LabHomePage({ searchParams }: { searchParams: Promise<{ tin?: string }> }) {
  const { tin } = await searchParams;
  const access = await currentAccess();
  const me = access.actor?.name ?? "";
  const today = todayISO();
  const [posts, orders, schedule, events, assignments, returned, waitQa, waitManager] = await Promise.all([
    labPostStore.list(),
    orderStore.list(),
    scheduleBetween(today, addDays(today, 7)),
    orderEventsBetween(today, addDays(today, 7)),
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
  // Lịch quan trắc tự sinh trùng với mốc "đi quan trắc" của đơn nên chỉ lấy lịch nhập tay ở hai mục dưới.
  const manual = schedule.filter((w) => !w.auto);
  const eventText = (e: (typeof events)[number]) => (e.kind === "Quan trắc" ? "Đi quan trắc / lấy mẫu" : "Hạn trả kết quả");
  const upcoming = [
    ...events.filter((e) => e.day > today).map((e) => ({ key: `${e.kind}${e.orderId}`, day: e.day, node: <>{eventText(e)} – đơn hàng <Link href={`/orders/${e.orderId}`} className={link}>{e.code}</Link> {e.name}</> })),
    ...manual.filter((w) => w.day > today).map((w) => ({ key: w.id, day: w.day, node: <>{w.staffName} – {w.kind}: {w.title}</> })),
  ].sort((a, b) => a.day.localeCompare(b.day)).slice(0, 10);
  const todayEvents = events.filter((e) => e.day === today);
  const todayField = schedule.filter((w) => w.auto && w.day === today);
  const todayWork = manual.filter((w) => w.day === today).sort((a, b) => a.staffName.localeCompare(b.staffName));

  const h2 = "mt-4 text-[26px] font-medium uppercase leading-tight text-[#333]";
  const h3 = "flex items-center gap-[5px] text-lg font-medium uppercase text-[#333] sm:text-xl";
  const col = "min-w-0 space-y-4 px-2 pb-6 pt-2";
  return (
    <main className="flex-1 overflow-y-auto bg-white scrollbar-thin">
      <div className="mx-auto max-w-[1170px] px-[15px] pt-5">
        <HomeTabs active="news" />
        <div className="grid divide-y border border-[#ddd] lg:-mx-[15px] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <section className={col} aria-labelledby="h-news">
            <h2 id="h-news" className={h2}>Bảng tin nội bộ</h2>
            <PostBox posts={shownPosts} me={me} canPost={access.can("write.any")} isAdmin={access.roles.includes("Quản trị")} />
            {posts.length > 3 && (
              <Link href={tin === "all" ? "/lims" : "/lims?tin=all"} className={`${btn} w-full justify-center`}>{tin === "all" ? "Thu gọn" : "Xem thêm"}</Link>
            )}
          </section>

          <section className={col} aria-labelledby="h-me">
            <h2 id="h-me" className={h2}>Công việc cá nhân</h2>
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
            <h3 className={h3}><Badge tone="bg-[radial-gradient(circle_at_35%_30%,#ff6b6b,#c9302c)]"><span className="text-[26px] font-black leading-none">!</span></Badge>Cảnh báo quá hạn</h3>
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
            <h3 className={h3}><Badge tone="bg-[radial-gradient(circle_at_35%_30%,#8fc3ee,#2e6da4)]"><CalendarDays className="h-5 w-5" /></Badge>Sự kiện sắp diễn ra</h3>
            {upcoming.length ? (
              <ul className="list-disc space-y-1 pl-6 text-[15px]">
                {upcoming.map((u) => <li key={u.key}>{fmtDateVN(u.day)} · {u.node}</li>)}
              </ul>
            ) : null}
            <h3 className={h3}><Badge tone="bg-[radial-gradient(circle_at_35%_30%,#ff7a59,#d9381e)]"><Tag className="h-5 w-5 fill-white" /></Badge>Công việc hôm nay</h3>
            {todayEvents.length || todayWork.length ? (
              <ul className="list-disc space-y-1 pl-6 text-[15px]">
                {todayEvents.map((e) => (
                  <li key={`${e.kind}${e.orderId}`}>
                    {eventText(e)} – đơn hàng <Link href={`/orders/${e.orderId}`} className={link}>{e.code}</Link> {e.name}
                    {e.kind === "Quan trắc" && todayField.some((w) => w.orderId === e.orderId) && (
                      <span className="text-muted-foreground"> ({todayField.filter((w) => w.orderId === e.orderId).map((w) => w.staffName).join(", ")})</span>
                    )}
                  </li>
                ))}
                {todayWork.map((w) => <li key={w.id}>{w.staffName} – {w.kind}: {w.title}{w.hours ? ` (${w.hours} giờ)` : ""}</li>)}
              </ul>
            ) : null}
          </section>
        </div>
        <LabFooter />
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

/** Biểu tượng tròn màu đầu mục như trang chủ XaLab. */
function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_-2px_3px_rgba(0,0,0,0.25)] ${tone}`} aria-hidden>{children}</span>;
}
