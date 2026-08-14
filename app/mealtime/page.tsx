"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  ExternalLink,
  Headphones,
  Newspaper,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles
} from "lucide-react";

type Pick = {
  title: string;
  link: string;
  published?: string;
  description?: string;
  source: string;
  level: "EASY" | "NORMAL";
  minutes: string;
  live: boolean;
};

type MealResponse = {
  ok: boolean;
  dayKey: string;
  updatedAt: string;
  picks: {
    mainNews: Pick;
    shortNews: Pick;
    easyVideo: Pick;
    normalVideo: Pick;
  };
};

const fallback: MealResponse = {
  ok: false,
  dayKey: "",
  updatedAt: "",
  picks: {
    mainNews: {
      title: "VOA Learning English · As It Is",
      link: "https://learningenglish.voanews.com/z/1579",
      source: "VOA · As It Is",
      level: "NORMAL",
      minutes: "5–8 min",
      live: false
    },
    shortNews: {
      title: "VOA60 · Watch & Learn",
      link: "https://learningenglish.voanews.com/z/3613",
      source: "VOA60",
      level: "EASY",
      minutes: "1–3 min",
      live: false
    },
    easyVideo: {
      title: "English in a Minute",
      link: "https://learningenglish.voanews.com/z/3614",
      source: "English in a Minute",
      level: "EASY",
      minutes: "1–3 min",
      live: false
    },
    normalVideo: {
      title: "Let's Learn English · Level 2",
      link: "https://learningenglish.voanews.com/p/6765.html",
      source: "Let's Learn English · Level 2",
      level: "NORMAL",
      minutes: "5–8 min",
      live: false
    }
  }
};

function formatPublished(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric"
  }).format(date);
}

function MealTimer() {
  const total = 15 * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const id = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [running]);

  const text = useMemo(() => {
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remaining]);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/35 p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-amber-200">
            <Clock3 size={14} />
            MEAL TIME
          </div>
          <div className="mt-1 text-xs text-slate-400">
            15分だけ · 見る・聞くだけ
          </div>
        </div>
        <div className="text-3xl font-bold tabular-nums text-white">{text}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            if (remaining === 0) setRemaining(total);
            setRunning((value) => !value);
          }}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold ${
            running
              ? "bg-amber-300/15 text-amber-100"
              : "bg-amber-300 text-slate-950"
          }`}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "PAUSE" : remaining === 0 ? "RESTART" : "START"}
        </button>

        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining(total);
          }}
          className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white/[0.07] text-sm font-semibold text-slate-200"
        >
          <RotateCcw size={15} />
          RESET
        </button>
      </div>
    </div>
  );
}

function PickCard({
  pick,
  featured = false
}: {
  pick: Pick;
  featured?: boolean;
}) {
  return (
    <a
      href={pick.link}
      target="_blank"
      rel="noreferrer"
      className={`group block rounded-2xl border border-white/[0.07] bg-slate-950/28 transition hover:bg-white/[0.07] ${
        featured ? "p-5" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                pick.level === "EASY"
                  ? "bg-emerald-300/12 text-emerald-100"
                  : "bg-sky-300/12 text-sky-100"
              }`}
            >
              {pick.level}
            </span>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-slate-300">
              {pick.minutes}
            </span>
            {pick.live ? (
              <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[9px] font-bold text-cyan-100">
                AUTO
              </span>
            ) : null}
          </div>

          <h3
            className={`mt-3 font-bold leading-snug text-white ${
              featured ? "text-xl sm:text-2xl" : "text-base"
            }`}
          >
            {pick.title}
          </h3>

          <div className="mt-2 text-xs font-semibold text-slate-400">
            {pick.source}
            {formatPublished(pick.published)
              ? ` · ${formatPublished(pick.published)}`
              : ""}
          </div>

          {pick.description ? (
            <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-300">
              {pick.description}
            </p>
          ) : null}
        </div>

        <ExternalLink
          size={18}
          className="shrink-0 text-slate-500 transition group-hover:text-white"
        />
      </div>
    </a>
  );
}

export default function MealTimePage() {
  const [content, setContent] = useState<MealResponse>(fallback);
  const [loading, setLoading] = useState(true);

  async function loadToday(force = false) {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/mealtime${force ? `?t=${Date.now()}` : ""}`,
        {
          cache: force ? "no-store" : "default"
        }
      );

      if (!response.ok) throw new Error("Failed");

      const value = (await response.json()) as MealResponse;
      if (value?.picks) setContent(value);
    } catch {
      setContent((current) => current || fallback);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadToday();

    // Refresh after midnight without requiring a page reload.
    const timer = window.setInterval(() => {
      void loadToday();
    }, 30 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(251,191,36,0.08),transparent_24%),linear-gradient(145deg,#071320,#0b1826_48%,#07121f)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/display"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 text-sm font-semibold text-slate-300"
            >
              <ArrowLeft size={16} />
              Screenへ戻る
            </Link>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-amber-200">
              <Sparkles size={17} />
              TODAY'S NEWS & ENGLISH
            </div>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              ごはん時間の英語
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span>毎日、自動で今日の内容に更新</span>
              {content.dayKey ? (
                <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-slate-400">
                  {content.dayKey}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void loadToday(true)}
                disabled={loading}
                className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-white/[0.06] px-3 text-xs font-semibold text-slate-300 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                更新
              </button>
            </div>
          </div>

          <div className="w-full sm:w-[320px]">
            <MealTimer />
          </div>
        </header>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-sky-300/10 bg-sky-300/[0.045] p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-300/10 text-sky-200">
                <Newspaper size={21} />
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.12em] text-sky-200">
                  TODAY'S NEWS
                </div>
                <h2 className="mt-0.5 text-xl font-bold">
                  今日の英語ニュース
                </h2>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <PickCard pick={content.picks.mainNews} featured />
              <PickCard pick={content.picks.shortNews} />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950/30 p-3 text-xs leading-relaxed text-slate-400">
              全部理解しなくてOK。「何のニュースだった？」が分かれば十分。
            </div>
          </article>

          <article className="rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.045] p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200">
                <Headphones size={21} />
              </div>
              <div>
                <div className="text-xs font-bold tracking-[0.12em] text-emerald-200">
                  TODAY'S ENGLISH VIDEO
                </div>
                <h2 className="mt-0.5 text-xl font-bold">
                  今日のわかりやすい英語
                </h2>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <PickCard pick={content.picks.easyVideo} featured />
              <PickCard pick={content.picks.normalVideo} />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950/30 p-3 text-xs leading-relaxed text-slate-400">
              EASYから見る。難しい時だけ英語字幕をON。食事中は書かなくてOK。
            </div>
          </article>
        </section>

        <section className="mt-5 rounded-3xl border border-white/[0.07] bg-slate-950/35 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-violet-200">
            <BookOpen size={17} />
            AFTER MEAL · OPTIONAL
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.04] p-3">
              <div className="text-xs text-slate-400">NEWS</div>
              <div className="mt-1 font-semibold text-white">
                What was the news about?
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-3">
              <div className="text-xs text-slate-400">WORD</div>
              <div className="mt-1 font-semibold text-white">
                One word I remember is ...
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-3">
              <div className="text-xs text-slate-400">SAY</div>
              <div className="mt-1 font-semibold text-white">
                Today I learned ...
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
