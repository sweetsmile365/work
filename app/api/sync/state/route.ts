import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dedupeEvents } from "@/lib/eventDedupe";
import { canWriteSharedState } from "@/lib/serverStateGuard";
import { readSession, withExistingPrivateAuth, withoutPrivateAuth } from "@/lib/serverAuth";
import type { FamilyEvent } from "@/types/events";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const familyId = process.env.FAMILY_SYNC_ID ?? "family-schedule-hub";

function getServerClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function unauthorized() {
  return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
}

function stateResponse(state: unknown, updatedAt: string | null) {
  return NextResponse.json({ state: state ? withoutPrivateAuth(state) : null, updated_at: updatedAt });
}

export async function GET(request: Request) {
  if (!readSession(request)) return unauthorized();
  const client = getServerClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase sync is not configured." }, { status: 503 });
  }

  const { data, error } = await client
    .from("family_app_states")
    .select("state, updated_at")
    .eq("family_id", familyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return stateResponse(data?.state ?? null, data?.updated_at ?? null);
}

async function saveState(request: Request) {
  const session = readSession(request);
  if (!session) return unauthorized();
  if (session.role === "display") return NextResponse.json({ error: "表示用画面では変更できません。" }, { status: 403 });
  const client = getServerClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase sync is not configured." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_000_000) return NextResponse.json({ error: "同期データが大きすぎます。" }, { status: 413 });
  const body = await request.json().catch(() => null);
  if (!body?.state || typeof body.state !== "object") {
    return NextResponse.json({ error: "Missing state." }, { status: 400 });
  }
  const baseUpdatedAt = typeof body.baseUpdatedAt === "string" ? body.baseUpdatedAt : null;

  const { data: existing, error: readError } = await client
    .from("family_app_states")
    .select("state, updated_at")
    .eq("family_id", familyId)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (existing && (!baseUpdatedAt || existing.updated_at !== baseUpdatedAt)) {
    return NextResponse.json({ error: "クラウド側に新しい変更があります。確認してから再同期してください。", state: withoutPrivateAuth(existing.state), updated_at: existing.updated_at }, { status: 409 });
  }
  if (!canWriteSharedState(session.role, existing?.state ?? {}, body.state)) {
    return NextResponse.json({ error: "このアカウントには、その変更を保存する権限がありません。" }, { status: 403 });
  }
  const requestedState = withoutPrivateAuth(body.state) as Record<string, unknown>;
  const state = withExistingPrivateAuth({
    ...requestedState,
    events: Array.isArray(requestedState.events) ? dedupeEvents(requestedState.events as FamilyEvent[]) : []
  }, existing?.state);
  const updatedAt = new Date().toISOString();

  const write = existing
    ? client.from("family_app_states").update({ state, updated_at: updatedAt }).eq("family_id", familyId).eq("updated_at", existing.updated_at).select("updated_at").maybeSingle()
    : client.from("family_app_states").insert({ family_id: familyId, state, updated_at: updatedAt }).select("updated_at").maybeSingle();
  const { data: written, error } = await write;

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "クラウド側に新しい変更があります。確認してから再同期してください。" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (existing && !written) return NextResponse.json({ error: "クラウド側に新しい変更があります。確認してから再同期してください。" }, { status: 409 });

  return NextResponse.json({ ok: true, updated_at: written?.updated_at ?? updatedAt });
}

export async function POST(request: Request) {
  return saveState(request);
}

export async function PUT(request: Request) {
  return saveState(request);
}
