// Ngày "hôm nay" theo giờ Việt Nam (server Vercel chạy UTC).
const VN_TZ = "Asia/Ho_Chi_Minh";

/** "YYYY-MM-DD" của hôm nay theo giờ Việt Nam. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: VN_TZ }).format(new Date());
}

/** Số ngày từ hôm nay (giờ VN) đến `dateStr` ("YYYY-MM-DD"); NaN nếu trống. */
export function daysUntil(dateStr?: string | null) {
  if (!dateStr) return NaN;
  const ms = Date.parse(dateStr.slice(0, 10)) - Date.parse(todayISO());
  return Math.round(ms / 86_400_000);
}

/** "YYYY-MM-DD" → "DD/MM/YYYY"; giữ nguyên nếu trống. */
export function fmtDateVN(iso?: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/** ISO → "dd/MM/yyyy HH:mm" theo giờ Việt Nam. */
export function fmtDateTimeVN(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}`;
}

/** ISO → giá trị ô <input type="datetime-local"> theo giờ Việt Nam ("YYYY-MM-DDTHH:mm"); "" nếu trống. */
export function toLocalInputVN(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: VN_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}`;
}

/** Giá trị ô datetime-local (giờ Việt Nam) → ISO có múi giờ +07:00; "" nếu trống. */
export const fromLocalInputVN = (v?: string | null) => (v ? `${v.length === 10 ? `${v}T00:00` : v}:00+07:00` : "");

/** Ngày "YYYY-MM-DD" theo giờ Việt Nam của một thời điểm ISO; "" nếu trống. */
export const vnDateOf = (iso?: string | null) => toLocalInputVN(iso).slice(0, 10);
