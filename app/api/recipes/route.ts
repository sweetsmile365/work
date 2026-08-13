import { NextResponse } from "next/server";

export const revalidate = 60 * 60 * 24 * 7;

const WEEK = 60 * 60 * 24 * 7;

type SeasonId = "spring" | "summer" | "autumn" | "winter";

type RakutenCategory = {
  categoryId?: string | number;
  categoryName?: string;
  parentCategoryId?: string | number;
};

type LiveRecipe = {
  id: string;
  title: string;
  description: string;
  materials: string[];
  indication?: string;
  imageUrl?: string;
  sourceUrl?: string;
  rank?: number;
  source: "Rakuten Recipe";
  score: number;
};

const seasonalProduce: Record<SeasonId, string[]> = {
  spring: [
    "春キャベツ",
    "キャベツ",
    "新玉ねぎ",
    "玉ねぎ",
    "アスパラガス",
    "アスパラ",
    "菜の花",
    "たけのこ",
    "新じゃが",
    "いちご",
    "あさり"
  ],
  summer: [
    "トマト",
    "なす",
    "きゅうり",
    "オクラ",
    "とうもろこし",
    "枝豆",
    "ピーマン",
    "大葉",
    "アジ"
  ],
  autumn: [
    "さつまいも",
    "かぼちゃ",
    "きのこ",
    "ごぼう",
    "れんこん",
    "栗",
    "柿",
    "さんま"
  ],
  winter: [
    "白菜",
    "大根",
    "長ねぎ",
    "ねぎ",
    "小松菜",
    "ブロッコリー",
    "かぶ",
    "みかん",
    "ぶり",
    "鮭"
  ]
};

const maffUrls: Record<SeasonId, string[]> = {
  spring: [
    "https://www.maff.go.jp/kanto/syo_an/seikatsu/shokuiku/ouchi/recipe.html",
    "https://www.maff.go.jp/kanto/syo_an/seikatsu/shokuiku/ouchi/index.html"
  ],
  summer: [
    "https://www.maff.go.jp/kanto/syo_an/seikatsu/shokuiku/ouchi/recipe2020summer.html",
    "https://www.maff.go.jp/kanto/syo_an/seikatsu/shokuiku/ouchi/recipe.html"
  ],
  autumn: [
    "https://www.maff.go.jp/kanto/syo_an/seikatsu/shokuiku/ouchi/recipe.html",
    "https://www.maff.go.jp/kanto/syo_an/seikatsu/shokuiku/ouchi/index.html"
  ],
  winter: [
    "https://www.maff.go.jp/kanto/syo_an/seikatsu/shokuiku/ouchi/recipe2020winter.html",
    "https://www.maff.go.jp/kanto/syo_an/seikatsu/shokuiku/ouchi/recipe.html"
  ]
};

const healthyCategoryWords = [
  "魚",
  "鮭",
  "さば",
  "鯖",
  "あじ",
  "アジ",
  "鶏",
  "豆",
  "豆腐",
  "野菜",
  "サラダ",
  "スープ",
  "トマト",
  "なす",
  "きゅうり",
  "オクラ",
  "ブロッコリー",
  "白菜",
  "大根",
  "きのこ",
  "れんこん",
  "かぼちゃ",
  "さつまいも"
];

const avoidWords = [
  "ケーキ",
  "クッキー",
  "チョコ",
  "アイス",
  "生クリーム",
  "ホイップ",
  "ドーナツ",
  "揚げ",
  "唐揚げ",
  "フライ",
  "天ぷら",
  "ベーコン",
  "ウインナー",
  "ソーセージ",
  "マヨネーズたっぷり"
];

const proteinWords = [
  "鮭",
  "サーモン",
  "鯖",
  "さば",
  "アジ",
  "あじ",
  "ぶり",
  "鱈",
  "たら",
  "鶏",
  "チキン",
  "豆腐",
  "豆",
  "ひよこ豆",
  "レンズ豆",
  "納豆",
  "えび",
  "エビ",
  "卵",
  "たまご"
];

function seasonForDate(date = new Date()): SeasonId {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchMaffSeasonalProduce(season: SeasonId) {
  const fallback = seasonalProduce[season];
  const detected = new Set<string>();
  let reached = false;

  for (const url of maffUrls[season]) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; FamilyScheduleHub/1.0; seasonal-food)"
        },
        next: { revalidate: WEEK },
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) continue;
      reached = true;

      const text = htmlToText(await response.text());
      fallback.forEach((item) => {
        if (text.includes(item)) detected.add(item);
      });
    } catch {
      // Keep the last successful Next.js Data Cache value when available,
      // otherwise continue to the local fallback.
    }
  }

  const current = Array.from(detected);
  const merged = [...current, ...fallback.filter((item) => !detected.has(item))];

  return {
    produce: merged.slice(0, 12),
    reached,
    source: "関東農政局"
  };
}

