import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dedupeEvents } from "@/lib/eventDedupe";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const familyId = process.env.FAMILY_SYNC_ID ?? "family-schedule-hub";

function getServerClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function GET() {
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

  return NextResponse.json({ state: data?.state ?? null, updated_at: data?.updated_at ?? null });
}

async function saveState(request: Request) {
  const client = getServerClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase sync is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.state) {
    return NextResponse.json({ error: "Missing state." }, { status: 400 });
  }
  const state = {
    ...body.state,
    events: Array.isArray(body.state.events) ? dedupeEvents(body.state.events) : []
  };

  const { error } = await client.from("family_app_states").upsert({
    family_id: familyId,
    state,
    updated_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  return saveState(request);
}

export async function PUT(request: Request) {
  return saveState(request);
}
