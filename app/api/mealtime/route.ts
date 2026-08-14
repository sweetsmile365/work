import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type YoutubeItem = {
  videoId: string;
  title: string;
  published?: string;
  description?: string;
  channel: string;
};

const CNN10_CHANNEL_ID = "UCTOoRgpHTjAQPk6Ak70u-pA";
const NATGEO_KIDS_CHANNEL_ID = "UCXVCgDuD_QCkI7gTKU7-tpg";

const FEED_BASE = "https://www.youtube.com/feeds/videos.xml?channel_id=";

function cleanText(value = "") {
  return value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(block: string, tag: string) {
  const match = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i")
  );
  return match?.[1] ?? "";
}

function parseYoutubeFeed(xml: string, channel: string): YoutubeItem[] {
  const entries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];

  return entries
    .map((entry) => {
      const videoId = cleanText(tagValue(entry, "yt:videoId"));
      const title = cleanText(tagValue(entry, "title"));
      const published = cleanText(tagValue(entry, "published"));
      const description = cleanText(tagValue(entry, "media:description"));

      return {
        videoId,
        title,
        published: published || undefined,
        description: description || undefined,
        channel
      };
    })
    .filter((item) => item.videoId && item.title);
}

async function loadYoutubeFeed(
  channelId: string,
  channel: string
): Promise<YoutubeItem[]> {
  try {
    const response = await fetch(`${FEED_BASE}${channelId}`, {
      headers: {
        "User-Agent": "Family-Schedule-Hub/1.0"
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) throw new Error(`YouTube RSS ${response.status}`);

    return parseYoutubeFeed(await response.text(), channel);
  } catch {
    return [];
  }
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

function isShortNatGeoCandidate(item: YoutubeItem) {
  const title = item.title.toLowerCase();

  const exclude = [
    "full episode",
    "compilation",
    "podcast",
    "special edition",
    "full documentary",
    "livestream"
  ];

  return !exclude.some((word) => title.includes(word));
}

function latestCnn10(items: YoutubeItem[]) {
  return items[0] ?? null;
}

function dailyNatGeo(items: YoutubeItem[], seed: number) {
  const shortItems = items.filter(isShortNatGeoCandidate);
  const pool = (shortItems.length >= 5 ? shortItems : items).slice(0, 12);

  if (!pool.length) return null;
  return pool[seed % pool.length];
}

export async function GET() {
  const dayKey = tokyoDayKey();
  const seed = daySeed(dayKey);

  const [cnnItems, natGeoItems] = await Promise.all([
    loadYoutubeFeed(CNN10_CHANNEL_ID, "CNN 10"),
    loadYoutubeFeed(NATGEO_KIDS_CHANNEL_ID, "Nat Geo Kids")
  ]);

  const cnn10 = latestCnn10(cnnItems);
  const natGeo = dailyNatGeo(natGeoItems, seed);

  const response = NextResponse.json({
    ok: Boolean(cnn10 || natGeo),
    dayKey,
    updatedAt: new Date().toISOString(),
    picks: {
      cnn10,
      natGeo
    }
  });

  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
