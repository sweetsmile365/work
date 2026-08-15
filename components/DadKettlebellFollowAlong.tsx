"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Dumbbell,
  Headphones,
  Play,
  ShieldCheck,
  Video
} from "lucide-react";

type GuidedVideo = {
  id: string;
  videoId: string;
  label: string;
  shortLabel: string;
  startSeconds?: number;
};

const GUIDED_VIDEOS: GuidedVideo[] = [
  {
    id: "beginner-15",
    videoId: "dC4lMOH36CY",
    label: "15-Minute Beginner Kettlebell Workout",
    shortLabel: "15 MIN"
  },
  {
    id: "extra-kettlebell",
    videoId: "nTrJ9Ry6EDo",
    label: "Kettlebell Training · Added Video",
    shortLabel: "NEW VIDEO",
    startSeconds: 22
  },
  {
    id: "extra-kettlebell-2",
    videoId: "4stAcpR4pFs",
    label: "Kettlebell Training · Added Video 2",
    shortLabel: "NEW VIDEO 2"
  },
  {
    id: "extra-kettlebell-3",
    videoId: "ptdB52ggDvo",
    label: "Kettlebell Training · Added Video 3",
    shortLabel: "NEW VIDEO 3"
  }
];

function youtubeEmbedUrl(video: GuidedVideo) {
  const params = new URLSearchParams({
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    enablejsapi: "1"
  });

  if (video.startSeconds) {
    params.set("start", String(video.startSeconds));
  }

  return `https://www.youtube-nocookie.com/embed/${video.videoId}?${params.toString()}`;
}

export function DadKettlebellFollowAlong() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [open, setOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(GUIDED_VIDEOS[0].id);

  const selectedVideo =
    GUIDED_VIDEOS.find((video) => video.id === selectedVideoId) ??
    GUIDED_VIDEOS[0];

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
      if (custom.detail !== "kettlebell") pauseVideo();
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
    // Pause Fitness Music and any other guided workout first.
    window.dispatchEvent(new CustomEvent("fitness:guided-start"));
    window.dispatchEvent(
      new CustomEvent("fitness:guided-video-start", {
        detail: "kettlebell"
      })
    );
    setLoaded(true);
  }

  return (
    <section className="mt-4 overflow-hidden rounded-3xl border border-fuchsia-300/10 bg-fuchsia-300/[0.045]">
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
              GUIDED WORKOUT · KETTLEBELL
            </div>
            <div className="mt-1 text-lg font-bold text-white">
              Beginner Kettlebell · FOLLOW ALONG
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              YouTube 高清真人跟练 · 页面内播放
            </div>
          </div>

          <ChevronDown
            size={17}
            className={`shrink-0 text-slate-500 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-100">
          BEGINNER
        </span>
      </div>

      {open ? (
        <div className="border-t border-white/[0.06] p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {GUIDED_VIDEOS.map((video) => {
                  const active = video.id === selectedVideo.id;
                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => selectVideo(video.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? "bg-fuchsia-200 text-slate-950"
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
                    className="absolute inset-0 h-full w-full object-cover opacity-75 transition group-hover:scale-[1.01]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25" />

                  <div className="relative grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white shadow-2xl">
                    <Play
                      size={28}
                      className="translate-x-0.5"
                      fill="currentColor"
                    />
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <div className="text-xs font-bold tracking-[0.12em] text-white/75">
                      TAP TO LOAD
                    </div>
                    <div className="mt-1 text-lg font-bold text-white">
                      {selectedVideo.label}
                    </div>
                    {selectedVideo.startSeconds ? (
                      <div className="mt-1 text-xs text-white/65">
                        从 00:22 开始播放
                      </div>
                    ) : null}
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
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="mt-3 rounded-2xl bg-slate-950/30 p-4">
                <div className="flex items-start gap-3">
                  <Headphones
                    size={18}
                    className="mt-0.5 shrink-0 text-fuchsia-200"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">
                      COACH AUDIO 模式
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-400">
                      视频有指导声音。开始 Guided Workout 时会暂停 Fitness Music；
                      如果你重新打开 Fitness Music，视频会自动暂停，避免两个声音互相干扰。
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid content-start gap-3">
              <div className="rounded-2xl bg-blue-300/[0.055] p-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-blue-200">
                  <Dumbbell size={16} />
                  HOW TO USE
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <div className="rounded-xl bg-slate-950/25 p-3">
                    <span className="font-bold text-white">15 MIN</span>
                    <div className="mt-1 text-xs text-slate-400">
                      原来的 Beginner Full Body 跟练。
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/25 p-3">
                    <span className="font-bold text-white">NEW VIDEO</span>
                    <div className="mt-1 text-xs text-slate-400">
                      新增你指定的 YouTube 壶铃视频，并从 00:22 开始播放。
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/25 p-3">
                    <span className="font-bold text-white">NEW VIDEO 2</span>
                    <div className="mt-1 text-xs text-slate-400">
                      第二条新增壶铃视频，从开头开始播放。
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/25 p-3">
                    <span className="font-bold text-white">NEW VIDEO 3</span>
                    <div className="mt-1 text-xs text-slate-400">
                      第三条新增壶铃视频，从开头开始播放。
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/25 p-3">
                    <span className="font-bold text-white">其他训练日</span>
                    <div className="mt-1 text-xs text-slate-400">
                      继续按照上面的 Weekly Plan 做当天动作，不强制播放整套视频。
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.045] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
                  <ShieldCheck size={16} />
                  FORM FIRST
                </div>
                <div className="mt-2 text-xs leading-relaxed text-slate-400">
                  初学阶段不追重量。Deadlift / Squat / Row / Halo 等基础动作先保持稳定，
                  Swing 和推举动作如果姿势开始散掉，就减重量或停止。
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/25 p-4">
                <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
                  VIDEO SWITCH
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  两条 YouTube 视频可在同一区域切换
                </div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">
                  切换视频时当前视频会停止，避免同时播放两个声音。
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
