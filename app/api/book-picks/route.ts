import { NextResponse } from "next/server";

export const revalidate = 60 * 60 * 24 * 7;

type CategoryId =
  | "management"
  | "technology"
  | "junior"
  | "chinaManagement"
  | "chinaReading";

type MarketId = "JP" | "CN";

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
  source: string;
  market: MarketId;
  author?: string;
  description: string;
  coverUrl?: string;
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
  junior: ["https://abs.onjp.net/book/"],

  // 中国网站：京东优先，当当作为备用来源。
  chinaManagement: [
    "https://www.jd.com/phb/key_1713f4b5e72b629fff21.html",
    "https://www.jd.com/phb/key_17131817db3796adf994.html",
    "https://bang.dangdang.com/books/bestsellers/01.22.00.00.00.00-recent30-0-0-2-1"
  ],
  chinaReading: [
    "https://www.jd.com/phb/key_1713f07cb428207b7b50.html",
    "https://www.jd.com/phb/key_1713ebabe31f1eea022a.html",
    "https://bang.dangdang.com/books/bestsellers/01.41.00.00.00.00-recent30-0-0-1-1"
  ]
};

const categoryLabels: Record<CategoryId, string> = {
  management: "JP · MANAGEMENT",
  technology: "JP · TECHNOLOGY",
  junior: "JP · JUNIOR",
  chinaManagement: "CN · 管理/科技",
  chinaReading: "CN · 中文阅读"
};

const reasons: Record<CategoryId, string> = {
  management: "経営・組織・仕事の視点",
  technology: "AI・科学・テクノロジー",
  junior: "中学生にすすめたい一般読書",
  chinaManagement: "中国热榜 · 管理・商业・科技",
  chinaReading: "中国热榜 · 小说・文学・人文・科普"
};

const japaneseExcluded = [
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
  "雑誌",
  "月号",
  "週刊",
  "MOOK",
  "ムック",
  "カレンダー",
  "ポスター",
  "付録"
];

