"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Timer
} from "lucide-react";

type FootworkLevel = "WARM-UP" | "BASIC" | "CARDIO" | "IMPACT" | "CHALLENGE";

type FootworkDrill = {
  id: string;
  title: string;
  videoPath: string;
  level: FootworkLevel;
  cue: string;
};

const footworkDrills: FootworkDrill[] = [
  { id: "jumping-jack", title: "① 开合跳 · Jumping Jack", videoPath: "footwork/jumping-jack.mp4", level: "WARM-UP", cue: "轻柔落地，膝盖与脚尖同向" },
  { id: "split-step", title: "② 启动步 · Split Step", videoPath: "footwork/split-step.mp4", level: "BASIC", cue: "落地后马上准备向任意方向启动" },
  { id: "crossover-step", title: "③ 交叉步 · Crossover Step", videoPath: "footwork/crossover-step.mp4", level: "BASIC", cue: "先转髋再交叉，步幅不要过大" },
  { id: "forward-back-jump", title: "④ 前后跳 · Forward / Back", videoPath: "footwork/forward-back-jump.mp4", level: "IMPACT", cue: "小幅度、轻落地，保持身体在中间" },
  { id: "side-jump", title: "⑤ 左右跳 · Side to Side", videoPath: "footwork/side-jump.mp4", level: "IMPACT", cue: "左右快速移动，避免膝盖内扣" },
  { id: "hip-rotation", title: "⑥ 原地转髋 · Hip Rotation", videoPath: "footwork/hip-rotation.mp4", level: "BASIC", cue: "脚掌跟着转，不要只扭膝盖" },
  { id: "high-knees", title: "⑦ 高抬腿 · High Knees", videoPath: "footwork/high-knees.mp4", level: "CARDIO", cue: "身体直立，脚步轻快" },
  { id: "high-knee-rotation", title: "⑧ 高抬腿转髋", videoPath: "footwork/high-knee-rotation.mp4", level: "CARDIO", cue: "抬腿后转髋，保持平衡" },
  { id: "shuffle-hip-rotation", title: "⑨ 垫步转髋 · Adjustment Step", videoPath: "footwork/shuffle-hip-rotation.mp4", level: "BASIC", cue: "小垫步后快速转髋，模拟场上调整" },
  { id: "deep-squat-rotation", title: "⑩ 全蹲转髋", videoPath: "footwork/deep-squat-rotation.mp4", level: "CHALLENGE", cue: "不强求深蹲深度，起身后再转髋" },
  { id: "big-step", title: "⑪ 大步 · Lunge Step", videoPath: "footwork/big-step.mp4", level: "BASIC", cue: "跨出后膝盖对准脚尖，快速回中" },
  { id: "deep-squat-lunge", title: "⑫ 全蹲弓步", videoPath: "footwork/deep-squat-lunge.mp4", level: "CHALLENGE", cue: "先稳定再跨步，不用追求速度" },
  { id: "vertical-jump", title: "⑬ 纵跳 · Vertical Jump", videoPath: "footwork/vertical-jump.mp4", level: "IMPACT", cue: "起跳不必高，重点是柔和落地" },
  { id: "extension-jump", title: "⑭ 挺身跳 · Extension Jump", videoPath: "footwork/extension-jump.mp4", level: "IMPACT", cue: "髋膝伸展后轻落地，控制身体" },
  { id: "cross-jump", title: "⑮ 十字跳 · Cross Jump", videoPath: "footwork/cross-jump.mp4", level: "IMPACT", cue: "前后左右小范围，始终回到中心" },
  { id: "quick-feet", title: "⑯ 小碎步 · Quick Feet", videoPath: "footwork/quick-feet.mp4", level: "BASIC", cue: "重心稍低，小步快速但不要跺脚" },
  { id: "mountain-climber", title: "⑰ 俯身登山 · Mountain Climber", videoPath: "footwork/mountain-climber.mp4", level: "CHALLENGE", cue: "核心稳定，速度服从动作质量" }
];

const basicIds = new Set([
  "split-step",
  "crossover-step",
  "hip-rotation",
  "shuffle-hip-rotation",
  "big-step",
  "quick-feet"
]);

const videoUrl = (path: string) => `/badminton/videos/${path}`;

function levelStyle(level: FootworkLevel) {
  if (level === "BASIC") return "bg-emerald-300/10 text-emerald-100";
  if (level === "WARM-UP") return "bg-sky-300/10 text-sky-100";
  if (level === "CARDIO") return "bg-violet-300/10 text-violet-100";
  if (level === "IMPACT") return "bg-amber-300/10 text-amber-100";
  return "bg-rose-300/10 text-rose-100";
}