function credentials() {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID?.trim();
  const accessKey = process.env.RAKUTEN_ACCESS_KEY?.trim();

  return applicationId && accessKey
    ? { applicationId, accessKey }
    : null;
}

function commonRakutenParams(auth: {
  applicationId: string;
  accessKey: string;
}) {
  return new URLSearchParams({
    applicationId: auth.applicationId,
    accessKey: auth.accessKey,
    format: "json",
    formatVersion: "2"
  });
}

function normalizeCategoryPayload(payload: unknown): RakutenCategory[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;
  const result =
    root.result && typeof root.result === "object"
      ? (root.result as Record<string, unknown>)
      : root;

  const out: RakutenCategory[] = [];

  ["large", "medium", "small"].forEach((key) => {
    const value = result[key];

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === "object") {
          out.push(item as RakutenCategory);
        }
      });
      return;
    }

    if (value && typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach((item) => {
        if (Array.isArray(item)) {
          item.forEach((entry) => {
            if (entry && typeof entry === "object") {
              out.push(entry as RakutenCategory);
            }
          });
        } else if (item && typeof item === "object") {
          out.push(item as RakutenCategory);
        }
      });
    }
  });

  return out;
}

async function fetchRakutenCategories(auth: {
  applicationId: string;
  accessKey: string;
}) {
  const params = commonRakutenParams(auth);
  const response = await fetch(
    `https://openapi.rakuten.co.jp/recipems/api/Recipe/CategoryList/20170426?${params.toString()}`,
    {
      next: { revalidate: WEEK },
      signal: AbortSignal.timeout(8000)
    }
  );

  if (!response.ok) {
    throw new Error(`Rakuten CategoryList ${response.status}`);
  }

  return normalizeCategoryPayload(await response.json());
}

function categoryScore(category: RakutenCategory, produce: string[]) {
  const name = String(category.categoryName ?? "");
  if (!name) return -999;

  let score = 0;

  produce.forEach((item) => {
    const normalized = item
      .replace(/^春/, "")
      .replace(/^新/, "")
      .replace(/ガス$/, "");
    if (normalized.length >= 2 && name.includes(normalized)) score += 12;
  });

  healthyCategoryWords.forEach((word) => {
    if (name.includes(word)) score += 5;
  });

  avoidWords.forEach((word) => {
    if (name.includes(word)) score -= 20;
  });

  return score;
}

type RawRakutenRecipe = {
  recipeId?: number | string;
  recipeTitle?: string;
  recipeUrl?: string;
  foodImageUrl?: string;
  mediumImageUrl?: string;
  recipeDescription?: string;
  recipeMaterial?: string[];
  recipeIndication?: string;
  rank?: number;
};

function normalizeRankingPayload(payload: unknown): RawRakutenRecipe[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const result = root.result ?? root;

  if (Array.isArray(result)) {
    return result.filter(
      (item): item is RawRakutenRecipe =>
        Boolean(item) && typeof item === "object"
    );
  }

  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;

    for (const key of ["recipes", "items", "result"]) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value.filter(
          (item): item is RawRakutenRecipe =>
            Boolean(item) && typeof item === "object"
        );
      }
    }

    const values = Object.values(record).filter(
      (item) => Boolean(item) && typeof item === "object"
    );

    if (values.length > 0) {
      return values as RawRakutenRecipe[];
    }
  }

  return [];
}

async function fetchRanking(
  auth: { applicationId: string; accessKey: string },
  categoryId: string
) {
  const params = commonRakutenParams(auth);
  params.set("categoryId", categoryId);

  const response = await fetch(
    `https://openapi.rakuten.co.jp/recipems/api/Recipe/CategoryRanking/20170426?${params.toString()}`,
    {
      next: { revalidate: WEEK },
      signal: AbortSignal.timeout(8000)
    }
  );

  if (!response.ok) {
    throw new Error(`Rakuten CategoryRanking ${response.status}`);
  }

  return normalizeRankingPayload(await response.json());
}

