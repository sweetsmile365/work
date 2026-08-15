"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CircleDot,
  Headphones,
  Home,
  Play,
  ShieldCheck
} from "lucide-react";

type WorkoutVideo = {
  id: string;
  videoId: string;
  label: string;
  shortLabel: string;
};

const WORKOUT_VIDEOS: WorkoutVideo[] = [
  {
    id: "workout-1",
    videoId: "IY3fCg1vIY4",
    label: "Workout · Follow Along 1",
    shortLabel: "WORKOUT 1"
  },
  {
    id: "workout-2",
    videoId: "0Grvq1Kz6L8",
    label: "Workout · Follow Along 2",
    shortLabel: "WORKOUT 2"
  }
];

function youtubeEmbedUrl(video: WorkoutVideo) {
  return (
    `https://www.youtube-nocookie.com/embed/${video.videoId}` +
    "?rel=0&playsinline=1&modestbranding=1&enablejsapi=1"
  );
}

export function DadBodyweightFollowAlong() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [open, setOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(WORKOUT_VIDEOS[0].id);

  const selectedVideo =
    WORKOUT_VIDEOS.find((video) => video.id === selectedVideoId) ??
    WORKOUT_VIDEOS[0];

  useEffect(() => {
    const pauseVideo = () => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "pauseVideo",
          args: []
        }),
        "*"
      );
    };

    const pauseForOtherGuidedVideo = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (custom.detail !== "bodyweight") pauseVideo();
    };

    window.addEventListener("fitness:music-start", pauseVideo);
    window.addEventListener(
      "fitness:guided-video-start",
      pauseForOtherGuidedVideo
    );

    return () => {
      window.removeEventListener("fitness:music-start", pauseVideo);
      window.removeEventListener(
        "fitness:guided-video-start",
        pauseForOtherGuidedVideo
      );
    };
  }, []);

  function selectVideo(videoId: string) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: "pauseVideo",
        args: []
      }),
      "*"
    );
    setLoaded(false);
    setSelectedVideoId(videoId);
  }

  function loadVideo() {
    window.dispatchEvent(new CustomEvent("fitness:guided-start"));
    window.dispatchEvent(
      new CustomEvent("fitness:guided-video-start", {
        detail: "bodyweight"
      })
    );
    setLoaded(true);
  }

  return (
    <section className="mt-4 overflow-hidden rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.045]">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200">
            <Home size={20} />
          </div>

          <div className="min-w-0">
            <div className="text-xs font-bold tracking-[0.13em] text-emerald-200">
              WORKOUT · FOLLOW ALONG
            </div>
            <div className="mt-1 text-lg font-bold text-white">
              Workout · Follow Along
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              YouTube 真人实时跟练 · 页面内播放
            </div>
          </div>

          <ChevronDown
            size={17}
            className={`shrink-0 text-slate-500 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-100">
            WORKOUT
          </span>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/[0.06] p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {WORKOUT_VIDEOS.map((video) => {
                  const active = video.id === selectedVideo.id;
                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => selectVideo(video.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? "bg-emerald-200 text-slate-950"
                          : "bg-white/[0.07] text-slate-300 hover:bg-white/[0.11]"
                      }`}
                    >
                      {video.shortLabel}
                    </button>
                  );
                })}
              </div>

              {!loaded ? (
                <button
                  type="button"
                  onClick={loadVideo}
                  className="group relative grid aspect-video w-full place-items-center overflow-hidden rounded-2xl bg-black"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${selectedVideo.videoId}/hqdefault.jpg`}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-300 group-hover:scale-[1.01]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />

                  <div className="relative grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white shadow-2xl">
                    <Play
                      size={28}
                      className="translate-x-0.5"
                      fill="currentColor"
                    />
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <div className="text-[10px] font-bold tracking-[0.13em] text-white/70">
                      TAP TO LOAD · WORKOUT
                    </div>
                    <div className="mt-1 text-base font-bold text-white sm:text-lg">
                      {selectedVideo.label}
                    </div>
                  </div>
                </button>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-black">
                  <iframe
                    ref={iframeRef}
                    key={selectedVideo.id}
                    className="aspect-video w-full"
                    src={youtubeEmbedUrl(selectedVideo)}
                    title={selectedVideo.label}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="mt-3 rounded-2xl bg-slate-950/30 p-4">
                <div className="flex items-start gap-3">
                  <Headphones
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-200"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">
                      FOLLOW ALONG AUDIO
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-400">
                      点开真人跟练时会自动暂停 Fitness Music 和壶铃 Guided Workout。
                      如果重新播放 Fitness Music，这条视频也会暂停，避免两个媒体同时播放。
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid content-start gap-3">
              <div className="rounded-2xl bg-emerald-300/[0.055] p-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-emerald-200">
                  <CircleDot size={16} />
                  WHEN TO USE
                </div>

                <div className="mt-3 grid gap-2">
                  <div className="rounded-xl bg-slate-950/25 p-3">
                    <div className="font-bold text-white">
                      Workout Day
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-400">
                      WORKOUT 1 / WORKOUT 2 可以切换选择；一次只播放一条。
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/25 p-3">
                    <div className="font-bold text-white">
                      Light / Recovery Day
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-400">
                      如果当天状态一般，降低动作速度、幅度或中途休息。
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.045] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-100">
                  <ShieldCheck size={16} />
                  FORM FIRST
                </div>
                <div className="mt-2 text-xs leading-relaxed text-slate-400">
                  跟不上视频节奏时直接减慢或休息，不为了追速度牺牲膝、腰和肩的姿势。
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/25 p-4">
                <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
                  SOURCE
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  YouTube · Workout
                </div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">
                  页面内使用 YouTube no-cookie 延迟加载，不把第三方视频复制进仓库。
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
