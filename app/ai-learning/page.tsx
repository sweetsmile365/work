"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { MobileLayout } from "@/components/responsive/MobileLayout";

type Lesson = {
  day: number;
  title: string;
  titleJa: string;
  goal: string;
  watch: string;
  activity: string;
  explain: string;
  keywords: Array<{ en: string; ja: string }>;
};

const lessons: Lesson[] = [
  {
    day: 1,
    title: "What Is AI?",
    titleJa: "AIって何？",
    goal: "AI と普通のコンピューターの違いを、自分の言葉で説明できる。",
    watch: "動画を見ながら、身の回りで『AIかもしれない』ものを3つ探す。",
    activity: "スマホ、ゲーム、検索、写真アプリなどから3つ選び、『なぜAIだと思うか』を考える。",
    explain: "『AIは〇〇するために、データから〇〇する技術』の形で1文にする。",
    keywords: [
      { en: "Artificial Intelligence", ja: "人工知能" },
      { en: "Data", ja: "データ" },
      { en: "Prediction", ja: "予測" }
    ]
  },
  {
    day: 2,
    title: "Five Big Ideas of AI",
    titleJa: "AIの5つの考え方",
    goal: "Perceive / Reason / Learn / Interact / Impact の5つを知る。",
    watch: "昨日見つけたAIが、5つのうちどれに関係するか考えながら見る。",
    activity: "『顔認証』『翻訳』『おすすめ動画』を5つの考え方に分ける。",
    explain: "一番重要だと思った考え方を1つ選び、その理由を説明する。",
    keywords: [
      { en: "Perceive", ja: "認識する" },
      { en: "Learn", ja: "学習する" },
      { en: "Impact", ja: "社会への影響" }
    ]
  },
  {
    day: 3,
    title: "Can Machines Really Learn?",
    titleJa: "機械は本当に学べる？",
    goal: "AIの『学習』は、人間の学習と同じではないことを理解する。",
    watch: "AIがたくさんの例からパターンを見つける点に注目する。",
    activity: "猫と犬を見分けるAIを作るなら、どんな写真を集めるべきか5つ考える。",
    explain: "『AIが学ぶ』とはどういう意味か、30秒で説明する。",
    keywords: [
      { en: "Training", ja: "学習・訓練" },
      { en: "Pattern", ja: "パターン" },
      { en: "Example", ja: "例・サンプル" }
    ]
  },
  {
    day: 4,
    title: "Data & Prediction",
    titleJa: "データと予測",
    goal: "学習データの質がAIの予測に影響することを理解する。",
    watch: "『どんなデータで学んだか』が重要だと意識して見る。",
    activity: "晴れの日の写真だけで天気AIを作ったら何が起こるか考える。",
    explain: "良いデータとは何か、2つ条件を言う。",
    keywords: [
      { en: "Dataset", ja: "データセット" },
      { en: "Prediction", ja: "予測" },
      { en: "Quality", ja: "質" }
    ]
  },
  {
    day: 5,
    title: "What Is an Algorithm?",
    titleJa: "アルゴリズムって何？",
    goal: "アルゴリズムを『順番どおりに実行する手順』として理解する。",
    watch: "コンピューターは曖昧な指示が苦手だという点に注目する。",
    activity: "『朝、学校へ行くまで』を5ステップのアルゴリズムにする。",
    explain: "手順を1つ抜いたら何が困るか説明する。",
    keywords: [
      { en: "Algorithm", ja: "手順・アルゴリズム" },
      { en: "Step", ja: "手順" },
      { en: "Rule", ja: "ルール" }
    ]
  },
  {
    day: 6,
    title: "Debug an Algorithm",
    titleJa: "間違った手順を直す",
    goal: "手順のミスを見つけて修正する考え方を身につける。",
    watch: "『なぜその手順では失敗するのか』を考えながら見る。",
    activity: "昨日の5ステップから1つをわざと壊し、どんな問題が起きるか考える。",
    explain: "Debug の意味を、自分の例を使って説明する。",
    keywords: [
      { en: "Debug", ja: "間違いを見つけて直す" },
      { en: "Error", ja: "エラー" },
      { en: "Fix", ja: "修正する" }
    ]
  },
  {
    day: 7,
    title: "How Do Machines Learn?",
    titleJa: "機械はどうやって学ぶ？",
    goal: "入力→学習→モデル→予測の流れを理解する。",
    watch: "Training と Testing の違いに注目する。",
    activity: "『果物を分類するAI』を例に、入力・学習・予測を書き出す。",
    explain: "Training と Testing の違いを1文ずつ説明する。",
    keywords: [
      { en: "Model", ja: "モデル" },
      { en: "Training", ja: "学習" },
      { en: "Testing", ja: "テスト" }
    ]
  },
  {
    day: 8,
    title: "Supervised Learning",
    titleJa: "正解つきで学ぶAI",
    goal: "ラベル付きデータを使う学習方法を理解する。",
    watch: "人間が『正解ラベル』をつける役割に注目する。",
    activity: "画像を『スポーツ』『食べ物』に分けるなら、各5個の例を考える。",
    explain: "Label がないと何が難しくなるか説明する。",
    keywords: [
      { en: "Label", ja: "正解ラベル" },
      { en: "Supervised Learning", ja: "教師あり学習" },
      { en: "Classify", ja: "分類する" }
    ]
  },
  {
    day: 9,
    title: "Why AI Makes Mistakes",
    titleJa: "AIはなぜ間違える？",
    goal: "AIの答えをそのまま信じてはいけない理由を理解する。",
    watch: "データ不足・環境の違い・偏りに注目する。",
    activity: "AIが間違えそうな場面を2つ考える。",
    explain: "『AIが自信満々でも間違うことがある』理由を説明する。",
    keywords: [
      { en: "Mistake", ja: "間違い" },
      { en: "Confidence", ja: "確信度" },
      { en: "Check", ja: "確認する" }
    ]
  },
  {
    day: 10,
    title: "Bias & Fairness",
    titleJa: "AIの偏りと公平さ",
    goal: "AIの偏りがデータや作り方から生まれることを理解する。",
    watch: "『誰にとって公平か』を考えながら見る。",
    activity: "学校の部活おすすめAIを作る場合、どんな偏りが起こりそうか考える。",
    explain: "Fair AI に必要なことを2つ言う。",
    keywords: [
      { en: "Bias", ja: "偏り" },
      { en: "Fairness", ja: "公平さ" },
      { en: "Responsibility", ja: "責任" }
    ]
  },
  {
    day: 11,
    title: "Generative AI",
    titleJa: "生成AIって何？",
    goal: "検索と生成AIの違いを理解する。",
    watch: "AIが『答えを探す』のではなく『作る』ことがある点に注目する。",
    activity: "検索エンジンと生成AIに同じ質問をしたときの違いを3つ考える。",
    explain: "生成AIの便利な点と危ない点を1つずつ説明する。",
    keywords: [
      { en: "Generative AI", ja: "生成AI" },
      { en: "Prompt", ja: "指示・プロンプト" },
      { en: "Generate", ja: "生成する" }
    ]
  },
  {
    day: 12,
    title: "Be a Smart AI User",
    titleJa: "AIを賢く使う",
    goal: "AIを安全に、考えながら使う3つのルールを作る。",
    watch: "事実確認・個人情報・最後は自分で判断、の3点を意識する。",
    activity: "自分専用の『AIを使うときの3ルール』を書く。",
    explain: "家族に1分で『AIと上手につきあう方法』を説明する。",
    keywords: [
      { en: "Fact-check", ja: "事実確認" },
      { en: "Privacy", ja: "プライバシー" },
      { en: "Judgment", ja: "判断" }
    ]
  }
];