function recipeScore(recipe: RawRakutenRecipe, produce: string[]) {
  const title = String(recipe.recipeTitle ?? "");
  const materials = Array.isArray(recipe.recipeMaterial)
    ? recipe.recipeMaterial.map(String)
    : [];
  const combined = `${title} ${materials.join(" ")}`;

  if (!title) return -999;

  let score = 40 - Math.min(Number(recipe.rank ?? 4), 4) * 2;

  produce.forEach((item) => {
    const normalized = item.replace(/^春/, "").replace(/^新/, "");
    if (normalized.length >= 2 && combined.includes(normalized)) score += 8;
  });

  proteinWords.forEach((word) => {
    if (combined.includes(word)) score += 4;
  });

  healthyCategoryWords.forEach((word) => {
    if (combined.includes(word)) score += 2;
  });

  avoidWords.forEach((word) => {
    if (combined.includes(word)) score -= 18;
  });

  if (
    combined.includes("オリーブオイル") ||
    combined.includes("レモン") ||
    combined.includes("豆")
  ) {
    score += 3;
  }

  return score;
}

function toLiveRecipe(
  recipe: RawRakutenRecipe,
  produce: string[]
): LiveRecipe | null {
  const title = String(recipe.recipeTitle ?? "").trim();
  if (!title) return null;

  const materials = Array.isArray(recipe.recipeMaterial)
    ? recipe.recipeMaterial.map(String).filter(Boolean)
    : [];

  const score = recipeScore(recipe, produce);
  if (score < 20) return null;

  return {
    id: String(recipe.recipeId ?? title),
    title,
    description:
      String(recipe.recipeDescription ?? "").trim() ||
      "楽天レシピの今週ランキングから、旬食材と健康寄りの条件で選んだ候補です。",
    materials,
    indication: String(recipe.recipeIndication ?? "").trim() || undefined,
    imageUrl:
      String(recipe.foodImageUrl ?? recipe.mediumImageUrl ?? "").trim() ||
      undefined,
    sourceUrl: String(recipe.recipeUrl ?? "").trim() || undefined,
    rank: Number(recipe.rank ?? 0) || undefined,
    source: "Rakuten Recipe",
    score
  };
}

async function fetchRakutenHealthyRecipes(
  season: SeasonId,
  produce: string[]
): Promise<LiveRecipe[]> {
  const auth = credentials();
  if (!auth) return [];

  const categories = await fetchRakutenCategories(auth);

  const selectedCategories = categories
    .map((category) => ({
      category,
      score: categoryScore(category, produce)
    }))
    .filter(
      (entry) =>
        entry.score > 0 &&
        String(entry.category.categoryId ?? "").length > 0
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (selectedCategories.length === 0) {
    return [];
  }

  const settled = await Promise.allSettled(
    selectedCategories.map((entry) =>
      fetchRanking(auth, String(entry.category.categoryId))
    )
  );

  const seen = new Set<string>();
  const recipes: LiveRecipe[] = [];

  settled.forEach((result) => {
    if (result.status !== "fulfilled") return;

    result.value.forEach((raw) => {
      const recipe = toLiveRecipe(raw, produce);
      if (!recipe) return;

      const key = recipe.title.replace(/\s+/g, "");
      if (seen.has(key)) return;

      seen.add(key);
      recipes.push(recipe);
    });
  });

  return recipes
    .sort((a, b) => b.score - a.score || (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 12);
}

export async function GET() {
  const season = seasonForDate(new Date());
  const maff = await fetchMaffSeasonalProduce(season);

  let recipes: LiveRecipe[] = [];
  let rakutenReached = false;

  try {
    recipes = await fetchRakutenHealthyRecipes(season, maff.produce);
    rakutenReached = recipes.length > 0;
  } catch {
    recipes = [];
  }

  const rakutenConfigured = Boolean(credentials());

  return NextResponse.json(
    {
      season,
      seasonalProduce: maff.produce,
      liveRecipes: recipes,
      updatedAt: new Date().toISOString(),
      refresh: "weekly",
      sourceStatus: {
        maff: {
          configured: true,
          reached: maff.reached,
          label: "関東農政局"
        },
        rakutenRecipe: {
          configured: rakutenConfigured,
          reached: rakutenReached,
          label: "Rakuten Recipe"
        }
      },
      mode:
        rakutenConfigured && rakutenReached
          ? "live"
          : maff.reached
            ? "maff_plus_fallback"
            : "fallback"
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=604800, stale-while-revalidate=86400"
      }
    }
  );
}
