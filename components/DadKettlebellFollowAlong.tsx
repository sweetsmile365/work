"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Clock3, Pencil, Play, RotateCcw, Save, Video } from "lucide-react";

type Chapter = {
  id: string;
  start: number;
  title: string;
  focus: string;
  kind: "warmup" | "main" | "cooldown";
};

type Config = {
  version: 1;
  title: string;
  videoUrl: string;
  chapters: Chapter[];
};

const STORAGE_KEY = "dad-kettlebell-followalong-v1";

const DEFAULT_CONFIG: Config = {
  version: 1,
  title: "Kettlebell Follow Along · 16:25",
  videoUrl: "/fitness/videos/dad-kettlebell-followalong-16min.mp4",
  chapters: [
    { id: "warmup-lunge", start: 20, title: "热身 · 弓步伸展", focus: "髋部与腿后侧活动", kind: "warmup" },
    { id: "warmup-side", start: 50, title: "热身 · 侧弓步转体", focus: "侧向活动 + 胸椎旋转", kind: "warmup" },
    { id: "warmup-halo", start: 90, title: "热身 · 壶铃绕头", focus: "肩部活动，轻重量", kind: "warmup" },
    { id: "swing", start: 140, title: "壶铃摆荡", focus: "髋铰链发力，不用手臂硬抬", kind: "main" },
    { id: "shoulder-rotation", start: 220, title: "过肩转体", focus: "躯干稳定，幅度可控", kind: "main" },
    { id: "side-lunge-row", start: 300, title: "侧弓步划船", focus: "侧向下蹲 + 背部拉", kind: "main" },
    { id: "deadlift-lunge", start: 360, title: "硬拉后撤弓步", focus: "先稳住髋，再后撤", kind: "main" },
    { id: "row-high-pull", start: 440, title: "单手划船上提", focus: "背部带动，肩膀不要耸起", kind: "main" },
    { id: "press", start: 520, title: "单侧推举", focus: "核心收紧，避免腰部过度后仰", kind: "main" },
    { id: "swing-curl", start: 600, title: "摆荡 + 二头弯举", focus: "先控制摆荡，再完成手臂动作", kind: "main" },
    { id: "rotational-pull", start: 680, title: "转体斜拉", focus: "脚、髋、躯干一起转动", kind: "main" },
    { id: "supine-tuck", start: 760, title: "仰卧团身", focus: "核心控制，不追求速度", kind: "main" },
    { id: "cool-upper", start: 820, title: "整理 · 上肢拉伸", focus: "降低心率，放松肩背", kind: "cooldown" },
    { id: "cool-hip", start: 890, title: "整理 · 髋腿拉伸", focus: "动作慢，不弹震", kind: "cooldown" },
    { id: "cool-quad", start: 940, title: "整理 · 大腿前侧", focus: "保持站立稳定，轻柔拉伸", kind: "cooldown" }
  ]
};

function cloneDefault(): Config {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as Config;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function loadConfig(): Config {
  if (typeof window === "undefined") return cloneDefault();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();
    const parsed = JSON.parse(raw) as Config;
    return parsed?.chapters?.length ? parsed : cloneDefault();
  } catch {
    return cloneDefault();
  }
}

