import { NextResponse } from "next/server";
import { readSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

function hasValue(name: string) {
  return Boolean(process.env[name]?.trim());
}

export async function GET(request: Request) {
  const session = readSession(request);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "管理者ログインが必要です。" }, { status: 401 });
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: hasValue("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: hasValue("SUPABASE_SERVICE_ROLE_KEY"),
    FAMILY_SYNC_ID: hasValue("FAMILY_SYNC_ID"),
    NODE_ENV: process.env.NODE_ENV ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null
  });
}
