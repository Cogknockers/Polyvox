import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function decodeBase64Url(value: string) {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function getKeyType(key: string) {
  if (!key) return "missing";
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.includes(".")) return "jwt";
  return "unknown";
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const keyType = getKeyType(key);

  const parts = key.split(".");
  const payloadRaw = keyType === "jwt" && parts.length >= 2 ? decodeBase64Url(parts[1]) : null;
  const payload = payloadRaw ? JSON.parse(payloadRaw) : null;

  let adminCheck: { ok: boolean; message?: string } | null = null;
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) {
        adminCheck = { ok: false, message: error.message };
      } else {
        adminCheck = { ok: true };
      }
    } catch (error) {
      adminCheck = {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return NextResponse.json({
    supabaseUrl: url,
    hasKey: Boolean(key),
    length: key.length,
    dots: (key.match(/\./g) || []).length,
    startsWithEyJ: key.startsWith("eyJ"),
    keyType,
    role: payload?.role ?? null,
    ref: payload?.ref ?? null,
    adminCheck,
  });
}
