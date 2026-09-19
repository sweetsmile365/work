import { NextResponse } from "next/server";
import { runOcr } from "@/lib/ocr";
import { readSession } from "@/lib/serverAuth";

export async function POST(request: Request) {
  const session = readSession(request);
  if (!session) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  if (session.role === "child_editor") return NextResponse.json({ error: "このアカウントでは OCR を実行できません。" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const images = Array.isArray(body.imageVariants) && body.imageVariants.length ? body.imageVariants : body.image ?? "mock";
  const result = await runOcr("image", images, body.languageHints ?? ["ja"]);
  return NextResponse.json(result);
}
