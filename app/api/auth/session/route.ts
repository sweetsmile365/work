import { NextResponse } from "next/server";
import { readSession } from "@/lib/serverAuth";

export async function GET(request: Request) {
  const session = readSession(request);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  return NextResponse.json({ role: session.role });
}
