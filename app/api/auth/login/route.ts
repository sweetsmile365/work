import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/permissions";
import { createSession, familySessionCookie, sessionCookieOptions, verifyRolePassword } from "@/lib/serverAuth";

const roles: UserRole[] = ["admin", "parent", "child_editor"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const familyId = process.env.FAMILY_SYNC_ID ?? "family-schedule-hub";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const role = body?.role as UserRole;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!roles.includes(role) || !password) return NextResponse.json({ error: "ログイン情報を確認してください。" }, { status: 400 });
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "同期設定が不足しています。" }, { status: 503 });

  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.from("family_app_states").select("state").eq("family_id", familyId).maybeSingle();
  if (error) return NextResponse.json({ error: "ログイン情報を確認できませんでした。" }, { status: 503 });
  const result = verifyRolePassword(role, password, data?.state);
  if (!result.ok) {
    const error = result.reason === "missing_configuration"
      ? "初期パスワードが未設定です。管理者が Vercel の環境変数を設定してください。"
      : "パスワードが違います。";
    return NextResponse.json({ error }, { status: 401 });
  }
  const token = createSession(role);
  if (!token) return NextResponse.json({ error: "FAMILY_SESSION_SECRET を設定してください。" }, { status: 503 });

  const response = NextResponse.json({ role });
  response.cookies.set(familySessionCookie, token, sessionCookieOptions());
  return response;
}
