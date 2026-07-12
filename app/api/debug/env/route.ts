import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function hasValue(name: string) {
  return Boolean(process.env[name]?.trim());
}

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: hasValue("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: hasValue("SUPABASE_SERVICE_ROLE_KEY"),
    FAMILY_SYNC_ID: hasValue("FAMILY_SYNC_ID"),
    NODE_ENV: process.env.NODE_ENV ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null
  });
}