const japaneseJuniorExcluded = [
  ...japaneseExcluded,
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

const chineseExcluded = [
  "漫画",
  "写真集",
  "写真册",
  "摄影集",
  "写真",
  "成人",
  "18禁",
  "情色",
  "色情",
  "裸",
  "杂志",
  "期刊",
  "月刊",
  "周刊",
  "画册",
  "海报",
  "挂历",
  "日历"
];

const chineseReadingExcluded = [
  ...chineseExcluded,
  "教材",
  "教辅",
  "配套教材",
  "同步练习",
  "必背",
  "必刷",
  "题库",
  "题集",
  "试题",
  "练习册",
  "练习题",
  "中考",
  "高考",
  "考试",
  "考点",
  "冲刺",
  "提分",
  "复习资料",
  "预习资料",
  "答案解析",
  "辅导书",
  "课本",
  "字帖",
  "作文模板",
  "资格考试",
  "考证"
];

const japaneseManagementKeywords = [
  "経営",
  "マネジメント",
  "リーダー",
  "組織",
  "戦略",
  "ビジネス",
  "仕事",
  "企業",
  "マーケティング",
  "交渉",
  "意思決定",
  "生産性",
  "チーム",
  "人材",
  "キャリア"
];

const japaneseTechnologyKeywords = [
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

const japaneseJuniorKeywords = [
  "10代",
  "中学生",
  "子ども",
  "こども",
  "教養",
  "世界",
  "歴史",
  "科学",
  "宇宙",
  "生物",
  "謎",
  "物語",
  "小説",
  "文庫",
  "未来",
  "社会",
  "哲学",
  "地理",
  "自然",
  "思考"
];

const chineseManagementKeywords = [
  "管理",
  "管理者",
  "领导",
  "组织",
  "战略",
  "商业",
  "企业",
  "经营",
  "经济",
  "投资",
  "行业",
  "创新",
  "决策",
  "系统",
  "数据",
  "科技",
  "人工智能",
  "生成AI",
  "AI",
  "华为",
  "刘润",
  "CEO"
];

const chineseReadingKeywords = [
  "中学生",
  "青少年",
  "课外阅读",
  "文学",
  "小说",
  "成长",
  "名著",
  "科普",
  "科学",
  "百科",
  "地理",
  "历史",
  "中国",
  "宇宙",
  "自然",
  "生物",
  "化学",
  "物理",
  "人文",
  "博物",
  "世界",
  "传记"
];


const fallbackDescriptions: Record<CategoryId, string> = {
  management:
    "从经营、组织与决策的角度理解管理，适合希望建立管理框架和工作方法的人阅读。",
  technology:
    "围绕AI、科学与技术变化，帮助快速理解科技趋势以及它们对工作和社会的影响。",
  junior:
    "适合中学生拓展视野的通识读物，兼顾知识性、可读性和独立思考。",
  chinaManagement:
    "来自中国图书榜单的管理与科技候选，重点关注商业、组织、决策和技术变化。",
  chinaReading:
    "适合中学生及家庭阅读的中文作品，优先小说、文学、人文、历史和科普。"
};

function shortText(value: string, max = 150) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

const fallback: Record<CategoryId, BookPick> = {
  management: {
    category: "management",
    categoryLabel: categoryLabels.management,
    title: "リーダーの仮面",
    reason: reasons.management,
    source: "fallback",
    market: "JP",
    description:
      "管理者が「何をするか」より「何をしないか」に注目し、チームを動かすための考え方を整理したビジネス書。"
  },
  technology: {
    category: "technology",
    categoryLabel: categoryLabels.technology,
    title: "生成AIで世界はこう変わる",
    reason: reasons.technology,
    source: "fallback",
    market: "JP",
    description:
      "生成AIが仕事、教育、社会にどのような変化をもたらすのかを考えるための入門書。"
  },
  junior: {
    category: "junior",
    categoryLabel: categoryLabels.junior,
    title: "大人も知らないみのまわりの謎大全",
    reason: reasons.junior,
    source: "fallback",
    market: "JP",
    description:
      "身近な疑問を入口に、科学や社会の仕組みを楽しく知ることができる中学生向けの読み物。"
  },
  chinaManagement: {
    category: "chinaManagement",
    categoryLabel: categoryLabels.chinaManagement,
    title: "关键跃升：新任管理者成事的底层逻辑",
    reason: reasons.chinaManagement,
    source: "京东 fallback",
    market: "CN",
    author: "刘润",
    description:
      "面向新任管理者，讨论从个人贡献者转向管理角色时，如何带团队、做决策并推动事情真正落地。"
  },
  chinaReading: {
    category: "chinaReading",
    categoryLabel: categoryLabels.chinaReading,
    title: "布鲁克林有棵树",
    reason: "成长小说 · 中文阅读",
    source: "京东 fallback",
    market: "CN",
    author: "贝蒂·史密斯",
    description:
      "一部经典成长小说，讲述女孩弗兰茜在贫困环境中坚持阅读、学习并逐渐形成独立人格的故事。"
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
      .replace(/<(br|\/p|\/div|\/li|\/h\d|\/a)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n");
}

function cleanTitle(value: string) {
  return value
    .replace(/^TOP\s*/i, "")
    .replace(/^#?\d{1,3}[.)、]?\s*/, "")
    .replace(/[¥￥]\s*[\d,.]+.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoiseLine(line: string) {
  if (!line) return true;
  if (/^TOP$/i.test(line)) return true;
  if (/^#?\d{1,3}[.)、]?$/.test(line)) return true;
  if (/^[¥￥]/.test(line)) return true;
  if (/^(Image|排名|热卖商品|热门点评晒单|加入购物车|购买|收藏)$/i.test(line))
    return true;
  if (/^(已有|30日售出|7日售出|榜首|前三|破损包退换|7天价保)/.test(line))
    return true;
  if (/^\d+個の商品/.test(line)) return true;
  if (/^\d+点の利用可能/.test(line)) return true;
  if (/^(Kindle版|単行本|新書|文庫|ハードカバー|ペーパーバック)/.test(line))
    return true;
  if (/^(すべてのカテゴリー|本$|Books$)/i.test(line)) return true;
  return false;
}

function findCandidate(lines: string[], start: number) {
  for (let offset = 0; offset <= 10; offset += 1) {
    const candidate = cleanTitle(lines[start + offset] ?? "");
    if (candidate.length < 2 || isNoiseLine(candidate)) continue;
    return candidate;
  }
  return "";
}

function extractRankedBooks(html: string): RankedBook[] {
  const lines = htmlToText(html)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const books: RankedBook[] = [];
  const seen = new Set<string>();

  const add = (rank: number, rawTitle: string) => {
    const title = cleanTitle(rawTitle);
    if (
      !Number.isFinite(rank) ||
      rank < 1 ||
      rank > 100 ||
      title.length < 2 ||
      isNoiseLine(title) ||
      seen.has(title)
    ) {
      return;
    }
    seen.add(title);
    books.push({ rank, title });
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    const hashInline = line.match(/^#(\d{1,3})\s+(.+)$/);
    if (hashInline) {
      add(Number(hashInline[1]), hashInline[2]);
      continue;
    }

    const numericInline = line.match(/^(\d{1,3})[.)、]\s+(.+)$/);
    if (numericInline) {
      add(Number(numericInline[1]), numericInline[2]);
      continue;
    }

    if (
      /^TOP$/i.test(line) &&
      /^\d{1,3}$/.test(lines[index + 1] ?? "")
    ) {
      add(Number(lines[index + 1]), findCandidate(lines, index + 2));
      continue;
    }

    if (
      /^\d{1,3}$/.test(line) &&
      /^TOP$/i.test(lines[index - 1] ?? "")
    ) {
      add(Number(line), findCandidate(lines, index + 1));
      continue;
    }

    const numericOnly = line.match(/^(\d{1,3})[.)]$/);
    if (numericOnly) {
      add(Number(numericOnly[1]), findCandidate(lines, index + 1));
    }
  }

  return books.sort((a, b) => a.rank - b.rank);
}

function hasAny(title: string, words: string[]) {
  const lower = title.toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

function allowedForCategory(book: RankedBook, category: CategoryId) {
  if (category === "management") {
    return (
      !hasAny(book.title, japaneseExcluded) &&
      hasAny(book.title, japaneseManagementKeywords)
    );
  }

  if (category === "technology") {
    return (
      !hasAny(book.title, japaneseExcluded) &&
      !hasAny(book.title, ["試験", "合格", "資格", "検定", "問題集"]) &&
      hasAny(book.title, japaneseTechnologyKeywords)
    );
  }

  if (category === "junior") {
    return (
      !hasAny(book.title, japaneseJuniorExcluded) &&
      hasAny(book.title, japaneseJuniorKeywords)
    );
  }

  if (category === "chinaManagement") {
    return (
      !hasAny(book.title, chineseExcluded) &&
      !hasAny(book.title, ["教材", "考试", "题库", "资格", "考证"]) &&
      hasAny(book.title, chineseManagementKeywords)
    );
  }

  return (
    !hasAny(book.title, chineseReadingExcluded) &&
    hasAny(book.title, chineseReadingKeywords)
  );
}

function chinaScore(book: RankedBook, category: CategoryId) {
  // 畅销度是候选信号，适合家庭阅读比“单纯排名第一”更重要。
  let score = 30 - Math.min(book.rank, 30) * 0.6;
  const title = book.title;

  if (category === "chinaManagement") {
    ["管理者", "组织", "战略", "AI", "人工智能", "科技", "创新", "刘润", "华为"].forEach(
      (word) => {
        if (title.toLowerCase().includes(word.toLowerCase())) score += 5;
      }
    );
  }

  if (category === "chinaReading") {
    ["小说", "文学", "成长", "历史", "地理", "科学", "人文", "传记"].forEach(
      (word) => {
        if (title.includes(word)) score += 5;
      }
    );

    if (title.includes("青少年") || title.includes("中学生")) score += 3;

    // 更偏向中学生，而不是低龄儿童。
    if (hasAny(title, ["幼儿", "小学生版", "6-12岁", "绘本"])) score -= 7;
  }

  return score;
}

function marketForCategory(category: CategoryId): MarketId {
  return category === "chinaManagement" || category === "chinaReading"
    ? "CN"
    : "JP";
}

function toPick(
  book: RankedBook,
  category: CategoryId,
  source: string
): BookPick {
  return {
    category,
    categoryLabel: categoryLabels[category],
    title: book.title,
    rank: book.rank,
    reason: reasons[category],
    source,
    market: marketForCategory(category),
    description: fallbackDescriptions[category]
  };
}

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_sentence?: string | string[];
  subtitle?: string;
};

async function enrichBookMetadata(book: BookPick): Promise<BookPick> {
  try {
    const params = new URLSearchParams({
      title: book.title,
      limit: "5",
      fields: "key,title,author_name,cover_i,first_sentence,subtitle"
    });

    const response = await fetch(
      `https://openlibrary.org/search.json?${params.toString()}`,
      {
        headers: {
          "User-Agent":
            "FamilyScheduleHub/1.0 (weekly book metadata lookup)"
        },
        next: { revalidate: WEEK },
        signal: AbortSignal.timeout(6500)
      }
    );

    if (!response.ok) return book;

    const payload = (await response.json()) as {
      docs?: OpenLibraryDoc[];
    };

    const docs = Array.isArray(payload.docs) ? payload.docs : [];
    const normalize = (value: string) =>
      value
        .replace(/[（(].*?[）)]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();

    const normalizedTitle = normalize(book.title);

    const matched =
      docs.find((doc) => {
        const candidate = normalize(doc.title ?? "");
        return (
          candidate === normalizedTitle ||
          (candidate.length > 2 && candidate.includes(normalizedTitle)) ||
          (normalizedTitle.length > 2 && normalizedTitle.includes(candidate))
        );
      }) ??
      docs.find((doc) => Boolean(doc.cover_i)) ??
      docs[0];

    if (!matched) return book;

    const sentence = Array.isArray(matched.first_sentence)
      ? matched.first_sentence[0]
      : matched.first_sentence;

    return {
      ...book,
      author:
        matched.author_name?.slice(0, 2).join(" / ") || book.author,
      description: shortText(
        sentence || matched.subtitle || book.description
      ),
      coverUrl: matched.cover_i
        ? `https://covers.openlibrary.org/b/id/${matched.cover_i}-M.jpg`
        : book.coverUrl
    };
  } catch {
    return book;
  }
}

async function fetchRanked(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; FamilyScheduleHub/1.0; +https://vercel.app)",
      "Accept-Language":
        url.includes("jd.com") || url.includes("dangdang.com")
          ? "zh-CN,zh;q=0.9,en;q=0.6"
          : "ja-JP,ja;q=0.9,en;q=0.7"
    },
    next: { revalidate: WEEK },
    signal: AbortSignal.timeout(9000)
  });

  if (!response.ok) {
    throw new Error(`source ${response.status}`);
  }

  return extractRankedBooks(await response.text());
}

function sourceLabel(url: string) {
  if (url.includes("jd.com")) return "京东";
  if (url.includes("dangdang.com")) return "当当";
  if (url.includes("amazon.co.jp")) return "Amazon JP";
  return "Amazon JP mirror";
}

async function pickCategory(category: CategoryId): Promise<BookPick> {
  for (const url of sourceUrls[category]) {
    try {
      const books = await fetchRanked(url);
      const allowed = books.filter((book) =>
        allowedForCategory(book, category)
      );

      if (allowed.length === 0) continue;

      const candidate =
        category === "chinaManagement" || category === "chinaReading"
          ? [...allowed].sort(
              (a, b) =>
                chinaScore(b, category) - chinaScore(a, category) ||
                a.rank - b.rank
            )[0]
          : allowed[0];

      if (candidate) {
        return toPick(candidate, category, sourceLabel(url));
      }
    } catch {
      // Try next source.
    }
  }

  return fallback[category];
}

export async function GET() {
  const categories: CategoryId[] = [
    "management",
    "technology",
    "junior",
    "chinaManagement",
    "chinaReading"
  ];

  const selected = await Promise.all(categories.map(pickCategory));
  const picks = await Promise.all(selected.map(enrichBookMetadata));

  return NextResponse.json(
    {
      picks,
      updatedAt: new Date().toISOString(),
      refresh: "weekly",
      filters: {
        excluded:
          "manga/comics, photo books, adult content, magazines",
        juniorExcluded:
          "test-prep, workbooks, textbooks, reference books",
        chinaReading:
          "novels and literature allowed; test-prep and low-value teaching aids excluded",
        chinaSources:
          "JD.com primary, Dangdang.com fallback"
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
