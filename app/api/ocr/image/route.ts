import { NextResponse } from "next/server";
import { runOcr } from "@/lib/ocr";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await runOcr("image", body.image ?? "mock", body.languageHints ?? ["ja"]);
  return NextResponse.json(result);
}
