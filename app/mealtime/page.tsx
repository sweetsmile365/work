"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  ExternalLink,
  Globe2,
  Newspaper,
  Pause,
  Play,
  RotateCcw,
  Sparkles
} from "lucide-react";

const CNN10_UPLOADS_PLAYLIST = "UUTOoRgpHTjAQPk6Ak70u-pA";
const NATGEO_KIDS_NEWEST_PLAYLIST = "PLQlnTldJs0ZQExTCjWSXXkCdfSvpjT5cO";

const timeForKidsPool = [
  {
    title: "TIME for Kids · Grades 5–6",
    subtitle: "Current Events for Students",
    url: "https://www.timeforkids.com/g56/"
  },
  {
    title: "TIME for Kids · Science",
    subtitle: "Science & Technology",
    url: "https://www.timeforkids.com/g56/"
  },
  {
    title: "TIME for Kids · World",
    subtitle: "World News for Students",
    url: "https://www.timeforkids.com/g56/"
  },
  {
    title: "TIME for Kids · Sports",
    subtitle: "Sports & People",
    url: "https://www.timeforkids.com/g56/"
  }
] as const;

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

function playlistEmbedUrl(playlistId: string, index = 0) {
  return (
    `https://www.youtube-nocookie.com/embed/videoseries` +
    `?list=${playlistId}` +
    `&index=${index}` +
    `&rel=0&playsinline=1&modestbranding=1`
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
    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/45 p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-amber-200">
            <Clock3 size={14} />
            MEAL TIME
          </div>
          <div className="mt-1 text-xs text-slate-400">15分 · 見る / 聞く</div>
        </div>

        <div className="text-3xl font-bold tabular-nums text-white">{label}</div>
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

function PlaylistPlayer({
  playlistId,
  index = 0,
  title
}: {
  playlistId: string;
  index?: number;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <iframe
        key={`${playlistId}-${index}`}
        className="aspect-video w-full"
        src={playlistEmbedUrl(playlistId, index)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export default function MealTimePage() {
  const today = tokyoDayKey();
  const seed = daySeed(today);

  // CNN10 always starts from the newest upload.
  const cnnIndex = 0;

  // Nat Geo rotates among the first seven items in its official newest-video playlist.
  const natGeoIndex = seed % 7;

  const timePick = timeForKidsPool[seed % timeForKidsPool.length];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_16%_0%,rgba(56,189,248,0.09),transparent_27%),radial-gradient(circle_at_90%_8%,rgba(52,211,153,0.06),transparent_22%),linear-gradient(145deg,#08131f,#0a1724_52%,#07121d)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
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
              <span>公式YouTube · ページ内再生 · 自動更新</span>
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-slate-400">
                {today}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-[320px]">
            <MealTimer />
          </div>
        </header>

        <section className="mt-6 rounded-[28px] border border-white/[0.06] bg-white/[0.025] p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="rounded-2xl border border-sky-300/10 bg-slate-950/36 p-4">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-sky-200">
                <Newspaper size={17} />
                TODAY'S NEWS
              </div>

              <div className="mt-2 text-xl font-bold">CNN 10</div>
              <div className="mt-1 text-sm text-slate-400">
                Latest student news · 約10分
              </div>

              <div className="mt-4">
                <PlaylistPlayer
                  playlistId={CNN10_UPLOADS_PLAYLIST}
                  index={cnnIndex}
                  title="CNN 10 latest student news"
                />
              </div>

              <div className="mt-3 rounded-xl bg-slate-950/30 p-3 text-xs leading-relaxed text-slate-400">
                CNN 10公式チャンネルの最新アップロードを直接表示。
                API取得待ちはありません。
              </div>
            </article>

            <div className="grid gap-4">
              <article className="rounded-2xl border border-emerald-300/10 bg-slate-950/36 p-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-emerald-200">
                  <Globe2 size={17} />
                  QUICK VIDEO
                </div>

                <div className="mt-2 text-lg font-bold">Nat Geo Kids</div>
                <div className="mt-1 text-xs text-slate-400">
                  Daily pick · 2–4 min
                </div>

                <div className="mt-3">
                  <PlaylistPlayer
                    playlistId={NATGEO_KIDS_NEWEST_PLAYLIST}
                    index={natGeoIndex}
                    title="Nat Geo Kids daily video"
                  />
                </div>

                <div className="mt-2 text-xs leading-relaxed text-slate-400">
                  最新動画プレイリストの先頭7本から日付で1本を選択。
                </div>
              </article>

              <article className="rounded-2xl border border-violet-300/10 bg-slate-950/36 p-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-violet-200">
                  <BookOpen size={17} />
                  EASY READ
                </div>

                <div className="mt-2 text-lg font-bold">TIME for Kids</div>
                <div className="mt-1 text-xs text-slate-400">
                  Grades 5–6 · 3–5 min
                </div>

                <div className="mt-4 rounded-xl bg-white/[0.04] p-3">
                  <div className="text-sm font-semibold text-white">
                    {timePick.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {timePick.subtitle}
                  </div>
                </div>

                <a
                  href={timePick.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-300/10 px-3 text-xs font-semibold text-violet-100 active:bg-violet-300/20"
                >
                  READ
                  <ExternalLink size={14} />
                </a>
              </article>
            </div>
          </div>

          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <div className="text-center text-xs font-bold tracking-[0.16em] text-slate-400">
              MORE
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <a
                href="https://www.youtube.com/@cnn10"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-sky-300/10 px-3 py-1.5 text-xs font-semibold text-sky-100"
              >
                CNN10
              </a>
              <a
                href="https://www.youtube.com/@natgeokids"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100"
              >
                NatGeo
              </a>
              <a
                href="https://www.timeforkids.com/g56/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-violet-300/10 px-3 py-1.5 text-xs font-semibold text-violet-100"
              >
                TIME
              </a>
              <a
                href="https://newsela.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100"
              >
                Newsela · CHALLENGE
              </a>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
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
        </section>
      </div>
    </main>
  );
}
