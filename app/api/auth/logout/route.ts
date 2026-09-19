import { NextResponse } from "next/server";
import { clearSessionCookieOptions, familySessionCookie } from "@/lib/serverAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(familySessionCookie, "", clearSessionCookieOptions());
  return response;
}