export function DadKettlebellFollowAlong() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [config, setConfig] = useState<Config>(() => cloneDefault());
  const [currentTime, setCurrentTime] = useState(0);
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => setConfig(loadConfig()), []);

  const chapters = useMemo(
    () => [...config.chapters].sort((a, b) => a.start - b.start),
    [config.chapters]
  );

  const activeIndex = useMemo(() => {
    let result = 0;
    chapters.forEach((chapter, index) => {
      if (currentTime >= chapter.start) result = index;
    });
    return result;
  }, [chapters, currentTime]);

  const active = chapters[activeIndex];

  function save(next: Config) {
    setConfig(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function editChapter(index: number, patch: Partial<Chapter>) {
    save({
      ...config,
      chapters: config.chapters.map((chapter, i) =>
        i === index ? { ...chapter, ...patch } : chapter
      )
    });
  }

  function jump(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    setCurrentTime(seconds);
    void video.play().catch(() => {});
  }

  return (
    <section className="mt-4 overflow-hidden rounded-3xl border border-fuchsia-300/10 bg-fuchsia-300/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fuchsia-300/10 text-fuchsia-200">
            <Video size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-[0.13em] text-fuchsia-200">
              VIDEO WORKOUT · FOLLOW ALONG
            </div>
            <div className="mt-1 truncate text-lg font-bold text-white">{config.title}</div>
            <div className="mt-0.5 text-xs text-slate-400">
              全身 + Core · 原视频无音轨，可同时播放 Fitness Music
            </div>
          </div>
          <ChevronDown
            size={17}
            className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 text-xs font-semibold text-slate-200"
          >
            {editing ? <Save size={14} /> : <Pencil size={14} />}
            {editing ? "DONE" : "編集"}
          </button>
          <button
            type="button"
            onClick={() => save(cloneDefault())}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-slate-400"
            title="默认章节に戻す"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/[0.06] p-4 sm:p-5">
          {editing ? (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-400">
                Workout title
                <input
                  value={config.title}
                  onChange={(e) => save({ ...config, title: e.target.value })}
                  className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white"
                />
              </label>
              <label className="text-xs text-slate-400">
                Video path / URL
                <input
                  value={config.videoUrl}
                  onChange={(e) => save({ ...config, videoUrl: e.target.value })}
                  className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white"
                />
              </label>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="overflow-hidden rounded-2xl bg-black">
                <video
                  ref={videoRef}
                  key={config.videoUrl}
                  src={config.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-black object-contain"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                />
              </div>

              <div className="mt-3 rounded-2xl bg-slate-950/28 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.13em] text-fuchsia-200">
                      CURRENT
                    </div>
                    <div className="mt-1 text-lg font-bold text-white">
                      {active?.title ?? "Intro"}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {active?.focus ?? "准备器材，确认周围空间。"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold tabular-nums text-slate-300">
                    <Clock3 size={14} />
                    {formatTime(currentTime)}
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto pr-1">
              <div className="mb-2 text-xs font-bold tracking-[0.12em] text-slate-400">
                CHAPTERS · 点一下直接跳到动作
              </div>

              <div className="grid gap-2">
                {chapters.map((chapter, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <div
                      key={chapter.id}
                      className={`rounded-xl border p-3 ${
                        isActive
                          ? "border-fuchsia-300/25 bg-fuchsia-300/10"
                          : "border-white/[0.04] bg-slate-950/22"
                      }`}
                    >
                      {editing ? (
                        <div className="grid gap-2">
                          <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                            <input
                              type="number"
                              min="0"
                              max="985"
                              value={chapter.start}
                              onChange={(e) =>
                                editChapter(index, { start: Number(e.target.value) || 0 })
                              }
                              className="min-h-9 rounded-lg border border-white/10 bg-slate-950/55 px-2 text-xs text-white"
                            />
                            <input
                              value={chapter.title}
                              onChange={(e) => editChapter(index, { title: e.target.value })}
                              className="min-h-9 rounded-lg border border-white/10 bg-slate-950/55 px-2 text-xs text-white"
                            />
                          </div>
                          <input
                            value={chapter.focus}
                            onChange={(e) => editChapter(index, { focus: e.target.value })}
                            className="min-h-9 rounded-lg border border-white/10 bg-slate-950/55 px-2 text-xs text-white"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => jump(chapter.start)}
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <div
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                              isActive
                                ? "bg-fuchsia-300 text-slate-950"
                                : "bg-white/[0.06] text-slate-400"
                            }`}
                          >
                            <Play size={14} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-white">{chapter.title}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  chapter.kind === "warmup"
                                    ? "bg-amber-300/10 text-amber-100"
                                    : chapter.kind === "cooldown"
                                      ? "bg-emerald-300/10 text-emerald-100"
                                      : "bg-blue-300/10 text-blue-100"
                                }`}
                              >
                                {chapter.kind.toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                              {chapter.focus}
                            </div>
                          </div>

                          <div className="shrink-0 text-xs tabular-nums text-slate-500">
                            {formatTime(chapter.start)}
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-amber-300/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-100/80">
            这套视频属于全身训练。更适合作为全身日或周末跟练，不建议七天都当成高强度主训练。
          </div>
        </div>
      ) : null}
    </section>
  );
}
