import { NextResponse } from "next/server";

export const revalidate = 60 * 60 * 24 * 7;

type CategoryId = "management" | "technology" | "junior";

type RankedBook = {
  rank: number;
  title: string;
};

type BookPick = {
  category: CategoryId;
  categoryLabel: string;
  title: string;
  rank?: number;
  reason: string;
  amazonUrl: string;
  source: string;
};

const WEEK = 60 * 60 * 24 * 7;

const sourceUrls: Record<CategoryId, string[]> = {
  management: [
    "https://www.amazon.co.jp/gp/bestsellers/books/492066",
    "https://abs.onjp.net/book/"
  ],
  technology: [
    "https://www.amazon.co.jp/gp/bestsellers/books/720370",
    "https://abs.onjp.net/book/"
  ],
  junior: ["https://abs.onjp.net/book/"]
};

const categoryLabels: Record<CategoryId, string> = {
  management: "MANAGEMENT",
  technology: "TECHNOLOGY",
  junior: "JUNIOR HIGH"
};

const reasons: Record<CategoryId, string> = {
  management: "経営・組織・仕事の視点",
  technology: "AI・科学・テクノロジー",
  junior: "中学生にすすめたい一般読書"
};

const commonExcluded = [
  "コミック",
  "漫画",
  "マンガ",
  "写真集",
  "フォトブック",
  "フォトエッセイ",
  "グラビア",
  "ヌード",
  "成人",
  "18禁",
  "アダルト",
  "官能",
  "BLコミック",
  "TLコミック",
  "画集",
  "ビジュアルブック",
  "ビジュアルコレクション",
  "雑誌",
  "月号",
  "週刊",
  "MOOK",
  "ムック",
  "カレンダー",
  "ポスター",
  "付録"
];

const juniorExcluded = [
  ...commonExcluded,
  "問題集",
  "参考書",
  "教科書",
  "ドリル",
  "ワーク",
  "受験",
  "入試",
  "過去問",
  "英単語",
  "英熟語",
  "TOEIC",
  "TOEFL",
  "英検",
  "資格",
  "検定",
  "テスト対策",
  "合格",
  "ITパスポート",
  "公式ガイドブック",
  "攻略本"
];

const managementKeywords = [
  "経営",
  "マネジメント",
  "リーダー",
  "組織",
  "戦略",
  "ビジネス",
  "仕事",
  "働き方",
  "企業",
  "マーケティング",
  "交渉",
  "意思決定",
  "生産性",
  "チーム",
  "人材",
  "キャリア"
];

const technologyKeywords = [
  "AI",
  "人工知能",
  "ChatGPT",
  "生成AI",
  "LLM",
  "テクノロジー",
  "科学",
  "宇宙",
  "データ",
  "プログラミング",
  "コンピュータ",
  "IT",
  "ロボット",
  "量子",
  "脳",
  "数学",
  "エンジニア"
];

const juniorPositiveKeywords = [
  "10代",
  "中学生",
  "子ども",
  "こども",
  "教養",
  "世界",
  "日本",
  "歴史",
  "科学",
  "宇宙",
  "生物",
  "生き物",
  "謎",
  "物語",
  "小説",
  "文庫",
  "未来",
  "社会",
  "哲学",
  "地理",
  "自然",
  "読解",
  "思考"
];

const fallback: Record<CategoryId, BookPick> = {
  management: {
    category: "management",
    categoryLabel: "MANAGEMENT",
    title: "リーダーの仮面",
    reason: "経営・組織・仕事の視点",
    amazonUrl:
      "https://www.amazon.co.jp/s?k=%E3%83%AA%E3%83%BC%E3%83%80%E3%83%BC%E3%81%AE%E4%BB%AE%E9%9D%A2&i=stripbooks",
    source: "fallback"
  },
  technology: {
    category: "technology",
    categoryLabel: "TECHNOLOGY",
    title: "生成AIで世界はこう変わる",
    reason: "AI・科学・テクノロジー",
    amazonUrl:
      "https://www.amazon.co.jp/s?k=%E7%94%9F%E6%88%90AI%E3%81%A7%E4%B8%96%E7%95%8C%E3%81%AF%E3%81%93%E3%81%86%E5%A4%89%E3%82%8F%E3%82%8B&i=stripbooks",
    source: "fallback"
  },
  junior: {
    category: "junior",
    categoryLabel: "JUNIOR HIGH",
    title: "大人も知らないみのまわりの謎大全",
    reason: "中学生にすすめたい一般読書",
    amazonUrl:
      "https://www.amazon.co.jp/s?k=%E5%A4%A7%E4%BA%BA%E3%82%82%E7%9F%A5%E3%82%89%E3%81%AA%E3%81%84%E3%81%BF%E3%81%AE%E3%81%BE%E3%82%8F%E3%82%8A%E3%81%AE%E8%AC%8E%E5%A4%A7%E5%85%A8&i=stripbooks",
    source: "fallback"
  }
};

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h\d)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n");
}