const STORAGE_KEY = "family-ai-learning-progress-v1";
const PLAYLIST_URL =
  "https://www.youtube-nocookie.com/embed/videoseries?list=PLDVXRQw6p68sPfA08_gcJS_AwapOTUs4v";

export default function AiLearningPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        currentIndex?: number;
        done?: number[];
      };

      if (typeof parsed.currentIndex === "number") {
        setCurrentIndex(
          Math.max(0, Math.min(lessons.length - 1, parsed.currentIndex))
        );
      }

      if (Array.isArray(parsed.done)) {
        setDone(parsed.done.filter((value) => Number.isInteger(value)));
      }
    } catch {
      // Broken local progress is ignored.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ currentIndex, done })
    );
  }, [currentIndex, done]);

  const lesson = lessons[currentIndex];
  const doneCount = useMemo(() => new Set(done).size, [done]);
  const progress = Math.round((doneCount / lessons.length) * 100);

  const completeToday = () => {
    setDone((prev) =>
      prev.includes(lesson.day) ? prev : [...prev, lesson.day]
    );

    if (currentIndex < lessons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const resetProgress = () => {
    if (!window.confirm("AIコースの進捗を最初からやり直しますか？")) return;
    setDone([]);
    setCurrentIndex(0);
  };

  return (
    <MobileLayout title="AI Learning / AI学習">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/display"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm active:bg-slate-700"
        >
          <ArrowLeft size={18} />
          Screenへ戻る
        </Link>

        <button
          type="button"
          onClick={resetProgress}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      <section className="rounded-3xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 p-5 text-white shadow-lg">
        <div className="text-xs font-bold tracking-[0.18em] text-cyan-100">
          AI DAILY · 20 MIN
        </div>

        <h1 className="mt-2 text-2xl font-black">
          中1・AIゼロからスタート
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-white/85">
          毎日20分。5分見る → 10分考える/試す → 5分自分の言葉で説明。
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs font-bold tabular-nums">
            {doneCount}/{lessons.length}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] text-cyan-700">
              DAY {lesson.day}
            </div>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {lesson.title}
            </h2>

            <div className="mt-1 text-sm font-bold text-slate-500">
              {lesson.titleJa}
            </div>
          </div>

          {done.includes(lesson.day) ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={15} />
              DONE
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl bg-cyan-50 p-4">
          <div className="text-[11px] font-bold tracking-[0.16em] text-cyan-700">
            TODAY&apos;S GOAL
          </div>

          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">
            {lesson.goal}
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-black">
          <div className="aspect-video">
            <iframe
              className="h-full w-full"
              src={PLAYLIST_URL}
              title="MIT Day of AI video tutorial playlist"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          MIT Day of AI の Middle Grades 向け Video Tutorial Playlist をPWA内で再生します。
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
          <div className="text-xs font-black text-cyan-700">
            ① WATCH · 5 MIN
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {lesson.watch}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <div className="text-xs font-black text-violet-700">
            ② TRY · 10 MIN
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {lesson.activity}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-xs font-black text-emerald-700">
            ③ EXPLAIN · 5 MIN
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {lesson.explain}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-black tracking-[0.16em] text-slate-500">
          TODAY&apos;S ENGLISH
        </div>

        <div className="mt-3 grid gap-2">
          {lesson.keywords.map((item) => (
            <div
              key={item.en}
              className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-3"
            >
              <span className="font-bold text-slate-900">{item.en}</span>
              <span className="text-sm font-semibold text-slate-500">
                {item.ja}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() =>
              setCurrentIndex((value) => Math.max(0, value - 1))
            }
            className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
            PREV
          </button>

          <button
            type="button"
            onClick={completeToday}
            className="min-h-12 flex-1 rounded-xl bg-cyan-600 px-4 text-sm font-black text-white shadow-sm active:bg-cyan-700"
          >
            {currentIndex === lessons.length - 1
              ? "今日を完了 ✓"
              : "今日を完了 →"}
          </button>

          <button
            type="button"
            disabled={currentIndex === lessons.length - 1}
            onClick={() =>
              setCurrentIndex((value) =>
                Math.min(lessons.length - 1, value + 1)
              )
            }
            className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 disabled:opacity-30"
          >
            NEXT
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
          {lessons.map((item, index) => {
            const isDone = done.includes(item.day);
            const isCurrent = index === currentIndex;

            return (
              <button
                key={item.day}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`grid aspect-square place-items-center rounded-xl text-xs font-black ${
                  isCurrent
                    ? "bg-cyan-600 text-white"
                    : isDone
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                }`}
                aria-label={`Day ${item.day}`}
              >
                {item.day}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        这套12天课程按中一零基础设计，核心围绕 AI 是什么、机器学习、算法、数据、偏差、生成式AI与安全使用。每次固定20分钟，不要求先学 Python。
      </section>
    </MobileLayout>
  );
}
