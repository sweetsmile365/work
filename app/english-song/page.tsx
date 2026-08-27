"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2
} from "lucide-react";

type SongItem = {
  id: string;
  name: string;
  stem: string;
  audioUrl: string;
  lyricId?: string;
};

type SongListResponse = {
  ok: boolean;
  folderUrl?: string;
  items: SongItem[];
  error?: string;
};

type LyricLine = {
  start: number;
  end: number;
  text: string;
  ja?: string;
  zh?: string;
};

type VocabItem = {
  word: string;
  ja: string;
  zh: string;
  note?: string;
};

type LyricsPayload = {
  title?: string;
  artist?: string;
  lines: LyricLine[];
  vocab?: VocabItem[];
};

const SPEEDS = [0.75, 0.9, 1, 1.15, 1.25];

function fmt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function completeKey(id: string) {
  return `english-song-complete-count:${id}`;
}

function lineKey(songId: string, index: number) {
  return `english-song-line-practice:${songId}:${index}`;
}

export default function EnglishSongPage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lineRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [songs, setSongs] = useState<SongItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [lyrics, setLyrics] = useState<LyricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lyricLoading, setLyricLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatLine, setRepeatLine] = useState<number | null>(null);
  const [completeCount, setCompleteCount] = useState(0);
  const [practiceCounts, setPracticeCounts] = useState<Record<number, number>>({});
  const [showTranslation, setShowTranslation] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void fetch("/api/english-song", { cache: "no-store" })
      .then(async (r) => (await r.json()) as SongListResponse)
      .then((data) => {
        if (cancelled) return;
        setSongs(data.items ?? []);
        setSelectedId((data.items ?? [])[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) setSongs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selected =
    songs.find((song) => song.id === selectedId) ?? songs[0] ?? null;

  useEffect(() => {
    if (!selected) return;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = selected.audioUrl;
      audio.load();
      audio.playbackRate = speed;
    }

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setRepeatLine(null);

    if (typeof window !== "undefined") {
      const count = Number(window.localStorage.getItem(completeKey(selected.id)));
      setCompleteCount(Number.isFinite(count) ? count : 0);

      const counts: Record<number, number> = {};
      for (let i = 0; i < 200; i += 1) {
        const value = Number(
          window.localStorage.getItem(lineKey(selected.id, i))
        );
        if (Number.isFinite(value) && value > 0) counts[i] = value;
      }
      setPracticeCounts(counts);
    }

    if (!selected.lyricId) {
      setLyrics(null);
      return;
    }

    let cancelled = false;
    setLyricLoading(true);

    void fetch(`/api/english-song?lyrics=${encodeURIComponent(selected.lyricId)}`, {
      cache: "no-store"
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("lyrics");
        return (await r.json()) as LyricsPayload;
      })
      .then((data) => {
        if (!cancelled) setLyrics(data);
      })
      .catch(() => {
        if (!cancelled) setLyrics(null);
      })
      .finally(() => {
        if (!cancelled) setLyricLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const activeLine = useMemo(() => {
    const lines = lyrics?.lines ?? [];
    if (!lines.length) return -1;

    const exact = lines.findIndex(
      (line) =>
        currentTime >= line.start &&
        currentTime < Math.max(line.end, line.start + 0.2)
    );
    if (exact >= 0) return exact;

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      if (currentTime >= lines[i].start) return i;
    }

    return -1;
  }, [currentTime, lyrics]);

  useEffect(() => {
    if (activeLine < 0) return;
    lineRefs.current[activeLine]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth"
    });
  }, [activeLine]);

  useEffect(() => {
    if (repeatLine === null || !lyrics?.lines?.[repeatLine]) return;
    const line = lyrics.lines[repeatLine];

    if (currentTime >= line.end - 0.03) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = line.start;
      setCurrentTime(line.start);
      void audio.play().catch(() => undefined);
    }
  }, [currentTime, repeatLine, lyrics]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      return;
    }

    try {
      audio.playbackRate = speed;
      await audio.play();
    } catch {
      setPlaying(false);
    }
  }

  function seekTo(value: number) {
    const audio = audioRef.current;
    if (!audio) return;

    const upper = Number.isFinite(audio.duration) ? audio.duration : duration;
    const next = Math.max(0, Math.min(value, upper || value));
    audio.currentTime = next;
    setCurrentTime(next);
  }

  function practiceLine(index: number) {
    const line = lyrics?.lines?.[index];
    if (!line || !selected) return;

    setRepeatLine(null);
    seekTo(line.start + 0.01);

    const next = (practiceCounts[index] ?? 0) + 1;
    setPracticeCounts((prev) => ({ ...prev, [index]: next }));

    if (typeof window !== "undefined") {
      window.localStorage.setItem(lineKey(selected.id, index), String(next));
    }

    void audioRef.current?.play().catch(() => undefined);
  }

  function toggleRepeat(index: number) {
    if (repeatLine === index) {
      setRepeatLine(null);
      return;
    }

    setRepeatLine(index);
    const line = lyrics?.lines?.[index];
    if (!line || !selected) return;

    seekTo(line.start + 0.01);

    const next = (practiceCounts[index] ?? 0) + 1;
    setPracticeCounts((prev) => ({ ...prev, [index]: next }));

    if (typeof window !== "undefined") {
      window.localStorage.setItem(lineKey(selected.id, index), String(next));
    }

    void audioRef.current?.play().catch(() => undefined);
  }

  function previousSong() {
    if (!selected) return;
    const index = songs.findIndex((s) => s.id === selected.id);
    if (index > 0) setSelectedId(songs[index - 1].id);
  }

  function nextSong() {
    if (!selected) return;
    const index = songs.findIndex((s) => s.id === selected.id);
    if (index >= 0 && index < songs.length - 1) {
      setSelectedId(songs[index + 1].id);
    }
  }

  const title =
    lyrics?.title ?? selected?.name.replace(/\.[^.]+$/, "") ?? "English Song";

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
              ENGLISH SONG LAB
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Listen · Repeat · Sing · Understand
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/50 shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="flex items-center gap-2 text-xs font-black tracking-[0.15em] text-violet-200">
                  <Headphones className="h-4 w-4" />
                  NOW LEARNING
                </div>
                <h1 className="mt-2 text-2xl font-black sm:text-4xl">{title}</h1>
                <div className="mt-1 text-sm text-slate-400">
                  {lyrics?.artist ?? "Google Drive Song Library"}
                </div>
                <div className="mt-3 inline-flex rounded-full border border-emerald-200/15 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                  完整练习 {completeCount} 遍 · 完走 {completeCount} 回
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black tracking-[0.14em] text-slate-400">
                  SONG
                </label>
                <select
                  value={selected?.id ?? ""}
                  onChange={(e) => setSelectedId(e.target.value)}
                  disabled={loading || songs.length === 0}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm font-bold text-white outline-none"
                >
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.name.replace(/\.[^.]+$/, "")}
                    </option>
                  ))}
                </select>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={previousSong}
                    className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/5 text-xs font-bold text-slate-300"
                  >
                    <ChevronLeft size={16} /> PREV
                  </button>
                  <button
                    type="button"
                    onClick={nextSong}
                    className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/5 text-xs font-bold text-slate-300"
                  >
                    NEXT <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <audio
            ref={audioRef}
            preload="metadata"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d)) setDuration(d);
              e.currentTarget.playbackRate = speed;
            }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              if (!selected || typeof window === "undefined") return;
              const next = completeCount + 1;
              setCompleteCount(next);
              window.localStorage.setItem(completeKey(selected.id), String(next));
            }}
          />

          <div className="border-b border-white/10 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => seekTo(currentTime - 5)}
                className="grid h-12 w-12 place-items-center rounded-xl bg-white/7"
              >
                <SkipBack size={20} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="inline-flex min-h-14 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 text-base font-black text-slate-950"
              >
                {playing ? <Pause size={24} /> : <Play size={24} />}
                {playing ? "PAUSE" : "PLAY"}
              </button>

              <button
                type="button"
                onClick={() => seekTo(currentTime + 5)}
                className="grid h-12 w-12 place-items-center rounded-xl bg-white/7"
              >
                <SkipForward size={20} />
              </button>

              <button
                type="button"
                onClick={() => setShowTranslation((v) => !v)}
                className={`min-h-12 rounded-xl px-4 text-xs font-black ${
                  showTranslation
                    ? "bg-violet-300/15 text-violet-100"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                JP / 中文 {showTranslation ? "ON" : "OFF"}
              </button>
            </div>

            <div className="mx-auto mt-4 max-w-4xl">
              <input
                type="range"
                min={0}
                max={Math.max(duration, currentTime, 1)}
                step={0.05}
                value={Math.min(currentTime, Math.max(duration, currentTime, 1))}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full accent-cyan-300"
              />
              <div className="mt-1 flex justify-between text-xs tabular-nums text-slate-400">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-black tracking-[0.12em] text-slate-500">
                <Volume2 size={14} /> SPEED
              </span>

              {SPEEDS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSpeed(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-black ${
                    speed === value
                      ? "bg-emerald-300 text-slate-950"
                      : "bg-white/5 text-slate-300"
                  }`}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">
              Google Drive の曲を読み込み中…
            </div>
          ) : songs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="font-bold text-amber-100">
                Google Drive に曲が見つかりません。
              </div>
              <div className="mt-2 text-sm text-slate-400">
                ENGLISH_SONGS_FOLDER_ID を設定し、同じファイル名の mp3 と json
                を共有フォルダに置いてください。
              </div>
            </div>
          ) : lyricLoading ? (
            <div className="p-8 text-center text-slate-400">
              歌詞データを読み込み中…
            </div>
          ) : !lyrics?.lines?.length ? (
            <div className="p-8 text-center text-slate-400">
              この曲には対応する学習用 JSON がありません。
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-black tracking-[0.15em] text-cyan-200">
                      LINE BY LINE
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      一句一句听 · 点击句子重播 · LOOP 反复练
                    </div>
                  </div>

                  {repeatLine !== null ? (
                    <button
                      type="button"
                      onClick={() => setRepeatLine(null)}
                      className="rounded-xl bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-200"
                    >
                      STOP LOOP
                    </button>
                  ) : null}
                </div>

                <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                  {lyrics.lines.map((line, index) => {
                    const active = index === activeLine;
                    const looping = index === repeatLine;

                    return (
                      <div
                        key={`${line.start}-${index}`}
                        className={`rounded-2xl border p-3 sm:p-4 ${
                          active
                            ? "border-cyan-200/60 bg-cyan-300/12"
                            : "border-white/7 bg-white/[0.025]"
                        }`}
                      >
                        <button
                          ref={(el) => {
                            lineRefs.current[index] = el;
                          }}
                          type="button"
                          onClick={() => practiceLine(index)}
                          className="block w-full text-left"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-1 shrink-0 text-xs font-bold tabular-nums text-slate-500">
                              {fmt(line.start)}
                            </span>

                            <div className="min-w-0">
                              <div
                                className={`text-[clamp(1.15rem,1.7vw,1.65rem)] leading-[1.55] ${
                                  active
                                    ? "font-black text-white"
                                    : "font-bold text-slate-200"
                                }`}
                              >
                                {line.text}
                              </div>

                              {showTranslation ? (
                                <div className="mt-2 space-y-1 text-sm">
                                  {line.ja ? (
                                    <div className="text-amber-100">
                                      🇯🇵 {line.ja}
                                    </div>
                                  ) : null}
                                  {line.zh ? (
                                    <div className="text-cyan-100">
                                      🇨🇳 {line.zh}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </button>

                        <div className="mt-3 flex flex-wrap items-center gap-2 sm:pl-12">
                          <button
                            type="button"
                            onClick={() => practiceLine(index)}
                            className="rounded-lg bg-white/6 px-3 py-2 text-[11px] font-black text-slate-200"
                          >
                            LISTEN
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleRepeat(index)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black ${
                              looping
                                ? "bg-violet-300 text-slate-950"
                                : "bg-violet-300/10 text-violet-100"
                            }`}
                          >
                            <RotateCcw size={13} />
                            LOOP
                          </button>

                          <span className="text-[10px] text-slate-500">
                            練習 {practiceCounts[index] ?? 0} 回
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <aside className="min-w-0">
                <div className="rounded-2xl border border-amber-200/10 bg-amber-200/[0.035]">
                  <div className="border-b border-white/7 px-4 py-3">
                    <div className="text-[10px] font-black tracking-[0.15em] text-amber-200">
                      SONG VOCAB
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      歌の中で覚えたい単語
                    </div>
                  </div>

                  <div className="max-h-[58vh] space-y-2 overflow-y-auto p-3">
                    {(lyrics.vocab ?? []).length > 0 ? (
                      lyrics.vocab!.map((item) => (
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
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        vocab がまだ登録されていません。
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-200/10 bg-emerald-200/[0.035] p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-emerald-100">
                    <CheckCircle2 size={18} />
                    今日のやり方
                  </div>
                  <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
                    <div>1. まず1回そのまま聴く</div>
                    <div>2. 1文ずつ LISTEN → LOOP</div>
                    <div>3. 歌詞を見ながら一緒に歌う</div>
                    <div>4. 最後に歌詞を見ずに1回</div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
