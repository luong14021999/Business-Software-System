import { sha256Hex } from "@/lib/platform/security/crypto";

/** IP người gọi (Vercel đặt x-forwarded-for; phần tử đầu là IP gốc). */
export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** Băm IP kèm salt để đếm tần suất mà không lưu IP gốc. */
export function ipHash(req: Request) {
  const salt = process.env.PUBLIC_HASH_SALT ?? process.env.NEON_AUTH_COOKIE_SECRET ?? "vnnth";
  return sha256Hex(`${salt}:${clientIp(req)}`);
}
