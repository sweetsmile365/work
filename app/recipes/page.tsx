"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChefHat,
  Clock3,
  ExternalLink,
  Fish,
  Home,
  Leaf,
  RefreshCw,
  Salad,
  ShoppingBasket
} from "lucide-react";

type SeasonId = "spring" | "summer" | "autumn" | "winter";
type StyleTag = "JP" | "CN" | "MED" | "FUSION";

type Meal = {
  id: string;
  title: string;
  subtitle: string;
  style: StyleTag;
  time: number;
  protein: string;
  vegetables: string[];
  pantry: string[];
  steps: string[];
  health: string;
  live?: boolean;
  imageUrl?: string;
  sourceUrl?: string;
  source?: string;
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

type RecipeApiResponse = {
  season?: SeasonId;
  seasonalProduce?: string[];
  liveRecipes?: LiveRecipe[];
  updatedAt?: string;
  refresh?: "weekly";
  mode?: "live" | "maff_plus_fallback" | "fallback";
  sourceStatus?: {
    maff?: {
      configured?: boolean;
      reached?: boolean;
      label?: string;
    };
    rakutenRecipe?: {
      configured?: boolean;
      reached?: boolean;
      label?: string;
    };
  };
};

const seasonMeta: Record<
  SeasonId,
  {
    label: string;
    ja: string;
    zh: string;
    produce: string[];
    note: string;
  }
> = {
  spring: {
    label: "SPRING",
    ja: "春",
    zh: "春季",
    produce: [
      "春キャベツ",
      "新玉ねぎ",
      "アスパラ",
      "菜の花",
      "新じゃが",
      "いちご"
    ],
    note: "绿色蔬菜、豆类、鱼类、清淡调味"
  },
  summer: {
    label: "SUMMER",
    ja: "夏",
    zh: "夏季",
    produce: [
      "トマト",
      "なす",
      "きゅうり",
      "オクラ",
      "とうもろこし",
      "枝豆",
      "ピーマン"
    ],
    note: "清爽、多蔬菜、鱼类与豆类"
  },
  autumn: {
    label: "AUTUMN",
    ja: "秋",
    zh: "秋季",
    produce: [
      "かぼちゃ",
      "さつまいも",
      "きのこ",
      "ごぼう",
      "れんこん",
      "りんご",
      "柿"
    ],
    note: "根菜、菌菇、秋鱼与全谷物"
  },
  winter: {
    label: "WINTER",
    ja: "冬",
    zh: "冬季",
    produce: [
      "白菜",
      "大根",
      "長ねぎ",
      "小松菜",
      "ブロッコリー",
      "かぶ",
      "みかん"
    ],
    note: "温热汤菜、豆类、鱼类和深色蔬菜"
  }
};

function seasonForDate(date = new Date()): SeasonId {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function weekIndex(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.floor((days + start.getDay()) / 7);
}

function styleLabel(style: StyleTag) {
  if (style === "JP") return "和風";
  if (style === "CN") return "中式";
  if (style === "MED") return "Mediterranean";
  return "Fusion";
}

const meals: Record<SeasonId, Meal[]> = {
  spring: [
    {
      id: "sp-salmon",
      title: "鯛と春キャベツのレモン蒸し",
      subtitle: "鲷鱼 × 春卷心菜 × 新洋葱",
      style: "FUSION",
      time: 25,
      protein: "鯛 / 白身魚",
      vegetables: ["春キャベツ", "新玉ねぎ", "アスパラ"],
      pantry: ["オリーブオイル", "レモン", "黒こしょう"],
      steps: [
        "鱼和蔬菜铺入锅中。",
        "加入少量水，盖盖蒸熟。",
        "出锅后加橄榄油、柠檬和黑胡椒。"
      ],
      health: "鱼类 + 春季蔬菜 + 橄榄油，盐尽量少。"
    },
    {
      id: "sp-chicken",
      title: "芦笋鸡胸肉轻炒",
      subtitle: "芦笋 × 鸡胸 × 新洋葱",
      style: "CN",
      time: 20,
      protein: "鶏むね肉",
      vegetables: ["アスパラ", "新玉ねぎ", "菜の花"],
      pantry: ["生姜", "オリーブオイル", "醤油少量"],
      steps: [
        "鸡胸切片，蔬菜切段。",
        "少量橄榄油快速翻炒。",
        "只用少量酱油调味。"
      ],
      health: "保持中式熟悉口味，同时减少油盐。"
    },
    {
      id: "sp-beans",
      title: "菜の花・豆・ツナの春サラダ",
      subtitle: "油菜花 × 豆类 × 金枪鱼",
      style: "JP",
      time: 15,
      protein: "ツナ / ミックスビーンズ",
      vegetables: ["菜の花", "春キャベツ", "新玉ねぎ"],
      pantry: ["オリーブオイル", "酢", "粒マスタード"],
      steps: [
        "菜花焯熟后冷却。",
        "与豆类、金枪鱼和新洋葱混合。",
        "橄榄油和醋简单调味。"
      ],
      health: "豆类和鱼类一起补充蛋白质与纤维。"
    },
    {
      id: "sp-bean-stew",
      title: "春野菜と白いんげん豆の煮込み",
      subtitle: "春季蔬菜 × 白芸豆",
      style: "MED",
      time: 30,
      protein: "白いんげん豆",
      vegetables: ["春キャベツ", "新玉ねぎ", "アスパラ"],
      pantry: ["トマト缶", "オリーブオイル", "にんにく"],
      steps: [
        "洋葱和蒜轻炒。",
        "加入蔬菜、白芸豆和番茄。",
        "小火炖至蔬菜变软。"
      ],
      health: "一周安排一次植物性蛋白主餐。"
    },
    {
      id: "sp-potato",
      title: "新じゃが・卵・豆の地中海ボウル",
      subtitle: "新土豆 × 鸡蛋 × 豆",
      style: "FUSION",
      time: 20,
      protein: "卵 / 豆",
      vegetables: ["新じゃが", "アスパラ", "新玉ねぎ"],
      pantry: ["オリーブオイル", "酢", "ハーブ"],
      steps: [
        "新土豆蒸熟。",
        "鸡蛋煮熟。",
        "与豆类和蔬菜放入一碗，少量橄榄油调味。"
      ],
      health: "简单一碗餐，注意土豆份量，不额外配大量白米饭。"
    },
    {
      id: "sp-shrimp",
      title: "虾仁芦笋香菇快炒",
      subtitle: "虾仁 × 芦笋 × 香菇",
      style: "CN",
      time: 18,
      protein: "えび",
      vegetables: ["アスパラ", "きのこ", "新玉ねぎ"],
      pantry: ["生姜", "黒こしょう", "オリーブオイル"],
      steps: [
        "虾仁先快速煎熟。",
        "加入蔬菜快炒。",
        "用姜和黑胡椒代替重盐调味。"
      ],
      health: "中式快炒结构，但减少油盐。"
    },
    {
      id: "sp-lentil",
      title: "春キャベツとレンズ豆のスープ",
      subtitle: "春卷心菜 × 扁豆",
      style: "MED",
      time: 35,
      protein: "レンズ豆",
      vegetables: ["春キャベツ", "新玉ねぎ", "にんじん"],
      pantry: ["オリーブオイル", "にんにく", "クミン少量"],
      steps: [
        "蔬菜切块。",
        "加入扁豆和水煮熟。",
        "最后加少量橄榄油。"
      ],
      health: "高纤维植物蛋白，适合清淡晚餐。"
    }
  ],
  summer: [
    {
      id: "su-salmon",
      title: "鮭と夏野菜の地中海焼き",
      subtitle: "三文鱼 × 番茄 × 茄子 × 青椒",
      style: "FUSION",
      time: 25,
      protein: "鮭",
      vegetables: ["トマト", "なす", "ピーマン", "玉ねぎ"],
      pantry: ["オリーブオイル", "レモン", "にんにく", "黒こしょう"],
      steps: [
        "蔬菜切大块，与三文鱼一起铺入烤盘。",
        "加橄榄油、蒜和黑胡椒。",
        "烤熟后挤柠檬汁。"
      ],
      health: "鱼 + 大量夏野菜 + 橄榄油。"
    },
    {
      id: "su-chicken",
      title: "番茄茄子鸡肉煲 · 轻油版",
      subtitle: "中国家常 × 地中海调味",
      style: "CN",
      time: 30,
      protein: "鶏むね肉",
      vegetables: ["トマト", "なす", "オクラ", "玉ねぎ"],
      pantry: ["生姜", "オリーブオイル", "醤油少量", "黒酢"],
      steps: [
        "鸡肉和蔬菜切块。",
        "鸡肉先用少量油煎。",
        "加入蔬菜和少量水焖熟。",
        "少量酱油和黑醋收尾。"
      ],
      health: "保留番茄茄子家常味，减少炒油和盐。"
    },
    {
      id: "su-saba",
      title: "鯖・きゅうり・トマトの和風サラダ",
      subtitle: "青花鱼 × 黄瓜 × 番茄 × 豆",
      style: "JP",
      time: 15,
      protein: "鯖 / ミックスビーンズ",
      vegetables: ["きゅうり", "トマト", "レタス"],
      pantry: ["オリーブオイル", "酢", "醤油少量"],
      steps: [
        "蔬菜切块。",
        "青花鱼弄散。",
        "加入豆类。",
        "橄榄油、醋和少量酱油调味。"
      ],
      health: "适合炎热天气的青鱼 + 豆类 + 生蔬菜。"
    },
    {
      id: "su-tofu",
      title: "豆腐ラタトゥイユ",
      subtitle: "豆腐 × 番茄 × 茄子",
      style: "MED",
      time: 25,
      protein: "豆腐",
      vegetables: ["トマト", "なす", "ピーマン", "玉ねぎ"],
      pantry: ["オリーブオイル", "にんにく", "乾燥ハーブ"],
      steps: [
        "豆腐沥水后煎香。",
        "蔬菜用少量橄榄油炒。",
        "加入番茄炖煮。",
        "放回豆腐。"
      ],
      health: "植物性蛋白 + 大量夏季蔬菜。"
    },
    {
      id: "su-bowl",
      title: "枝豆とうもろこし雑穀ボウル",
      subtitle: "毛豆 × 玉米 × 杂粮 × 鸡蛋",
      style: "JP",
      time: 20,
      protein: "枝豆 / 卵",
      vegetables: ["とうもろこし", "トマト", "きゅうり"],
      pantry: ["雑穀", "海苔", "オリーブオイル", "酢"],
      steps: [
        "少量杂粮饭打底。",
        "加入毛豆、玉米和蔬菜。",
        "放鸡蛋。",
        "用醋和橄榄油轻调味。"
      ],
      health: "全谷物、豆类、鸡蛋、蔬菜的一碗式晚餐。"
    },
    {
      id: "su-shrimp",
      title: "虾仁秋葵番茄快炒",
      subtitle: "虾仁 × 秋葵 × 番茄",
      style: "CN",
      time: 18,
      protein: "えび",
      vegetables: ["オクラ", "トマト", "玉ねぎ"],
      pantry: ["生姜", "オリーブオイル", "黒こしょう"],
      steps: [
        "虾仁先快速煎熟。",
        "加入洋葱和秋葵。",
        "最后放番茄短时间翻炒。"
      ],
      health: "中式快炒但控制油盐。"
    },
    {
      id: "su-lentil",
      title: "レンズ豆と夏野菜のスープ",
      subtitle: "扁豆 × 番茄 × 胡萝卜",
      style: "MED",
      time: 35,
      protein: "レンズ豆",
      vegetables: ["トマト", "にんじん", "玉ねぎ", "ピーマン"],
      pantry: ["オリーブオイル", "にんにく", "クミン"],
      steps: [
        "蔬菜切块。",
        "洋葱和蒜轻炒。",
        "加入扁豆、蔬菜和水煮熟。",
        "最后加少量橄榄油。"
      ],
      health: "高纤维植物蛋白，适合一周收尾。"
    }
  ],
  autumn: [
    {
      id: "au-salmon",
      title: "秋鮭とかぼちゃのオーブン焼き",
      subtitle: "秋鲑 × 南瓜 × 菌菇",
      style: "FUSION",
      time: 30,
      protein: "秋鮭",
      vegetables: ["かぼちゃ", "きのこ", "玉ねぎ"],
      pantry: ["オリーブオイル", "レモン", "黒こしょう"],
      steps: [
        "南瓜切薄片，菌菇拆散。",
        "与秋鲑一起烤熟。",
        "最后加柠檬和黑胡椒。"
      ],
      health: "秋鱼 + 南瓜 + 菌菇。"
    },
    {
      id: "au-lotus",
      title: "莲藕鸡肉黑醋煮",
      subtitle: "莲藕 × 鸡肉 × 黑醋",
      style: "CN",
      time: 30,
      protein: "鶏肉",
      vegetables: ["れんこん", "にんじん", "きのこ"],
      pantry: ["黒酢", "生姜", "醤油少量"],
      steps: [
        "鸡肉和根菜切块。",
        "少量油煎鸡肉。",
        "加入蔬菜、水和黑醋焖煮。"
      ],
      health: "用黑醋提升风味，减少盐和糖。"
    },
    {
      id: "au-saba",
      title: "鯖・きのこ・りんごの秋サラダ",
      subtitle: "青花鱼 × 菌菇 × 苹果",
      style: "JP",
      time: 20,
      protein: "鯖",
      vegetables: ["きのこ", "葉野菜", "りんご"],
      pantry: ["オリーブオイル", "酢", "粒マスタード"],
      steps: [
        "菌菇先煎熟。",
        "与叶菜、苹果、青花鱼混合。",
        "橄榄油和醋调味。"
      ],
      health: "鱼类脂肪 + 菌菇 + 水果少量。"
    },
    {
      id: "au-beans",
      title: "かぼちゃとひよこ豆のトマト煮",
      subtitle: "南瓜 × 鹰嘴豆",
      style: "MED",
      time: 30,
      protein: "ひよこ豆",
      vegetables: ["かぼちゃ", "トマト", "玉ねぎ"],
      pantry: ["オリーブオイル", "にんにく", "クミン"],
      steps: [
        "洋葱和蒜轻炒。",
        "加入南瓜、鹰嘴豆和番茄。",
        "炖到南瓜变软。"
      ],
      health: "一周一次植物性蛋白主餐。"
    },
    {
      id: "au-bowl",
      title: "さつまいも雑穀ボウル",
      subtitle: "红薯 × 杂粮 × 鸡蛋",
      style: "FUSION",
      time: 20,
      protein: "卵 / 豆",
      vegetables: ["さつまいも", "きのこ", "葉野菜"],
      pantry: ["雑穀", "オリーブオイル", "酢"],
      steps: [
        "红薯蒸熟。",
        "少量杂粮饭打底。",
        "加入鸡蛋、菌菇和叶菜。"
      ],
      health: "注意红薯和杂粮总量，避免双份主食过多。"
    },
    {
      id: "au-shrimp",
      title: "虾仁菌菇芹菜快炒",
      subtitle: "虾仁 × 菌菇 × 芹菜",
      style: "CN",
      time: 18,
      protein: "えび",
      vegetables: ["きのこ", "セロリ", "にんじん"],
      pantry: ["生姜", "黒こしょう", "オリーブオイル"],
      steps: [
        "虾仁煎熟后盛出。",
        "蔬菜快速翻炒。",
        "放回虾仁，用黑胡椒调味。"
      ],
      health: "高蛋白、低油快炒。"
    },
    {
      id: "au-lentil",
      title: "ごぼうとレンズ豆のスープ",
      subtitle: "牛蒡 × 扁豆",
      style: "MED",
      time: 35,
      protein: "レンズ豆",
      vegetables: ["ごぼう", "にんじん", "玉ねぎ"],
      pantry: ["オリーブオイル", "にんにく", "ハーブ"],
      steps: [
        "根菜切小块。",
        "加入扁豆和水煮熟。",
        "最后少量橄榄油。"
      ],
      health: "高纤维暖汤。"
    }
  ],
  winter: [
    {
      id: "wi-cod",
      title: "鱈と白菜のオリーブオイル鍋",
      subtitle: "鳕鱼 × 白菜 × 葱",
      style: "FUSION",
      time: 25,
      protein: "鱈",
      vegetables: ["白菜", "長ねぎ", "大根"],
      pantry: ["オリーブオイル", "昆布", "レモン"],
      steps: [
        "昆布水做清汤底。",
        "加入鳕鱼、白菜、大根和葱。",
        "煮熟后加少量橄榄油和柠檬。"
      ],
      health: "日式锅物 × 地中海橄榄油，温热清淡。"
    },
    {
      id: "wi-chicken",
      title: "萝卜鸡肉番茄炖",
      subtitle: "白萝卜 × 鸡肉 × 番茄",
      style: "CN",
      time: 35,
      protein: "鶏肉",
      vegetables: ["大根", "トマト", "長ねぎ"],
      pantry: ["生姜", "オリーブオイル", "醤油少量"],
      steps: [
        "鸡肉切块轻煎。",
        "加入萝卜、番茄和水。",
        "炖软后少量酱油调味。"
      ],
      health: "冬季温热家常菜，减少油盐。"
    },
    {
      id: "wi-saba",
      title: "小松菜・豆・鯖の温サラダ",
      subtitle: "小松菜 × 豆 × 青花鱼",
      style: "JP",
      time: 20,
      protein: "鯖 / 豆",
      vegetables: ["小松菜", "ブロッコリー", "玉ねぎ"],
      pantry: ["オリーブオイル", "酢", "粒マスタード"],
      steps: [
        "小松菜和西兰花快速焯熟。",
        "加入青花鱼和豆。",
        "用橄榄油和醋调味。"
      ],
      health: "冬季深色蔬菜 + 青鱼。"
    },
    {
      id: "wi-beans",
      title: "白いんげん豆と白菜の煮込み",
      subtitle: "白芸豆 × 白菜",
      style: "MED",
      time: 30,
      protein: "白いんげん豆",
      vegetables: ["白菜", "にんじん", "玉ねぎ"],
      pantry: ["トマト缶", "オリーブオイル", "にんにく"],
      steps: [
        "蔬菜切块。",
        "加入白芸豆和番茄。",
        "小火炖熟。"
      ],
      health: "暖胃的植物性蛋白主餐。"
    },
    {
      id: "wi-bowl",
      title: "ブロッコリー卵雑穀ボウル",
      subtitle: "西兰花 × 鸡蛋 × 杂粮",
      style: "FUSION",
      time: 20,
      protein: "卵 / 豆",
      vegetables: ["ブロッコリー", "かぶ", "小松菜"],
      pantry: ["雑穀", "オリーブオイル", "酢"],
      steps: [
        "少量杂粮饭打底。",
        "加入西兰花、小松菜和芜菁。",
        "放鸡蛋和豆类。"
      ],
      health: "一碗式全谷物和蔬菜餐。"
    },
    {
      id: "wi-shrimp",
      title: "虾仁白菜木耳轻炒",
      subtitle: "虾仁 × 白菜 × 木耳",
      style: "CN",
      time: 18,
      protein: "えび",
      vegetables: ["白菜", "きくらげ", "長ねぎ"],
      pantry: ["生姜", "黒こしょう", "オリーブオイル"],
      steps: [
        "虾仁快速煎熟。",
        "白菜、木耳和葱快炒。",
        "放回虾仁，黑胡椒调味。"
      ],
      health: "中式快炒但用油更少。"
    },
    {
      id: "wi-lentil",
      title: "大根とレンズ豆の温かいスープ",
      subtitle: "白萝卜 × 扁豆",
      style: "MED",
      time: 35,
      protein: "レンズ豆",
      vegetables: ["大根", "にんじん", "長ねぎ"],
      pantry: ["オリーブオイル", "にんにく", "ハーブ"],
      steps: [
        "根菜切块。",
        "加入扁豆和水煮熟。",
        "最后加少量橄榄油。"
      ],
      health: "高纤维、温热、低负担。"
    }
  ]
};

const weekdayZh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function minutesFromIndication(value?: string) {
  if (!value) return 30;
  const match = value.match(/(\d+)/);
  if (!match) return value.includes("1時間") ? 60 : 30;
  return Number(match[1]) || 30;
}

function inferProtein(materials: string[]) {
  const text = materials.join(" ");
  const candidates: Array<[string, string]> = [
    ["鮭", "鮭 / サーモン"],
    ["サーモン", "鮭 / サーモン"],
    ["鯖", "鯖"],
    ["さば", "鯖"],
    ["アジ", "アジ"],
    ["あじ", "アジ"],
    ["ぶり", "ぶり"],
    ["鱈", "鱈"],
    ["たら", "鱈"],
    ["鶏", "鶏肉"],
    ["チキン", "鶏肉"],
    ["豆腐", "豆腐"],
    ["ひよこ豆", "ひよこ豆"],
    ["レンズ豆", "レンズ豆"],
    ["納豆", "納豆"],
    ["えび", "えび"],
    ["エビ", "えび"],
    ["卵", "卵"],
    ["たまご", "卵"]
  ];

  for (const [keyword, label] of candidates) {
    if (text.includes(keyword)) return label;
  }

  if (text.includes("豆")) return "豆类";
  return "鱼 / 豆 / 鸡肉候选";
}

function liveRecipeToMeal(
  recipe: LiveRecipe,
  seasonal: string[]
): Meal {
  const combined = `${recipe.title} ${recipe.materials.join(" ")}`;
  const vegetables = seasonal
    .filter((item) => {
      const normalized = item.replace(/^春/, "").replace(/^新/, "");
      return normalized.length >= 2 && combined.includes(normalized);
    })
    .slice(0, 5);

  const protein = inferProtein(recipe.materials);
  const pantry = recipe.materials
    .filter((item) => !vegetables.some((veg) => item.includes(veg)))
    .slice(0, 7);

  return {
    id: `live-${recipe.id}`,
    title: recipe.title,
    subtitle: recipe.description || "本周在线食谱候选",
    style: "FUSION",
    time: minutesFromIndication(recipe.indication),
    protein,
    vegetables:
      vegetables.length > 0 ? vegetables : ["旬食材と組み合わせ"],
    pantry,
    steps: [
      recipe.materials.length > 0
        ? `主要材料：${recipe.materials.slice(0, 7).join("、")}`
        : "主要材料请参考原食谱。",
      "具体烹饪步骤以原食谱为准，本页不自动改写关键步骤。",
      "家庭健康调整：控制盐、糖和油量；适合时优先橄榄油，并增加蔬菜比例。"
    ],
    health:
      "来自本周 Rakuten Recipe 排名候选，并按旬食材、鱼/豆/鸡肉、蔬菜比例和少油少加工食品方向进行筛选。",
    live: true,
    imageUrl: recipe.imageUrl,
    sourceUrl: recipe.sourceUrl,
    source: recipe.source
  };
}


export default function RecipesPage() {
  const now = new Date();
  const season = seasonForDate(now);
  const meta = seasonMeta[season];
  const rotation = weekIndex(now) % 7;
  const [openMeal, setOpenMeal] = useState<string | null>(null);
  const [remote, setRemote] = useState<RecipeApiResponse | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    async function loadRemote() {
      try {
        const response = await fetch("/api/recipes", {
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as RecipeApiResponse;
        if (!disposed) setRemote(payload);
      } catch {
        // Keep the local seasonal fallback.
      } finally {
        if (!disposed) setRemoteLoading(false);
      }
    }

    void loadRemote();

    const timer = window.setInterval(() => {
      void loadRemote();
    }, 6 * 60 * 60_000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  const seasonalDisplay =
    remote?.seasonalProduce && remote.seasonalProduce.length > 0
      ? remote.seasonalProduce
      : meta.produce;

  const liveMeals = useMemo(
    () =>
      (remote?.liveRecipes ?? []).map((recipe) =>
        liveRecipeToMeal(recipe, seasonalDisplay)
      ),
    [remote, seasonalDisplay]
  );

  const weekMeals = useMemo(() => {
    const fallback = meals[season];
    const candidates =
      liveMeals.length >= 4
        ? liveMeals
        : [...liveMeals, ...fallback.filter((meal) => !liveMeals.some((live) => live.title === meal.title))];

    return Array.from(
      { length: 7 },
      (_, index) => candidates[(index + rotation) % candidates.length]
    );
  }, [season, rotation, liveMeals]);

  const todayMeal = weekMeals[now.getDay()];

  const shopping = useMemo(() => {
    const proteins = Array.from(new Set(weekMeals.map((meal) => meal.protein)));
    const vegetables = Array.from(
      new Set(weekMeals.flatMap((meal) => meal.vegetables))
    );
    const pantry = Array.from(
      new Set(weekMeals.flatMap((meal) => meal.pantry))
    ).slice(0, 24);
    return { proteins, vegetables, pantry };
  }, [weekMeals]);

  return (
    <main className="min-h-[100dvh] bg-[#07111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(52,211,153,0.12),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(251,191,36,0.10),transparent_25%),linear-gradient(145deg,#07111f,#0b1729_55%,#09131f)]" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-emerald-200">
              <Leaf size={16} />
              SEASONAL HEALTHY TABLE
            </div>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              関東旬食材 × 中国家常 × 地中海饮食
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span>
                {meta.label} · {meta.ja} · {meta.zh}　{meta.note}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  remote?.mode === "live"
                    ? "bg-emerald-300/15 text-emerald-100"
                    : "bg-amber-300/10 text-amber-100"
                }`}
              >
                {remoteLoading
                  ? "更新確認中…"
                  : remote?.mode === "live"
                    ? "MAFF + Rakuten LIVE"
                    : remote?.sourceStatus?.rakutenRecipe?.configured
                      ? "MAFF + fallback"
                      : "MAFF + fallback · Rakuten Key未設定"}
              </span>
            </div>
          </div>

          <Link
            href="/display"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-semibold text-slate-200 active:bg-white/[0.14]"
          >
            <Home size={18} />
            Screen
          </Link>
        </header>

        <section className="mt-4 rounded-2xl bg-white/[0.04] p-4">
          <div className="text-xs font-semibold tracking-[0.14em] text-amber-100">
            今の旬 · 当前时令
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {seasonalDisplay.map((item) => (
              <span
                key={item}
                className="rounded-full bg-emerald-300/10 px-3 py-1.5 text-sm text-emerald-100"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <RefreshCw size={12} />
              每周自动更新
            </span>
            <span>
              MAFF: {remote?.sourceStatus?.maff?.reached ? "LIVE" : "fallback"}
            </span>
            <span>
              Rakuten Recipe:{" "}
              {remote?.sourceStatus?.rakutenRecipe?.reached
                ? "LIVE"
                : remote?.sourceStatus?.rakutenRecipe?.configured
                  ? "暂不可用"
                  : "未配置"}
            </span>
            {remote?.updatedAt ? (
              <span>
                {new Date(remote.updatedAt).toLocaleDateString("ja-JP")}
              </span>
            ) : null}
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <article className="rounded-3xl bg-emerald-300/[0.08] p-5 sm:p-6">
            <div className="text-xs font-semibold tracking-[0.14em] text-emerald-200">
              TODAY'S MEAL · 今日推荐
            </div>

            {todayMeal.imageUrl ? (
              <div className="mt-3 overflow-hidden rounded-2xl bg-slate-950/25">
                <img
                  src={todayMeal.imageUrl}
                  alt=""
                  className="h-36 w-full object-cover sm:h-44"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold sm:text-4xl">
                  {todayMeal.title}
                </h2>
                <div className="mt-1 text-base text-slate-300">
                  {todayMeal.subtitle}
                </div>
              </div>

              <div className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-200">
                {todayMeal.live ? "LIVE · Rakuten" : styleLabel(todayMeal.style)}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-950/25 p-4">
                <Clock3 className="h-5 w-5 text-sky-200" />
                <div className="mt-2 text-sm text-slate-400">时间</div>
                <div className="mt-1 text-xl font-bold">
                  {todayMeal.time} min
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/25 p-4">
                <Fish className="h-5 w-5 text-blue-200" />
                <div className="mt-2 text-sm text-slate-400">蛋白质</div>
                <div className="mt-1 text-lg font-bold">
                  {todayMeal.protein}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/25 p-4">
                <Salad className="h-5 w-5 text-emerald-200" />
                <div className="mt-2 text-sm text-slate-400">蔬菜</div>
                <div className="mt-1 text-sm font-semibold leading-relaxed">
                  {todayMeal.vegetables.join(" · ")}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950/25 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-100">
                <ChefHat size={19} />
                简单做法
              </div>
              <div className="mt-3 grid gap-2">
                {todayMeal.steps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-3 text-sm leading-relaxed text-slate-200"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[0.07] text-xs">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.05] p-4 text-sm leading-relaxed text-emerald-50">
              {todayMeal.health}
            </div>

            {todayMeal.sourceUrl ? (
              <a
                href={todayMeal.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-semibold text-slate-200 active:bg-white/[0.12]"
              >
                原食谱
                <ExternalLink size={16} />
              </a>
            ) : null}
          </article>

          <article className="rounded-3xl bg-white/[0.045] p-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-violet-200" />
              <div className="font-bold">本周 7 天</div>
            </div>

            <div className="mt-4 grid gap-2">
              {weekMeals.map((meal, index) => (
                <button
                  key={`${meal.id}-${index}`}
                  type="button"
                  onClick={() =>
                    setOpenMeal((current) =>
                      current === `${meal.id}-${index}`
                        ? null
                        : `${meal.id}-${index}`
                    )
                  }
                  className={`rounded-xl p-3 text-left transition ${
                    index === now.getDay()
                      ? "bg-emerald-300/12"
                      : "bg-slate-950/20 active:bg-white/[0.08]"
                  }`}
                >
                  <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3">
                    <div className="text-xs font-semibold text-slate-400">
                      {weekdayZh[index]}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {meal.title}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-slate-500">
                        {meal.live ? "LIVE" : styleLabel(meal.style)} · {meal.protein}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {meal.time}m
                    </div>
                  </div>

                  {openMeal === `${meal.id}-${index}` ? (
                    <div className="mt-3 border-t border-white/5 pt-3 text-xs leading-relaxed text-slate-300">
                      {meal.steps.join(" → ")}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-4 rounded-3xl bg-amber-300/[0.06] p-5">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="h-5 w-5 text-amber-200" />
            <div className="font-bold">本周购物清单 · Weekly Shopping</div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-950/20 p-4">
              <div className="text-xs font-semibold text-blue-200">
                PROTEIN
              </div>
              <div className="mt-2 text-sm leading-7 text-slate-200">
                {shopping.proteins.join(" · ")}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/20 p-4">
              <div className="text-xs font-semibold text-emerald-200">
                VEGETABLES
              </div>
              <div className="mt-2 text-sm leading-7 text-slate-200">
                {shopping.vegetables.join(" · ")}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/20 p-4">
              <div className="text-xs font-semibold text-amber-200">
                PANTRY
              </div>
              <div className="mt-2 text-sm leading-7 text-slate-200">
                {shopping.pantry.join(" · ")}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            "蔬菜占餐盘约一半",
            "鱼 / 豆 / 鸡肉轮换",
            "橄榄油为主要烹调油",
            "少加工肉、少糖、少盐"
          ].map((rule) => (
            <div
              key={rule}
              className="rounded-2xl bg-white/[0.035] px-4 py-3 text-center text-xs text-slate-400"
            >
              {rule}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
