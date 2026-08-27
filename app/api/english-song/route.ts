import { NextRequest, NextResponse } from "next/server";

type DriveFile = { id: string; name: string };

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function fileIdFromHref(href: string) {
  return (
    href.match(/\/file\/d\/([A-Za-z0-9_-]+)/)?.[1] ??
    href.match(/[?&]id=([A-Za-z0-9_-]+)/)?.[1] ??
    null
  );
}

function filenameFromAnchor(inner: string) {
  const title = inner.match(
    /class=["'][^"']*flip-entry-title[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i
  )?.[1];

  const value = title ? stripTags(title) : stripTags(inner);
  return value.match(/([^/\\<>:"|?*]+\.(?:mp3|m4a|wav|json))/i)?.[1]?.trim() ?? null;
}

function parseDriveFolder(html: string) {
  const items = new Map<string, DriveFile>();
  const anchorPattern =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const id = fileIdFromHref(decodeHtml(match[1]));
    const name = filenameFromAnchor(match[2]);
    if (id && name) items.set(id, { id, name });
  }

  return [...items.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base"
    })
  );
}

function stem(name: string) {
  return name.replace(/\.[^.]+$/, "").trim();
}

async function readFolder(folderId: string) {
  const url =
    `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}#list`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
    }
  });

  if (!response.ok) throw new Error(`Google Drive returned ${response.status}`);
  return parseDriveFolder(await response.text());
}

export async function GET(request: NextRequest) {
  const folderId = process.env.ENGLISH_SONGS_FOLDER_ID;

  if (!folderId) {
    return NextResponse.json({
      ok: false,
      items: [],
      error: "ENGLISH_SONGS_FOLDER_ID is not configured."
    });
  }

  const lyricId = request.nextUrl.searchParams.get("lyrics");

  if (lyricId) {
    const response = await fetch(
      `https://drive.google.com/uc?export=download&id=${encodeURIComponent(lyricId)}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Lyrics fetch failed: ${response.status}` },
        { status: 502 }
      );
    }

    const text = await response.text();

    try {
      return NextResponse.json(JSON.parse(text), {
        headers: { "Cache-Control": "no-store" }
      });
    } catch {
      return NextResponse.json(
        { error: "Lyrics file is not valid JSON." },
        { status: 500 }
      );
    }
  }

  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

  try {
    const files = await readFolder(folderId);
    const audios = files.filter((file) => /\.(mp3|m4a|wav)$/i.test(file.name));
    const lyricFiles = files.filter((file) => /\.json$/i.test(file.name));
    const lyricByStem = new Map(
      lyricFiles.map((file) => [stem(file.name).toLowerCase(), file])
    );

    const items = audios.map((file) => {
      const songStem = stem(file.name);
      const lyric = lyricByStem.get(songStem.toLowerCase());

      return {
        id: file.id,
        name: file.name,
        stem: songStem,
        audioUrl: `/api/book-audio/stream?id=${encodeURIComponent(file.id)}`,
        lyricId: lyric?.id
      };
    });

    return NextResponse.json({
      ok: items.length > 0,
      folderUrl,
      items
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      folderUrl,
      items: [],
      error: error instanceof Error ? error.message : "Drive folder fetch failed"
    });
  }
}
