"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Headphones,
  Pause,
  Play,
  Square,
  Volume2,
  X
} from "lucide-react";

type AudioKind = "reading" | "vocab";

type AudioItem = {
  id: string;
  name: string;
  viewUrl: string;
  audioUrl: string;
  subtitleUrl: string;
};

type AudioListResponse = {
  ok: boolean;
  kind: AudioKind;
  label?: string;
  folderUrl: string;
  needsSharing?: boolean;
  items: AudioItem[];
  error?: string;
};

type SubtitleSegment = {
  start: number;
  end: number;
  text: string;
};

type SubtitlePayload = {
  source_file?: string;
  duration?: number;
  model?: string;
  segments?: SubtitleSegment[];
};

const SPEEDS = [0.75, 0.9, 1, 1.15, 1.25, 1.5];

const KIND_LABELS: Record<AudioKind, string> = {
  reading: "READING AUDIO",
  vocab: "VOCAB AUDIO"
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const secs = String(whole % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function progressKey(itemId: string) {
  return `english-book-audio-position:${itemId}`;
}

function lastItemKey(kind: AudioKind) {
  return `english-book-audio-last:${kind}`;
}

export default function EnglishBookAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const subtitleRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastSavedSecond = useRef(-1);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<AudioKind>("reading");
  const [list, setList] = useState<AudioListResponse | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState<SubtitlePayload | null>(null);
  const [subtitleLoading, setSubtitleLoading] = useState(false);
  const [subtitleOn, setSubtitleOn] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("audio") === "1") {
      setOpen(true);
    }
  }, []);

  const items = list?.items ?? [];

  const selected =
    items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  const selectedIndex = selected
    ? items.findIndex((item) => item.id === selected.id)
    : -1;

  const activeSegmentIndex = useMemo(() => {
    const segments = subtitle?.segments ?? [];
    if (segments.length === 0) return -1;

    const exact = segments.findIndex(
      (segment) =>
        currentTime >= segment.start &&
        currentTime < Math.max(segment.end, segment.start + 0.15)
    );

    if (exact >= 0) return exact;

    for (let index = segments.length - 1; index >= 0; index -= 1) {
      if (currentTime >= segments[index].start) return index;
    }

    return -1;
  }, [currentTime, subtitle]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setListLoading(true);
    setList(null);
    setSelectedId(null);

    void fetch(`/api/book-audio?kind=${kind}`, { cache: "no-store" })
      .then(async (response) => {
        const value = (await response.json()) as AudioListResponse;
        if (cancelled) return;

        setList(value);

        const saved =
          typeof window !== "undefined"
            ? window.localStorage.getItem(lastItemKey(kind))
            : null;

        const initial =
          value.items.find((item) => item.id === saved) ??
          value.items[0] ??
          null;

        setSelectedId(initial?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setList({
            ok: false,
            kind,
            folderUrl: "",
            needsSharing: true,
            items: [],
            error: "Audio list could not be loaded."
          });
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, open]);

  useEffect(() => {
    if (!selected) {
      setSubtitle(null);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(lastItemKey(kind), selected.id);
    }

    let cancelled = false;
    setSubtitleLoading(true);
    setSubtitle(null);

    void fetch(selected.subtitleUrl, { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Subtitle ${response.status}`);
        }
        const value = (await response.json()) as SubtitlePayload;
        if (!cancelled) setSubtitle(value);
      })
      .catch(() => {
        if (!cancelled) setSubtitle({ segments: [] });
      })
      .finally(() => {
        if (!cancelled) setSubtitleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, selected]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selected) return;

    audio.pause();
    audio.src = selected.audioUrl;
    audio.playbackRate = speed;
    audio.load();

    setPlaying(false);
    setCurrentTime(0);
    setDuration(subtitle?.duration ?? 0);
    setAudioError(false);
    lastSavedSecond.current = -1;
  }, [selected?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (!subtitleOn || activeSegmentIndex < 0) return;
    subtitleRefs.current[activeSegmentIndex]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth"
    });
  }, [activeSegmentIndex, subtitleOn]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function restorePosition() {
    if (!selected || !audioRef.current || typeof window === "undefined") return;
    const saved = Number(window.localStorage.getItem(progressKey(selected.id)));
    if (
      Number.isFinite(saved) &&
      saved > 0 &&
      saved < Math.max(audioRef.current.duration || 0, subtitle?.duration || 0) - 2
    ) {
      audioRef.current.currentTime = saved;
      setCurrentTime(saved);
    }
  }

  function persistPosition(value: number) {
    if (!selected || typeof window === "undefined") return;
    const second = Math.floor(value);
    if (second === lastSavedSecond.current || second % 5 !== 0) return;

    lastSavedSecond.current = second;
    window.localStorage.setItem(progressKey(selected.id), String(value));
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !selected) return;

    setAudioError(false);

    if (playing) {
      audio.pause();
      return;
    }

    try {
      audio.playbackRate = speed;
      await audio.play();
    } catch {
      setAudioError(true);
      setPlaying(false);
    }
  }

  function stopPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setPlaying(false);
  }

  function seekTo(value: number) {
    const audio = audioRef.current;
    if (!audio) return;

    const upper =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : duration || subtitle?.duration || value;

    const next = Math.max(0, Math.min(value, upper));
    audio.currentTime = next;
    setCurrentTime(next);
  }

  function seekBy(delta: number) {
    seekTo(currentTime + delta);
  }

  function pickRelative(offset: number) {
    if (selectedIndex < 0) return;
    const next = items[selectedIndex + offset];
    if (next) setSelectedId(next.id);
  }

  function jumpToSegment(segment: SubtitleSegment) {
    seekTo(segment.start + 0.01);
    void audioRef.current?.play().catch(() => setAudioError(true));
  }

  const progressMax = Math.max(
    duration || 0,
    subtitle?.duration || 0,
    currentTime,
    1
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] inline-flex min-h-14 items-center gap-2 rounded-2xl border-2 border-violet-200/35 bg-violet-300 px-5 text-sm font-black text-slate-950 shadow-[0_14px_40px_rgba(139,92,246,0.38)] transition hover:bg-violet-200"
        aria-label="每日阅读音频播放器"
      >
        <Headphones className="h-5 w-5" />
        每日阅读 · AUDIO
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] bg-slate-950/82 p-3 backdrop-blur-md sm:p-5">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,#0b1724,#0b1f2b_52%,#0b1724)] text-white shadow-2xl">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-sky-200">
                  <BookOpen className="h-4 w-4" />
                  每日阅读 · ENGLISH AUDIO
                </div>
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  《超强英语阅读训练 1》
                </h2>
                <div className="mt-1 text-xs text-slate-400">
                  Google Drive Audio · Sync Subtitle · Speed Control
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  audioRef.current?.pause();
                  setOpen(false);
                }}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-slate-200"
                aria-label="关闭播放器"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="border-b border-white/[0.07] p-4 lg:border-b-0 lg:border-r">
                <div className="grid grid-cols-2 gap-2">
                  {(["reading", "vocab"] as AudioKind[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setKind(value)}
                      className={`min-h-11 rounded-xl text-xs font-bold ${
                        kind === value
                          ? "bg-sky-300 text-slate-950"
                          : "bg-white/[0.05] text-slate-300"
                      }`}
                    >
                      {KIND_LABELS[value]}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
                    SELECT
                  </label>

                  <select
                    value={selected?.id ?? ""}
                    onChange={(event) => setSelectedId(event.target.value)}
                    disabled={items.length === 0}
                    className="mt-2 h-11 w-full rounded-xl border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-white outline-none disabled:opacity-50"
                  >
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name.replace(/\.mp3$/i, "")}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => pickRelative(-1)}
                      disabled={selectedIndex <= 0}
                      className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/[0.05] text-xs font-semibold text-slate-300 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      PREV
                    </button>
                    <button
                      type="button"
                      onClick={() => pickRelative(1)}
                      disabled={
                        selectedIndex < 0 || selectedIndex >= items.length - 1
                      }
                      className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/[0.05] text-xs font-semibold text-slate-300 disabled:opacity-30"
                    >
                      NEXT
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {listLoading ? (
                  <div className="mt-4 rounded-xl bg-white/[0.04] p-3 text-xs text-slate-400">
                    Google Drive を読み込み中…
                  </div>
                ) : null}

                {!listLoading && list?.needsSharing ? (
                  <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.07] p-3 text-xs leading-relaxed text-amber-100">
                    Google Drive 文件夹目前无法从 Dashboard 读取。
                    <div className="mt-2 text-slate-300">
                      文件夹共享设置改成「知道链接的人 / 閲覧者」后，
                      这里会自动列出全部音频。
                    </div>
                    {list.folderUrl ? (
                      <a
                        href={list.folderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-300/10 px-3 py-2 font-semibold"
                      >
                        OPEN DRIVE
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {selected ? (
                  <div className="mt-4 rounded-xl bg-white/[0.035] p-3">
                    <div className="text-[10px] text-slate-500">
                      CURRENT TRACK
                    </div>
                    <div className="mt-1 break-words text-sm font-semibold text-white">
                      {selected.name}
                    </div>
                    <a
                      href={selected.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-200"
                    >
                      Google Driveで開く
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}
              </aside>

              <main className="min-h-0 overflow-y-auto p-4 sm:p-6">
                <audio
                  ref={audioRef}
                  preload="metadata"
                  onLoadedMetadata={(event) => {
                    const value = event.currentTarget.duration;
                    if (Number.isFinite(value)) setDuration(value);
                    event.currentTarget.playbackRate = speed;
                    restorePosition();
                  }}
                  onTimeUpdate={(event) => {
                    const value = event.currentTarget.currentTime;
                    setCurrentTime(value);
                    persistPosition(value);
                  }}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => setPlaying(false)}
                  onError={() => {
                    setAudioError(true);
                    setPlaying(false);
                  }}
                />

                {selected ? (
                  <>
                    <section className="rounded-2xl border border-sky-300/10 bg-slate-950/35 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold tracking-[0.12em] text-sky-200">
                            {KIND_LABELS[kind]}
                          </div>
                          <div className="mt-1 truncate text-lg font-bold">
                            {selected.name.replace(/\.mp3$/i, "")}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSubtitleOn((value) => !value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                            subtitleOn
                              ? "bg-violet-300/15 text-violet-100"
                              : "bg-white/[0.05] text-slate-400"
                          }`}
                        >
                          CC {subtitleOn ? "ON" : "OFF"}
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => seekBy(-10)}
                          className="min-h-12 rounded-xl border border-white/[0.08] bg-white/[0.07] px-4 text-sm font-bold text-slate-100"
                        >
                          −10s
                        </button>

                        <button
                          type="button"
                          onClick={togglePlay}
                          className="inline-flex min-h-14 min-w-[132px] items-center justify-center gap-2 rounded-xl border-2 border-cyan-100/60 px-5 text-base font-black shadow-[0_0_28px_rgba(103,232,249,0.28)]"
                          style={{ backgroundColor: "#67e8f9", color: "#07131f" }}
                          aria-label={playing ? "暂停" : "播放"}
                        >
                          {playing ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6" />
                          )}
                          {playing ? "PAUSE" : "PLAY"}
                        </button>

                        <button
                          type="button"
                          onClick={stopPlayback}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200/30 bg-rose-300/15 px-4 text-sm font-black text-rose-100"
                        >
                          <Square className="h-4 w-4 fill-current" />
                          STOP
                        </button>

                        <button
                          type="button"
                          onClick={() => seekBy(10)}
                          className="min-h-12 rounded-xl border border-white/[0.08] bg-white/[0.07] px-4 text-sm font-bold text-slate-100"
                        >
                          +10s
                        </button>
                      </div>

                      <div className="mt-4">
                        <input
                          type="range"
                          min="0"
                          max={progressMax}
                          step="0.1"
                          value={Math.min(currentTime, progressMax)}
                          onChange={(event) => seekTo(Number(event.target.value))}
                          className="w-full accent-sky-300"
                          aria-label="播放进度"
                        />
                        <div className="mt-1 flex justify-between text-xs tabular-nums text-slate-400">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(progressMax)}</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-slate-400">
                          <Volume2 className="h-4 w-4" />
                          SPEED
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {SPEEDS.map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setSpeed(value)}
                              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                                speed === value
                                  ? "bg-emerald-300 text-slate-950"
                                  : "bg-white/[0.06] text-slate-300"
                              }`}
                            >
                              {value.toFixed(value === 1 ? 1 : 2).replace(/0$/, "")}×
                            </button>
                          ))}
                        </div>
                      </div>

                      {audioError ? (
                        <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.07] p-3 text-xs leading-relaxed text-amber-100">
                          音频无法直接播放。请确认 Google Drive
                          文件夹已经设置为「知道链接的人可查看」。
                          <a
                            href={selected.viewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 font-bold underline"
                          >
                            在 Drive 中打开
                          </a>
                        </div>
                      ) : null}
                    </section>

                    {subtitleOn ? (
                      <section className="mt-4 rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-bold tracking-[0.12em] text-violet-200">
                              SYNC SUBTITLE
                            </div>
                            <div className="mt-1 text-sm text-slate-400">
                              当前句高亮 · 点击句子重新播放
                            </div>
                          </div>
                          {subtitle?.model ? (
                            <span className="text-[9px] text-slate-500">
                              {subtitle.model}
                            </span>
                          ) : null}
                        </div>

                        {subtitleLoading ? (
                          <div className="mt-4 text-sm text-slate-400">
                            字幕を読み込み中…
                          </div>
                        ) : (subtitle?.segments?.length ?? 0) > 0 ? (
                          <div className="mt-4 max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
                            {subtitle!.segments!.map((segment, index) => {
                              const active = index === activeSegmentIndex;
                              return (
                                <button
                                  key={`${segment.start}-${index}`}
                                  ref={(element) => {
                                    subtitleRefs.current[index] = element;
                                  }}
                                  type="button"
                                  onClick={() => jumpToSegment(segment)}
                                  className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm leading-6 transition ${
                                    active
                                      ? "bg-violet-300/18 font-semibold text-white ring-1 ring-violet-200/20"
                                      : "bg-slate-950/24 text-slate-300 hover:bg-white/[0.05]"
                                  }`}
                                >
                                  <span className="mr-2 text-[10px] tabular-nums text-slate-500">
                                    {formatTime(segment.start)}
                                  </span>
                                  {segment.text}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-4 rounded-xl bg-slate-950/30 p-4 text-sm text-slate-400">
                            这条音频没有找到对应的 JSON 字幕。
                          </div>
                        )}
                      </section>
                    ) : null}
                  </>
                ) : (
                  <div className="grid min-h-[360px] place-items-center rounded-2xl bg-slate-950/30 text-center text-sm text-slate-400">
                    {listLoading
                      ? "Google Drive 音频读取中…"
                      : "先完成 Drive 文件夹共享设置。"}
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
