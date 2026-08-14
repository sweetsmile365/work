import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Candidate = {
  title: string;
  url: string;
  date?: string;
};

const LIST_URL = "https://www.timeforkids.com/g56/?age=child";

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—");
}

function cleanText(value = "") {
  return decodeHtml(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function normalizeUrl(value = "") {
  return decodeHtml(value)
    .replace(/\\u0026/gi, "&")
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .trim();
}

function attr(tag: string, name: string) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i")
  );
  return match?.[1] ? normalizeUrl(match[1]) : "";
}

function metaContent(html: string, key: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const name = attr(tag, "name") || attr(tag, "property");
    if (name.toLowerCase() === key.toLowerCase()) {
      return decodeHtml(attr(tag, "content"));
    }
  }

  return "";
}

function canonicalUrl(html: string, fallback: string) {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of links) {
    if (attr(tag, "rel").toLowerCase() === "canonical") {
      return attr(tag, "href") || fallback;
    }
  }
  return fallback;
}

function tokyoDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function daySeed(dayKey: string) {
  return [...dayKey].reduce(
    (sum, char, index) => sum + char.charCodeAt(0) * (index + 1),
    0
  );
}

function parseCandidates(html: string): Candidate[] {
  const anchors =
    html.match(/<a\b[^>]*href=["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi) ?? [];

  const seen = new Set<string>();
  const results: Candidate[] = [];

  for (const anchor of anchors) {
    const openTag = anchor.match(/<a\b[^>]*>/i)?.[0] ?? "";
    let url = attr(openTag, "href");
    if (!url) continue;

    if (url.startsWith("/")) {
      url = `https://www.timeforkids.com${url}`;
    }

    if (!/^https:\/\/www\.timeforkids\.com\/g56\/[^/?#]+\/?$/i.test(url)) {
      continue;
    }

    const slug = url
      .replace(/^https:\/\/www\.timeforkids\.com\/g56\//i, "")
      .replace(/\/$/, "");

    if (
      !slug ||
      ["articles", "topics", "sections", "authors", "page"].includes(slug)
    ) {
      continue;
    }

    const title = cleanText(anchor);
    if (!title || title.length < 4 || title.length > 180) continue;

    const index = html.indexOf(anchor);
    const nearby = html.slice(Math.max(0, index - 500), index + anchor.length + 1800);

    // Prefer entries explicitly marked Audio in the public G5-6 listing.
    if (!/\bAudio\b/i.test(cleanText(nearby))) continue;

    const date =
      cleanText(nearby).match(
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/
      )?.[0];

    const key = url.replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      title,
      url: key + "/",
      date
    });
  }

  return results.slice(0, 20);
}

function extractAudioUrl(html: string) {
  const normalized = normalizeUrl(html);

  const tags =
    normalized.match(/<(?:audio|source)\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const src = attr(tag, "src") || attr(tag, "data-src");
    const type = attr(tag, "type");
    if (
      /^https?:\/\//i.test(src) &&
      (/\.(?:mp3|m4a)(?:\?|$)/i.test(src) || /audio/i.test(type))
    ) {
      return src;
    }
  }

  const direct =
    normalized.match(
      /https?:\/\/[^"'\\\s<>]+?\.(?:mp3|m4a)(?:\?[^"'\\\s<>]*)?/i
    )?.[0];

  return direct ? normalizeUrl(direct) : "";
}

function articleExcerpt(html: string) {
  const description =
    metaContent(html, "description") ||
    metaContent(html, "og:description");

  if (description) {
    return cleanText(description).slice(0, 700);
  }

  // Conservative fallback: use only a short first paragraph, not the full article.
  const paragraphs =
    html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) ?? [];

  for (const paragraph of paragraphs) {
    const text = cleanText(paragraph);
    if (text.length >= 80 && text.length <= 1200) {
      return text.slice(0, 700);
    }
  }

  return "";
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; FamilyScheduleHub/1.0; +https://example.invalid)"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }

  return response.text();
}

export async function GET() {
  const dayKey = tokyoDayKey();

  try {
    const listingHtml = await fetchText(LIST_URL);
    const candidates = parseCandidates(listingHtml);

    if (!candidates.length) {
      throw new Error("No TIME for Kids audio candidates found");
    }

    // Rotate among recent audio articles so the meal page changes every Japan day.
    const pool = candidates.slice(0, Math.min(10, candidates.length));
    const candidate = pool[daySeed(dayKey) % pool.length];

    const articleHtml = await fetchText(candidate.url);

    const title =
      metaContent(articleHtml, "og:title")
        .replace(/\s*\|\s*TIME for Kids.*$/i, "")
        .trim() ||
      candidate.title;

    const imageUrl = metaContent(articleHtml, "og:image");
    const excerpt = articleExcerpt(articleHtml);
    const audioUrl = extractAudioUrl(articleHtml);
    const url = canonicalUrl(articleHtml, candidate.url);

    const response = NextResponse.json({
      ok: true,
      dayKey,
      article: {
        title,
        date: candidate.date,
        url,
        imageUrl: imageUrl || undefined,
        excerpt,
        audioUrl: audioUrl || undefined,
        audioMode: audioUrl ? "official" : "speech"
      }
    });

    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    const response = NextResponse.json(
      {
        ok: false,
        dayKey,
        article: null,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }
}