export function BadmintonFootworkBlitz() {
  const [mode, setMode] = useState<"basic" | "full">("basic");
  const [selectedId, setSelectedId] = useState("split-step");

  const visible = useMemo(
    () =>
      mode === "basic"
        ? footworkDrills.filter((item) => basicIds.has(item.id))
        : footworkDrills,
    [mode]
  );

  const selected =
    visible.find((item) => item.id === selectedId) ?? visible[0] ?? footworkDrills[0];
  const selectedIndex = Math.max(0, visible.findIndex((item) => item.id === selected.id));

  function changeMode(next: "basic" | "full") {
    setMode(next);
    setSelectedId(next === "basic" ? "split-step" : "jumping-jack");
  }

  function go(offset: number) {
    const next = Math.max(0, Math.min(visible.length - 1, selectedIndex + offset));
    setSelectedId(visible[next].id);
  }

  return (
    <section className="mt-4 rounded-3xl border border-indigo-300/10 bg-indigo-300/[0.05] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-indigo-200">
            <Activity size={17} />
            FOOTWORK · 专项步伐
          </div>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">Badminton Footwork Blitz</h2>
          <div className="mt-1 text-xs leading-relaxed text-slate-400">
            原视频12:25已拆成17个真人动作。每个动作30秒：前15秒常速，后15秒有余力再加快。
          </div>
        </div>

        <div className="flex rounded-xl bg-slate-950/30 p-1">
          <button
            type="button"
            onClick={() => changeMode("basic")}
            className={`min-h-9 rounded-lg px-3 text-xs font-bold ${
              mode === "basic" ? "bg-emerald-300 text-slate-950" : "text-slate-400"
            }`}
          >
            BASIC 6
          </button>
          <button
            type="button"
            onClick={() => changeMode("full")}
            className={`min-h-9 rounded-lg px-3 text-xs font-bold ${
              mode === "full" ? "bg-indigo-300 text-slate-950" : "text-slate-400"
            }`}
          >
            FULL 17
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-950/35">
          <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
            <div>
              <div className="text-[10px] font-bold tracking-[0.12em] text-amber-200">真人示范 · 30 SEC</div>
              <div className="mt-1 font-bold text-white">{selected.title}</div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${levelStyle(selected.level)}`}>
              {selected.level}
            </span>
          </div>

          <div className="flex min-h-[310px] items-center justify-center bg-black p-2">
            <video
              key={selected.videoPath}
              src={videoUrl(selected.videoPath)}
              controls
              playsInline
              preload="metadata"
              loop
              className="max-h-[430px] w-full object-contain"
            />
          </div>

          <div className="p-4">
            <div className="text-sm font-semibold text-white">{selected.cue}</div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/[0.05] p-3">
                <div className="text-[10px] font-bold text-emerald-200">0–15 SEC</div>
                <div className="mt-1 text-xs text-slate-300">常速 · 动作准确</div>
              </div>
              <div className="rounded-xl bg-white/[0.05] p-3">
                <div className="text-[10px] font-bold text-amber-200">15–30 SEC</div>
                <div className="mt-1 text-xs text-slate-300">有余力才加快</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-950/30 px-3 py-2 text-xs text-slate-400">
              <Timer size={15} />
              视频本身就是30秒练习计时，不需要另开计时器。
            </div>

            <div className="mt-3 grid grid-cols-[3rem_1fr_3rem] gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={selectedIndex === 0}
                className="grid min-h-11 place-items-center rounded-xl bg-white/[0.07] disabled:opacity-25"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="grid place-items-center rounded-xl bg-indigo-300/10 text-xs font-semibold text-indigo-100">
                {selectedIndex + 1} / {visible.length}
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={selectedIndex === visible.length - 1}
                className="grid min-h-11 place-items-center rounded-xl bg-white/[0.07] disabled:opacity-25"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </article>

        <div className="grid content-start gap-2">
          {visible.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 text-left transition ${
                item.id === selected.id
                  ? "bg-indigo-300/15 ring-1 ring-indigo-300/20"
                  : "bg-slate-950/25 active:bg-white/[0.07]"
              }`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.07] text-xs font-bold">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{item.title}</span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-400">{item.cue}</span>
              </span>
              <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${levelStyle(item.level)}`}>
                {item.level}
              </span>
            </button>
          ))}

          <div className="mt-2 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.045] p-3 text-[11px] leading-relaxed text-slate-400">
            <div className="font-bold text-emerald-100">おすすめ</div>
            <div className="mt-1">
              BASIC 6：技术日可以做，约4–5分钟。FULL 17：属于体能/冲击挑战，初学阶段建议每周1–2次即可，不放进每日必做。
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.045] p-3 text-[11px] leading-relaxed text-slate-400">
            <div className="flex items-center gap-2 font-bold text-amber-100">
              <ShieldCheck size={15} />
              足首・膝
            </div>
            <div className="mt-1">
              跳跃类动作不需要追求高度。出现脚踝疼痛、肿胀、明显不稳或膝痛时，跳过 IMPACT / CHALLENGE，改做 BASIC。
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
