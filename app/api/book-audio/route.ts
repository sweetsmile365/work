import { NextRequest, NextResponse } from "next/server";

type AudioKind = "reading" | "vocab";

const CONFIG = {
  reading: {
    folderId: "1F0-TMYuMiYrrs5DybQa-Xj8XRHsnPtnT",
    folderLabel: "《超强英语阅读训练 1》",
    subtitleFolder: "《超强英语阅读训练 1》"
  },
  vocab: {
    folderId: "1O3GUY5ya2EkrR5RHHKr5_z6jzrH2CrAD",
    folderLabel: "《超强英语阅读训练 1》单词本",
    subtitleFolder: "《超强英语阅读训练 1》单词本"
  }
} as const;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#([0-9]+);/g, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10))
    );
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function fileIdFromHref(href: string) {
  const fileMatch = href.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  const openMatch = href.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (openMatch) return openMatch[1];

  return null;
}

function filenameFromAnchor(inner: string) {
  const titleMatch = inner.match(
    /class=["'][^"']*flip-entry-title[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i
  );
  if (titleMatch) {
    const value = stripTags(titleMatch[1]);
    if (value.toLowerCase().endsWith(".mp3")) return value;
  }

  const mp3Match = stripTags(inner).match(/([^/\\<>:"|?*]+\.mp3)/i);
  return mp3Match?.[1]?.trim() ?? null;
}

function parseDriveFolder(html: string) {
  const items = new Map<string, { id: string; name: string }>();

  const anchorPattern =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = decodeHtml(match[1]);
    const id = fileIdFromHref(href);
    if (!id) continue;

    const name = filenameFromAnchor(match[2]);
    if (!name) continue;

    items.set(id, { id, name });
  }

  if (items.size === 0) {
    const idPattern =
      /https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)\/view/g;

    for (const match of html.matchAll(idPattern)) {
      const id = match[1];
      const index = match.index ?? 0;
      const nearby = html.slice(
        Math.max(0, index - 900),
        Math.min(html.length, index + 1800)
      );

      const candidates = [
        nearby.match(
          /class=["'][^"']*flip-entry-title[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i
        )?.[1],
        nearby.match(/aria-label=["']([^"']+\.mp3)["']/i)?.[1],
        nearby.match(/title=["']([^"']+\.mp3)["']/i)?.[1]
      ].filter(Boolean) as string[];

      const name = candidates
        .map(stripTags)
        .find((candidate) => candidate.toLowerCase().endsWith(".mp3"));

      if (name) items.set(id, { id, name });
    }
  }

  return [...items.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base"
    })
  );
}

function subtitleUrl(folder: string, filename: string) {
  const stem = filename.replace(/\.[^.]+$/, "");
  return `/English_Subtitles/${encodeURIComponent(folder)}/${encodeURIComponent(
    stem
  )}.json`;
}

export async function GET(request: NextRequest) {
  const kindParam = request.nextUrl.searchParams.get("kind");
  const kind: AudioKind = kindParam === "vocab" ? "vocab" : "reading";
  const config = CONFIG[kind];

  const folderUrl = `https://drive.google.com/drive/folders/${config.folderId}`;
  const embeddedUrl =
    `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(
      config.folderId
    )}#list`;

  try {
    const response = await fetch(embeddedUrl, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          kind,
          folderUrl,
          needsSharing: true,
          items: [],
          error: `Google Drive returned ${response.status}`
        },
        { status: 200 }
      );
    }

    const html = await response.text();
    const files = parseDriveFolder(html);

    const items = files.map((file) => ({
      id: file.id,
      name: file.name,
      viewUrl: `https://drive.google.com/file/d/${file.id}/view`,
      audioUrl: `/api/book-audio/stream?id=${encodeURIComponent(file.id)}`,
      subtitleUrl: subtitleUrl(config.subtitleFolder, file.name)
    }));

    return NextResponse.json({
      ok: items.length > 0,
      kind,
      label: config.folderLabel,
      folderUrl,
      needsSharing: items.length === 0,
      items
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        kind,
        folderUrl,
        needsSharing: true,
        items: [],
        error: error instanceof Error ? error.message : "Drive folder fetch failed"
      },
      { status: 200 }
    );
  }
}
