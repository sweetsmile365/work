"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  PlayCircle,
  RotateCcw
} from "lucide-react";

type TalkId = "adora" | "grit";

type VocabItem = {
  word: string;
  ja: string;
  zh: string;
  note?: string;
};

type Talk = {
  id: TalkId;
  title: string;
  speaker: string;
  level: string;
  duration: string;
  why: string;
  tedUrl: string;
  tedEdUrl: string;
  embedUrl: string;
  vocab: VocabItem[];
  questions: string[];
};

const talks: Talk[] = [
  {
    id: "adora",
    title: "What adults can learn from kids",
    speaker: "Adora Svitak",
    level: "中1〜中2 · ★★☆",
    duration: "約 8 min",
    why:
      "12歳の子どもが大人に向けて話すTED。子どもの視点、創造性、期待について考えやすい。",
    tedUrl:
      "https://www.ted.com/talks/adora_svitak_what_adults_can_learn_from_kids",
    tedEdUrl:
      "https://ed.ted.com/lessons/what-adults-can-learn-from-kids-adora-svitak",
    embedUrl:
      "https://embed.ted.com/talks/adora_svitak_what_adults_can_learn_from_kids",
    vocab: [
      { word: "childish", ja: "子どもっぽい", zh: "孩子气的", note: "文脈では必ずしも悪い意味ではない" },
      { word: "irrational", ja: "非合理的な", zh: "不理性的" },
      { word: "expectation", ja: "期待", zh: "期待" },
      { word: "optimism", ja: "楽観主義", zh: "乐观主义" },
      { word: "creativity", ja: "創造性", zh: "创造力" },
      { word: "possibility", ja: "可能性", zh: "可能性" },
      { word: "responsibility", ja: "責任", zh: "责任" },
      { word: "generation", ja: "世代", zh: "一代；世代" },
      { word: "opportunity", ja: "機会", zh: "机会" },
      { word: "challenge", ja: "挑戦", zh: "挑战" },
      { word: "ability", ja: "能力", zh: "能力" },
      { word: "learn from", ja: "〜から学ぶ", zh: "向……学习" }
    ],
    questions: [
      "What is this talk mainly about?",
      "What surprised you?",
      "Do you agree that adults can learn from kids? Why?"
    ]
  },
  {
    id: "grit",
    title: "Grit: The power of passion and perseverance",
    speaker: "Angela Lee Duckworth",
    level: "中1〜中2 · ★★★",
    duration: "約 6 min",
    why:
      "IQだけでは説明できない成功の要因として、grit（情熱と粘り強さ）を紹介する短いTED。",
    tedUrl:
      "https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance",
    tedEdUrl:
      "https://ed.ted.com/lessons/grit-the-power-of-passion-and-perseverance-angela-lee-duckworth",
    embedUrl:
      "https://embed.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance",
    vocab: [
      { word: "grit", ja: "やり抜く力・粘り強さ", zh: "毅力；坚韧" },
      { word: "passion", ja: "情熱", zh: "热情" },
      { word: "perseverance", ja: "忍耐力・粘り強さ", zh: "坚持不懈；毅力" },
      { word: "predict", ja: "予測する", zh: "预测" },
      { word: "success", ja: "成功", zh: "成功" },
      { word: "talent", ja: "才能", zh: "天赋" },
      { word: "intelligence", ja: "知能", zh: "智力" },
      { word: "motivation", ja: "動機・やる気", zh: "动机；动力" },
      { word: "achievement", ja: "達成・成果", zh: "成就；成绩" },
      { word: "long-term", ja: "長期的な", zh: "长期的" },
      { word: "effort", ja: "努力", zh: "努力" },
      { word: "growth mindset", ja: "成長思考", zh: "成长型思维" }
    ],
    questions: [
      "What does grit mean in this talk?",
      "What surprised you?",
      "Which is more important for success: talent or perseverance? Why?"
    ]
  }
];

const STORAGE_KEY = "ted-english-learning-progress-v1";

type Progress = Record<
  TalkId,
  {
    firstWatch: boolean;
    secondWatch: boolean;
    answered: boolean;
  }
>;

const emptyProgress: Progress = {
  adora: { firstWatch: false, secondWatch: false, answered: false },
  grit: { firstWatch: false, secondWatch: false, answered: false }
};

