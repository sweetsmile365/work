import { NextResponse } from "next/server";

export const revalidate = 21600; // refresh upstream feeds every 6 hours

type FeedItem = {
  title: string;
  link: string;
  published?: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: "audio" | "video";
};

type SourceConfig = {
  id: string;
  label: string;
  kind: "news" | "video";
  level: "EASY" | "NORMAL";
  feed: string;
  fallbackUrl: string;
  fallbackTitle: string;
};

const SOURCES: SourceConfig[] = [
  {
    id: "as-it-is",
    label: "VOA · As It Is",
    kind: "news",
    level: "NORMAL",
    feed: "https://learningenglish.voanews.com/api/zkm-ql-vomx-tpej-rqi",
    fallbackUrl: "https://learningenglish.voanews.com/z/1579",
    fallbackTitle: "VOA Learning English · As It Is"
  },
  {
    id: "voa60",
    label: "VOA60 · Watch & Learn",
    kind: "news",
    level: "EASY",
    feed: "https://learningenglish.voanews.com/api/zyk-il-vomx-tpetpqqm",
    fallbackUrl: "https://learningenglish.voanews.com/z/3613",
    fallbackTitle: "VOA60 · Watch & Learn"
  },
  {
    id: "english-minute",
    label: "English in a Minute",
    kind: "video",
    level: "EASY",
    feed: "https://learningenglish.voanews.com/api/zjk-rl-vomx-tpebpqqo",
    fallbackUrl: "https://learningenglish.voanews.com/z/3614",
    fallbackTitle: "English in a Minute"
  },
  {
    id: "level2",
    label: "Let's Learn English · Level 2",
    kind: "video",
    level: "NORMAL",
    feed: "https://learningenglish.voanews.com/api/zbptq_l-vomx-tpeq-kqv",
    fallbackUrl: "https://learningenglish.voanews.com/p/6765.html",
    fallbackTitle: "Let's Learn English · Level 2"
  }
];

function stripCdata(value: string) {
  return value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(value = "") {
  return decodeEntities(
    stripCdata(value)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function readTag(block: string, tag: string) {
  const match = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i")
  );
  return match?.[1]?.trim() ?? "";
}

function parseRss(xml: string): FeedItem[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return blocks
    .map((block) => {
      const title = cleanText(readTag(block, "title"));
      const link = cleanText(readTag(block, "link"));
      const published =
        cleanText(readTag(block, "pubDate")) ||
        cleanText(readTag(block, "dc:date"));
      const description =
        cleanText(readTag(block, "description")) ||
        cleanText(readTag(block, "summary"));

      return {
        title,
        link,
        published: published || undefined,
        description: description || undefined
      };
    })
    .filter((item) => item.title && /^https?:\/\//i.test(item.link));
}

function decodeUrl(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");
}

function pickBestVideo(urls: string[]) {
  const clean = [...new Set(urls.map(decodeUrl))];
  return (
    clean.find((url) => /_480p\.mp4/i.test(url)) ??
    clean.find((url) => /_360p\.mp4/i.test(url)) ??
    clean.find((url) => /_720p\.mp4/i.test(url)) ??
    clean.find((url) => /\.mp4(?:\?|$)/i.test(url))
  );
}

function pickBestAudio(urls: string[]) {
  const clean = [...new Set(urls.map(decodeUrl))];
  return (
    clean.find((url) => /_hq\.mp3/i.test(url)) ??
    clean.find((url) => /128/i.test(url)) ??
    clean.find((url) => /\.mp3(?:\?|$)/i.test(url))
  );
}

async function resolveMedia(item: FeedItem): Promise<FeedItem> {
  try {
    const response = await fetch(item.link, {
      headers: {
        "User-Agent": "Family-Schedule-Hub/1.0"
      },
      next: { revalidate: 86400 }
    });

    if (!response.ok) return item;

    const html = await response.text();

    const videoUrls =
      html.match(
        /https:\/\/voa-video-[^"'\\s<>]+?\.mp4(?:\?[^"'\\s<>]*)?/gi
      ) ?? [];

    const audioUrls =
      html.match(
        /https:\/\/voa-audio[^"'\\s<>]+?\.mp3(?:\?[^"'\\s<>]*)?/gi
      ) ?? [];

    const videoUrl = pickBestVideo(videoUrls);
    if (videoUrl) {
      return {
        ...item,
        mediaUrl: videoUrl,
        mediaType: "video"
      };
    }

    const audioUrl = pickBestAudio(audioUrls);
    if (audioUrl) {
      return {
        ...item,
        mediaUrl: audioUrl,
        mediaType: "audio"
      };
    }

    return item;
  } catch {
    return item;
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

async function loadSource(source: SourceConfig) {
  try {
    const response = await fetch(source.feed, {
      headers: {
        "User-Agent": "Family-Schedule-Hub/1.0"
      },
      next: { revalidate: 21600 }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRss(xml).slice(0, 20);

    if (!items.length) {
      throw new Error("No RSS items");
    }

    return {
      source,
      items,
      live: true
    };
  } catch {
    return {
      source,
      items: [
        {
          title: source.fallbackTitle,
          link: source.fallbackUrl,
          description: "Open the official VOA Learning English page."
        }
      ],
      live: false
    };
  }
}

export async function GET() {
  const dayKey = tokyoDayKey();
  const seed = daySeed(dayKey);

  const loaded = await Promise.all(SOURCES.map(loadSource));

  const byId = Object.fromEntries(
    loaded.map((entry) => [entry.source.id, entry])
  );

  // News sources are already frequently refreshed, so prefer their newest item.
  const mainNews = byId["as-it-is"].items[0];
  const shortNews = byId["voa60"].items[0];

  // Learning-video feeds may not publish every day. Rotate through recent items
  // so the meal page still presents a different item each Japanese calendar day.
  const easyVideos = byId["english-minute"].items;
  const normalVideos = byId["level2"].items;

  const easyVideo = easyVideos[seed % Math.min(easyVideos.length, 14)];
  const normalVideo =
    normalVideos[(seed + 5) % Math.min(normalVideos.length, 14)];

  const [
    resolvedMainNews,
    resolvedShortNews,
    resolvedEasyVideo,
    resolvedNormalVideo
  ] = await Promise.all([
    resolveMedia(mainNews),
    resolveMedia(shortNews),
    resolveMedia(easyVideo),
    resolveMedia(normalVideo)
  ]);

  const response = NextResponse.json({
    ok: true,
    dayKey,
    updatedAt: new Date().toISOString(),
    picks: {
      mainNews: {
        ...resolvedMainNews,
        source: byId["as-it-is"].source.label,
        level: byId["as-it-is"].source.level,
        minutes: "5–8 min",
        live: byId["as-it-is"].live
      },
      shortNews: {
        ...resolvedShortNews,
        source: byId["voa60"].source.label,
        level: byId["voa60"].source.level,
        minutes: "1–3 min",
        live: byId["voa60"].live
      },
      easyVideo: {
        ...resolvedEasyVideo,
        source: byId["english-minute"].source.label,
        level: byId["english-minute"].source.level,
        minutes: "1–3 min",
        live: byId["english-minute"].live
      },
      normalVideo: {
        ...resolvedNormalVideo,
        source: byId["level2"].source.label,
        level: byId["level2"].source.level,
        minutes: "5–8 min",
        live: byId["level2"].live
      }
    }
  });

  response.headers.set(
    "Cache-Control",
    "public, s-maxage=21600, stale-while-revalidate=86400"
  );

  return response;
}
