import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";

export function hmacSha256(key: string, data: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return nodeTimingSafeEqual(Buffer.from(a), Buffer.from(b));
}