export default function TedLearningPage() {
  const [selectedId, setSelectedId] = useState<TalkId>("adora");
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [answers, setAnswers] = useState<Record<TalkId, string[]>>({
    adora: ["", "", ""],
    grit: ["", "", ""]
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        progress?: Progress;
        answers?: Record<TalkId, string[]>;
      };
      if (parsed.progress) setProgress(parsed.progress);
      if (parsed.answers) setAnswers(parsed.answers);
    } catch {
      // ignore broken local state
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ progress, answers })
    );
  }, [progress, answers]);

  const talk = useMemo(
    () => talks.find((item) => item.id === selectedId) ?? talks[0],
    [selectedId]
  );

  const doneCount = Object.values(progress).reduce(
    (sum, item) =>
      sum +
      Number(item.firstWatch) +
      Number(item.secondWatch) +
      Number(item.answered),
    0
  );

  function toggleStep(key: keyof Progress[TalkId]) {
    setProgress((prev) => ({
      ...prev,
      [talk.id]: {
        ...prev[talk.id],
        [key]: !prev[talk.id][key]
      }
    }));
  }

  function setAnswer(index: number, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [talk.id]: prev[talk.id].map((item, i) => (i === index ? value : item))
    }));
  }

  function resetCurrent() {
    setProgress((prev) => ({
      ...prev,
      [talk.id]: { firstWatch: false, secondWatch: false, answered: false }
    }));
    setAnswers((prev) => ({
      ...prev,
      [talk.id]: ["", "", ""]
    }));
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#07111f_42%,#020617_100%)] text-white">
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/display"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-200"
          >
            <ArrowLeft size={18} />
            Screen
          </Link>

          <div className="text-right">
            <div className="text-[10px] font-black tracking-[0.22em] text-cyan-200">
              TED ENGLISH LAB
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Listening · Speaking · Reading · Writing
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div>
                <div className="flex items-center gap-2 text-xs font-black tracking-[0.15em] text-violet-200">
                  <PlayCircle className="h-4 w-4" />
                  THIS WEEK
                </div>
                <h1 className="mt-2 text-2xl font-black sm:text-4xl">
                  {talk.title}
                </h1>
                <div className="mt-2 text-sm text-slate-300">
                  {talk.speaker} · {talk.duration} · {talk.level}
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                  {talk.why}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black tracking-[0.14em] text-slate-400">
                  TALK
                </label>
                <div className="mt-2 grid gap-2">
                  {talks.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`rounded-xl border px-3 py-3 text-left ${
                        item.id === talk.id
                          ? "border-cyan-200/35 bg-cyan-300/10"
                          : "border-white/7 bg-white/[0.03]"
                      }`}
                    >
                      <div className="text-[10px] font-black text-cyan-200">
                        WEEK {index + 1}
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">
                        {item.title}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  Progress {doneCount}/6
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                <div className="aspect-video">
                  <iframe
                    key={talk.id}
                    src={talk.embedUrl}
                    title={`${talk.title} - TED`}
                    className="h-full w-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200/10 bg-sky-300/[0.05] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black tracking-[0.12em] text-sky-200">
                      SUBTITLES / 字幕
                    </div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-300">
                      TEDプレーヤーの CC / 字幕メニューから
                      <span className="font-bold text-white"> English </span>
                      または
                      <span className="font-bold text-white"> 日本語 </span>
                      を選択してください。
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      第1回は English subtitles、第2回は English → 日本語確認がおすすめ。
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={talk.tedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/6 px-3 text-xs font-bold text-slate-200"
                    >
                      TED <ExternalLink size={14} />
                    </a>
                    <a
                      href={talk.tedEdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-300/10 px-3 text-xs font-bold text-violet-100"
                    >
                      TED-Ed <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200/10 bg-emerald-300/[0.045] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black tracking-[0.12em] text-emerald-200">
                      10–15 MIN STUDY
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      全文翻訳ではなく、聞く → 気づく → 自分の言葉で答える
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetCurrent}
                    className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-white/5 px-3 text-xs font-bold text-slate-400"
                  >
                    <RotateCcw size={14} />
                    RESET
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    ["firstWatch", "1st WATCH", "English字幕。止めずに見る。"],
                    ["secondWatch", "2nd WATCH", "3文 + 新しい単語3個を見つける。"],
                    ["answered", "ANSWER", "3問を英語で答える。"]
                  ].map(([key, label, help]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleStep(key as keyof Progress[TalkId])}
                      className={`rounded-xl border p-3 text-left ${
                        progress[talk.id][key as keyof Progress[TalkId]]
                          ? "border-emerald-200/30 bg-emerald-300/12"
                          : "border-white/7 bg-slate-950/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          size={18}
                          className={
                            progress[talk.id][key as keyof Progress[TalkId]]
                              ? "text-emerald-300"
                              : "text-slate-600"
                          }
                        />
                        <span className="text-sm font-black">{label}</span>
                      </div>
                      <div className="mt-2 text-xs leading-relaxed text-slate-400">
                        {help}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-200/10 bg-violet-300/[0.04] p-4">
                <div className="text-xs font-black tracking-[0.12em] text-violet-200">
                  SPEAK / WRITE
                </div>
                <div className="mt-4 grid gap-4">
                  {talk.questions.map((question, index) => (
                    <label key={question} className="grid gap-2">
                      <span className="text-sm font-bold text-white">
                        {index + 1}. {question}
                      </span>
                      <textarea
                        value={answers[talk.id][index] ?? ""}
                        onChange={(e) => setAnswer(index, e.target.value)}
                        rows={2}
                        placeholder="Answer in English..."
                        className="rounded-xl border border-white/10 bg-slate-950/55 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-200/40"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <aside className="min-w-0">
              <div className="rounded-2xl border border-amber-200/10 bg-amber-200/[0.035]">
                <div className="border-b border-white/7 px-4 py-3">
                  <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-amber-200">
                    <BookOpen size={15} />
                    VOCAB · 12 WORDS
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    英語 → 日本語 → 中文
                  </div>
                </div>

                <div className="max-h-[72vh] space-y-2 overflow-y-auto p-3">
                  {talk.vocab.map((item) => (
                    <div
                      key={item.word}
                      className="rounded-xl border border-white/7 bg-slate-950/30 p-3"
                    >
                      <div className="text-base font-black text-white">
                        {item.word}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-amber-100">
                        🇯🇵 {item.ja}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-cyan-100">
                        🇨🇳 {item.zh}
                      </div>
                      {item.note ? (
                        <div className="mt-2 text-xs leading-relaxed text-slate-500">
                          {item.note}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
