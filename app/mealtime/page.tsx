"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Headphones,
  Newspaper,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles
} from "lucide-react";

type YoutubePick = {
  videoId: string;
  title: string;
  published?: string;
  description?: string;
  channel: string;
};

type MealResponse = {
  ok: boolean;
  dayKey: string;
  updatedAt: string;
  picks: {
    cnn10: YoutubePick | null;
    natGeo: YoutubePick | null;
  };
};

const fallback: MealResponse = {
  ok: false,
  dayKey: "",
  updatedAt: "",
  picks: {
    cnn10: null,
    natGeo: null
  }
};

function formatPublished(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function youtubeEmbedUrl(videoId: string) {
  return (
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    "?rel=0&playsinline=1&modestbranding=1"
  );
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

  const label = useMemo(() => {
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
            15分 · 見る / 聞く
          </div>
        </div>

        <div className="text-3xl font-bold tabular-nums text-white">
          {label}
        </div>
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

function VideoPanel({
  pick,
  kind
}: {
  pick: YoutubePick | null;
  kind: "news" | "english";
}) {
  if (!pick) {
    return (
      <div className="grid min-h-[360px] place-items-center rounded-2xl border border-white/[0.07] bg-slate-950/30 px-6 text-center text-sm text-slate-400">
        今日の動画を取得中です。しばらくして「更新」を押してください。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-950/30">
      <div className="aspect-video bg-black">
        <iframe
          key={pick.videoId}
          className="h-full w-full"
          src={youtubeEmbedUrl(pick.videoId)}
          title={pick.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              kind === "news"
                ? "bg-sky-300/12 text-sky-100"
                : "bg-emerald-300/12 text-emerald-100"
            }`}
          >
            {kind === "news" ? "NEWS · 10 min" : "EASY VIDEO"}
          </span>

          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-slate-300">
            {pick.channel}
          </span>

          {formatPublished(pick.published) ? (
            <span className="text-[10px] text-slate-500">
              {formatPublished(pick.published)}
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 text-lg font-bold leading-snug text-white sm:text-xl">
          {pick.title}
        </h3>

        {pick.description ? (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
            {pick.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function MealTimePage() {
  const [content, setContent] = useState<MealResponse>(fallback);
  const [loading, setLoading] = useState(true);

  async function loadToday(force = false) {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/mealtime?v=cnn10-natgeo-1${force ? `&t=${Date.now()}` : ""}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("Failed");

      const value = (await response.json()) as MealResponse;
      if (value?.picks) setContent(value);
    } catch {
      // Keep the last good content on screen.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadToday();

    // Re-check periodically. This also catches midnight rollover.
    const timer = window.setInterval(() => {
      void loadToday();
    }, 30 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(52,211,153,0.08),transparent_24%),linear-gradient(145deg,#071320,#0b1826_48%,#07121f)] text-white">
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
              <span>CNN 10 + Nat Geo Kids · ページ内再生</span>

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

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          <article className="rounded-3xl border border-sky-300/10 bg-sky-300/[0.045] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-300/10 text-sky-200">
                <Newspaper size={21} />
              </div>

              <div>
                <div className="text-xs font-bold tracking-[0.12em] text-sky-200">
                  TODAY'S NEWS
                </div>
                <h2 className="mt-0.5 text-xl font-bold">
                  CNN 10 · 今日のニュース
                </h2>
              </div>
            </div>

            <VideoPanel pick={content.picks.cnn10} kind="news" />

            <div className="mt-3 rounded-xl bg-slate-950/30 p-3 text-xs leading-relaxed text-slate-400">
              全部の単語を理解しなくてOK。
              「今日のニュースは何についてだった？」が分かれば十分。
            </div>
          </article>

          <article className="rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.045] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200">
                <Headphones size={21} />
              </div>

              <div>
                <div className="text-xs font-bold tracking-[0.12em] text-emerald-200">
                  TODAY'S EASY VIDEO
                </div>
                <h2 className="mt-0.5 text-xl font-bold">
                  Nat Geo Kids
                </h2>
              </div>
            </div>

            <VideoPanel pick={content.picks.natGeo} kind="english" />

            <div className="mt-3 rounded-xl bg-slate-950/30 p-3 text-xs leading-relaxed text-slate-400">
              毎日、最近のNat Geo Kids動画から1本を自動選択。
              動物・科学・世界の内容を英語で楽しむ。
            </div>
          </article>
        </section>

        <section className="mt-5 rounded-3xl border border-white/[0.07] bg-slate-950/35 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.04] p-3">
              <div className="text-xs text-slate-400">NEWS</div>
              <div className="mt-1 font-semibold text-white">
                What was the news about?
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.04] p-3">
              <div className="text-xs text-slate-400">WORD</div>
              <div className="mt-1 font-semibold text-white">
                I heard the word ...
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
