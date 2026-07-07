import { NextResponse } from "next/server";
import { runOcr } from "@/lib/ocr";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await runOcr("pdf", body.document ?? "mock", body.languageHints ?? ["ja"]);
  return NextResponse.json(result);
}
