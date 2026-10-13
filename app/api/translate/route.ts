import { NextResponse } from "next/server";
import { canAccessFamilyApi } from "@/lib/serverAuth";

export async function POST(request: Request) {
  if (!canAccessFamilyApi(request)) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 600) {
    return NextResponse.json({ error: "翻訳する文章を確認してください。" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "Google 翻訳の設定がありません。" }, { status: 503 });
  }

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "en", target: "ja", format: "text" }),
      cache: "no-store"
    }
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json({ error: "Google 翻訳に接続できませんでした。" }, { status: 502 });
  }

  const translated = payload?.data?.translations?.[0]?.translatedText;
  return typeof translated === "string"
    ? NextResponse.json({ translated })
    : NextResponse.json({ error: "翻訳結果を取得できませんでした。" }, { status: 502 });
}
