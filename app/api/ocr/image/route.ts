import { NextResponse } from "next/server";
import { runOcr } from "@/lib/ocr";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const images = Array.isArray(body.imageVariants) && body.imageVariants.length ? body.imageVariants : body.image ?? "mock";
  const result = await runOcr("image", images, body.languageHints ?? ["ja"]);
  return NextResponse.json(result);
}
