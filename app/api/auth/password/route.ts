import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/permissions";
import { readSession, updatePasswordHash, verifyRolePassword } from "@/lib/serverAuth";

const roles: UserRole[] = ["admin", "parent", "child_editor"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const familyId = process.env.FAMILY_SYNC_ID ?? "family-schedule-hub";

export async function POST(request: Request) {
  const session = readSession(request);
  if (session?.role !== "admin") return NextResponse.json({ error: "管理者のみ変更できます。" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const nextPassword = typeof body?.nextPassword === "string" ? body.nextPassword.trim() : "";
  const targetRole = body?.targetRole as UserRole;
  if (!roles.includes(targetRole) || nextPassword.length < 8) return NextResponse.json({ error: "新しいパスワードは8文字以上にしてください。" }, { status: 400 });
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "同期設定が不足しています。" }, { status: 503 });

  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.from("family_app_states").select("state, updated_at").eq("family_id", familyId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "現在のパスワードを確認できませんでした。" }, { status: 503 });
  if (!verifyRolePassword("admin", currentPassword, data.state).ok) return NextResponse.json({ error: "現在の管理者パスワードが違います。" }, { status: 401 });

  const state = updatePasswordHash(data.state, targetRole, nextPassword);
  const { data: updated, error: updateError } = await client
    .from("family_app_states")
    .update({ state, updated_at: new Date().toISOString() })
    .eq("family_id", familyId)
    .eq("updated_at", data.updated_at)
    .select("updated_at")
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: "パスワードを保存できませんでした。" }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "ほかの端末で変更されました。再読み込みしてからもう一度試してください。" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
