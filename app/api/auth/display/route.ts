import { NextResponse } from "next/server";
import { createSession, familySessionCookie, sessionCookieOptions, verifyDisplayToken } from "@/lib/serverAuth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!process.env.FAMILY_DISPLAY_TOKEN) return NextResponse.json({ error: "表示用トークンが未設定です。" }, { status: 503 });
  if (!verifyDisplayToken(token)) return NextResponse.json({ error: "表示用トークンが違います。" }, { status: 401 });
  const session = createSession("display");
  if (!session) return NextResponse.json({ error: "FAMILY_SESSION_SECRET を設定してください。" }, { status: 503 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(familySessionCookie, session, sessionCookieOptions());
  return response;
}
