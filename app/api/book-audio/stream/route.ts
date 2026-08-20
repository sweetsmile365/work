import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validDriveId(value: string) {
  return /^[A-Za-z0-9_-]{10,}$/.test(value);
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";

  if (!validDriveId(id)) {
    return NextResponse.json(
      { ok: false, error: "Invalid Google Drive file id" },
      { status: 400 }
    );
  }

  const range = request.headers.get("range");

  const candidates = [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
      id
    )}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`
  ];

  let lastStatus = 502;

  for (const url of candidates) {
    try {
      const upstream = await fetch(url, {
        cache: "no-store",
        redirect: "follow",
        headers: {
          ...(range ? { Range: range } : {}),
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
        }
      });

      lastStatus = upstream.status;

      if (!upstream.ok && upstream.status !== 206) continue;

      const contentType = upstream.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) continue;

      const headers = new Headers();
      headers.set("Content-Type", contentType || "audio/mpeg");
      headers.set("Cache-Control", "private, max-age=3600");
      headers.set("Accept-Ranges", "bytes");

      for (const name of [
        "content-length",
        "content-range",
        "etag",
        "last-modified"
      ]) {
        const value = upstream.headers.get(name);
        if (value) headers.set(name, value);
      }

      return new NextResponse(upstream.body, {
        status: upstream.status === 206 ? 206 : 200,
        headers
      });
    } catch {
      // try next Google Drive endpoint
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        "Google Drive audio could not be streamed. Check folder sharing."
    },
    { status: lastStatus === 403 || lastStatus === 404 ? lastStatus : 502 }
  );
}
