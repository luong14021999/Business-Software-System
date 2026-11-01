// Bộ kết nối LGSP (nền tảng tích hợp, chia sẻ dữ liệu cấp tỉnh) / NDXP (nền tảng quốc gia) – M1.3.
// Chưa cấu hình LGSP_BASE_URL + LGSP_TOKEN → chế độ MÔ PHỎNG: không gửi ra ngoài, phản hồi giả lập theo cùng định dạng.
// Khi có tài khoản thật: đặt biến môi trường, không phải sửa mã nghiệp vụ.
import { randomUUID } from "crypto";
import { dbQuery } from "@/lib/platform/db";

export const CHANNELS = ["LGSP", "NDXP"] as const;
export type Channel = (typeof CHANNELS)[number];

export const OUTBOUND_SERVICES = {
  "danh-muc-phep-thu": "Danh mục phép thử được công nhận (VILAS 1501)",
  "bao-cao-thong-ke": "Báo cáo thống kê hoạt động định kỳ",
  "ket-qua-kiem-nghiem": "Thông tin phiếu kết quả đã phát hành (mã, trạng thái, mã băm)",
  "danh-muc-dung-chung": "Danh mục dùng chung (MDM)",
  "chi-tieu-giong": "Chỉ tiêu về giống: giống công nhận / lưu hành, sản xuất theo cấp, cơ sở sản xuất, phân bố giống (Sở NN&MT, IOC tỉnh)",
} as const;
export type OutboundService = keyof typeof OUTBOUND_SERVICES;

const env = (ch: Channel) => ({
  base: process.env[`${ch}_BASE_URL`] ?? "",
  token: process.env[`${ch}_TOKEN`] ?? "",
  agency: process.env[`${ch}_AGENCY_CODE`] ?? "VNN-TH",
});

export const channelMode = (ch: Channel) => (env(ch).base && env(ch).token ? "Thật" : "Mô phỏng");

/** Phong bì thông điệp chung: mã giao dịch, đơn vị gửi, thời điểm, dịch vụ, dữ liệu. */
export function envelope(ch: Channel, service: string, data: unknown, correlationId = randomUUID()) {
  return { header: { maGiaoDich: correlationId, donViGui: env(ch).agency, dichVu: service, thoiGian: new Date().toISOString(), phienBan: "1.0" }, data };
}

function simulate(service: string, payload: ReturnType<typeof envelope>) {
  const forceError = JSON.stringify(payload.data ?? "").includes("SIMULATE_ERROR");
  if (forceError) return { ok: false, status: 502, body: { maLoi: "LGSP-502", moTa: "Mô phỏng lỗi kết nối từ nền tảng" } };
  return {
    ok: true,
    status: 200,
    body: { maGiaoDich: payload.header.maGiaoDich, trangThai: "Đã tiếp nhận", maTiepNhan: `SIM-${Date.now().toString(36).toUpperCase()}`, dichVu: service, thoiGian: new Date().toISOString() },
  };
}

/** Gửi thông điệp; ghi vào integration_messages cả khi lỗi. */
export async function sendMessage(ch: Channel, service: string, data: unknown, actor: string, existingId?: string) {
  const payload = envelope(ch, service, data);
  const mode = channelMode(ch);
  let result: { ok: boolean; status: number; body: unknown };
  if (mode === "Mô phỏng") {
    result = simulate(service, payload);
  } else {
    const { base, token } = env(ch);
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/${service}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      result = { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
    } catch (e) {
      result = { ok: false, status: 0, body: { moTa: (e as Error).message } };
    }
  }
  const status = result.ok ? "Thành công" : "Lỗi";
  const error = result.ok ? "" : `HTTP ${result.status}: ${JSON.stringify(result.body).slice(0, 300)}`;
  if (existingId) {
    await dbQuery(
      `update public.integration_messages set status = $2, response = $3::jsonb, error = $4, attempts = attempts + 1, at = now(), mode = $5 where id = $1`,
      [existingId, status, JSON.stringify(result.body), error, mode],
    );
    return { id: existingId, ok: result.ok, status, response: result.body, mode };
  }
  const [r] = await dbQuery(
    `insert into public.integration_messages (direction, channel, service, correlation_id, payload, status, response, error, mode, actor)
     values ('Gửi đi', $1, $2, $3, $4::jsonb, $5, $6::jsonb, $7, $8, $9) returning id`,
    [ch, service, payload.header.maGiaoDich, JSON.stringify(payload), status, JSON.stringify(result.body), error, mode, actor],
  );
  return { id: r.id as string, ok: result.ok, status, response: result.body, mode };
}

/** Gửi lại thông điệp lỗi với cùng dữ liệu. */
export async function retryMessage(id: string, actor: string) {
  const [m] = await dbQuery(`select channel, service, payload, direction from public.integration_messages where id = $1`, [id]);
  if (!m) return null;
  if (m.direction !== "Gửi đi") throw new Error("Chỉ gửi lại được thông điệp gửi đi");
  const data = (m.payload as { data?: unknown })?.data;
  return sendMessage(m.channel as Channel, m.service as string, data, actor, id);
}

/** Ghi nhận thông điệp nhận về (qua /api/v1/lgsp/inbound). */
export async function recordInbound(ch: string, service: string, payload: unknown, clientName: string) {
  const corr = (payload as { header?: { maGiaoDich?: string } })?.header?.maGiaoDich ?? randomUUID();
  const ack = { maGiaoDich: corr, trangThai: "Đã tiếp nhận", thoiGian: new Date().toISOString() };
  await dbQuery(
    `insert into public.integration_messages (direction, channel, service, correlation_id, payload, status, response, mode, actor)
     values ('Nhận về', $1, $2, $3, $4::jsonb, 'Thành công', $5::jsonb, $6, $7)`,
    [ch, service, corr, JSON.stringify(payload ?? {}), JSON.stringify(ack), channelMode(ch === "NDXP" ? "NDXP" : "LGSP"), clientName],
  );
  return ack;
}
