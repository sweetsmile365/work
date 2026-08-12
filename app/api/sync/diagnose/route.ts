import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function safeHost(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function classifyFetchError(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("fetch failed") ||
    lower.includes("enotfound") ||
    lower.includes("eai_again") ||
    lower.includes("dns")
  ) {
    return "network_or_dns_failure";
  }
  if (
    lower.includes("certificate") ||
    lower.includes("tls") ||
    lower.includes("ssl")
  ) {
    return "tls_failure";
  }
  return "unknown_fetch_failure";
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const familyId = process.env.FAMILY_SYNC_ID ?? "family-schedule-hub";

  const result: Record<string, unknown> = {
    ok: false,
    env: {
      supabaseUrlPresent: Boolean(supabaseUrl),
      serviceRoleKeyPresent: Boolean(serviceRoleKey),
      familySyncIdPresent: Boolean(process.env.FAMILY_SYNC_ID)
    },
    supabaseHost: safeHost(supabaseUrl),
    familyId
  };

  if (!supabaseUrl || !serviceRoleKey) {
    result.reason = "missing_environment_variable";
    return NextResponse.json(result, { status: 503 });
  }

  let parsed: URL;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    result.reason = "invalid_supabase_url";
    return NextResponse.json(result, { status: 500 });
  }

  result.urlCheck = {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    looksLikeSupabase:
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".supabase.co")
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${parsed.origin}/rest/v1/`, {
        method: "GET",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`
        },
        cache: "no-store",
        signal: controller.signal
      });

      result.restProbe = {
        reachedServer: true,
        status: response.status,
        statusText: response.statusText
      };
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.reason = classifyFetchError(message);
    result.restProbe = {
      reachedServer: false,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: message
    };
    return NextResponse.json(result, { status: 502 });
  }

  try {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await client
      .from("family_app_states")
      .select("family_id, updated_at")
      .eq("family_id", familyId)
      .maybeSingle();

    if (error) {
      result.reason = "supabase_table_query_failed";
      result.tableProbe = {
        ok: false,
        code: error.code ?? null,
        message: error.message ?? null,
        details: error.details ?? null,
        hint: error.hint ?? null
      };
      return NextResponse.json(result, { status: 500 });
    }

    result.ok = true;
    result.reason = "sync_backend_reachable";
    result.tableProbe = {
      ok: true,
      rowFound: Boolean(data),
      updatedAt: data?.updated_at ?? null
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.reason = classifyFetchError(message);
    result.tableProbe = {
      ok: false,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: message
    };
    return NextResponse.json(result, { status: 500 });
  }
}