function cleanTitle(value: string) {
  return value
    .replace(/^#\d+\s*/, "")
    .replace(/￥[\d,]+.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoiseLine(line: string) {
  if (!line) return true;
  if (/^#?\d+$/.test(line)) return true;
  if (/^[¥￥][\d,]+/.test(line)) return true;
  if (/^\d+個の商品/.test(line)) return true;
  if (/^\d+点の利用可能/.test(line)) return true;
  if (/^(Kindle版|単行本|新書|文庫|ハードカバー|ペーパーバック)/.test(line))
    return true;
  if (/^(Image|すべてのカテゴリー|本$|Books$)/i.test(line)) return true;
  return false;
}

function extractRankedBooks(html: string): RankedBook[] {
  const text = htmlToText(html);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const books: RankedBook[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    const inline = line.match(/^#(\d{1,3})\s*(.+)$/);
    if (inline) {
      const rank = Number(inline[1]);
      const title = cleanTitle(inline[2]);
      if (title.length >= 2 && !seen.has(title)) {
        seen.add(title);
        books.push({ rank, title });
      }
      continue;
    }

    const rankOnly = line.match(/^(?:\d+\.\s*)?#(\d{1,3})$/);
    if (!rankOnly) continue;

    const rank = Number(rankOnly[1]);
    for (let offset = 1; offset <= 8; offset += 1) {
      const candidate = cleanTitle(lines[index + offset] ?? "");
      if (candidate.length < 2 || isNoiseLine(candidate)) continue;
      if (!seen.has(candidate)) {
        seen.add(candidate);
        books.push({ rank, title: candidate });
      }
      break;
    }
  }

  return books
    .filter((book) => book.rank >= 1 && book.rank <= 100)
    .sort((a, b) => a.rank - b.rank);
}

function hasAny(title: string, words: string[]) {
  const lower = title.toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

function allowedForCategory(book: RankedBook, category: CategoryId) {
  if (hasAny(book.title, commonExcluded)) return false;

  if (category === "management") {
    return hasAny(book.title, managementKeywords);
  }

  if (category === "technology") {
    if (hasAny(book.title, ["試験", "合格", "資格", "検定", "問題集"])) {
      return false;
    }
    return hasAny(book.title, technologyKeywords);
  }

  if (hasAny(book.title, juniorExcluded)) return false;
  return hasAny(book.title, juniorPositiveKeywords);
}

function toPick(book: RankedBook, category: CategoryId, source: string): BookPick {
  const amazonUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(
    book.title
  )}&i=stripbooks`;

  return {
    category,
    categoryLabel: categoryLabels[category],
    title: book.title,
    rank: book.rank,
    reason: reasons[category],
    amazonUrl,
    source
  };
}

async function fetchRanked(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; FamilyScheduleHub/1.0; +https://vercel.app)",
      "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.7"
    },
    next: { revalidate: WEEK },
    signal: AbortSignal.timeout(9000)
  });

  if (!response.ok) {
    throw new Error(`source ${response.status}`);
  }

  return extractRankedBooks(await response.text());
}

async function pickCategory(category: CategoryId): Promise<BookPick> {
  for (const url of sourceUrls[category]) {
    try {
      const books = await fetchRanked(url);
      const candidate = books.find((book) => allowedForCategory(book, category));
      if (candidate) {
        return toPick(
          candidate,
          category,
          url.includes("amazon.co.jp") ? "Amazon JP" : "Amazon JP mirror"
        );
      }
    } catch {
      // Try the next source. The endpoint always has a safe fallback.
    }
  }

  return fallback[category];
}

export async function GET() {
  const categories: CategoryId[] = ["management", "technology", "junior"];
  const picks = await Promise.all(categories.map(pickCategory));

  return NextResponse.json(
    {
      picks,
      updatedAt: new Date().toISOString(),
      refresh: "weekly",
      filters: {
        excluded: "manga, photo books, adult content",
        juniorExcluded: "test-prep, workbooks, reference books"
      }
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=604800, stale-while-revalidate=86400"
      }
    }
  );
}
