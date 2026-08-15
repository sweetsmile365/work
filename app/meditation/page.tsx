"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";

type Phase = "inhale" | "hold" | "exhale";

const PHASES: Array<{ phase: Phase; seconds: number; label: string; hint: string }> = [
  { phase: "inhale", seconds: 4, label: "吸气", hint: "慢慢吸气" },
  { phase: "hold", seconds: 4, label: "停留", hint: "轻轻保持" },
  { phase: "exhale", seconds: 6, label: "呼气", hint: "慢慢呼出去" }
];

const PRESETS = [5, 10, 15] as const;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function MeditationPage() {
  const [minutes, setMinutes] = useState<(typeof PRESETS)[number]>(5);
  const [remaining, setRemaining] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseRemaining, setPhaseRemaining] = useState(PHASES[0].seconds);

  const phase = PHASES[phaseIndex];

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });

      setPhaseRemaining((value) => {
        if (value <= 1) {
          const next = (phaseIndex + 1) % PHASES.length;
          setPhaseIndex(next);
          return PHASES[next].seconds;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, phaseIndex]);

  const progress = useMemo(() => {
    const total = minutes * 60;
    return total > 0 ? ((total - remaining) / total) * 100 : 0;
  }, [minutes, remaining]);

  const selectPreset = (value: (typeof PRESETS)[number]) => {
    setMinutes(value);
    setRemaining(value * 60);
    setRunning(false);
    setPhaseIndex(0);
    setPhaseRemaining(PHASES[0].seconds);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(minutes * 60);
    setPhaseIndex(0);
    setPhaseRemaining(PHASES[0].seconds);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#164e4b_0%,#0d2730_38%,#07151e_100%)] px-4 py-5 text-white sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="text-sm font-semibold tracking-[0.16em] text-cyan-100/80">
            MEDITATION
          </div>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-slate-950/35 p-5 shadow-2xl shadow-black/20 sm:p-8">
          <div className="text-center">
            <div className="text-4xl">🧘</div>
            <h1 className="mt-3 text-2xl font-bold tracking-wide sm:text-3xl">安静冥想</h1>
            <p className="mt-2 text-sm text-slate-300">跟着呼吸，不需要做到完美。</p>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => selectPreset(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  minutes === value
                    ? "bg-cyan-200 text-slate-950"
                    : "bg-white/10 text-slate-100 hover:bg-white/15"
                }`}
              >
                {value} min
              </button>
            ))}
          </div>

          <div className="mt-8 grid place-items-center">
            <div className="relative grid h-64 w-64 place-items-center rounded-full border border-cyan-100/20 bg-cyan-200/[0.06] shadow-[0_0_80px_rgba(103,232,249,0.10)] sm:h-72 sm:w-72">
              <div
                className={`absolute rounded-full bg-cyan-200/10 transition-all duration-1000 ${
                  phase.phase === "inhale"
                    ? "h-52 w-52 sm:h-60 sm:w-60"
                    : phase.phase === "hold"
                      ? "h-52 w-52 sm:h-60 sm:w-60"
                      : "h-32 w-32 sm:h-36 sm:w-36"
                }`}
              />
              <div className="relative text-center">
                <div className="text-xs font-semibold tracking-[0.22em] text-cyan-100/70">
                  {phase.label}
                </div>
                <div className="mt-2 text-6xl font-light tabular-nums text-white">
                  {phaseRemaining}
                </div>
                <div className="mt-2 text-sm text-slate-300">{phase.hint}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="text-5xl font-light tabular-nums tracking-tight sm:text-6xl">
              {formatTime(remaining)}
            </div>
            <div className="mx-auto mt-4 h-1.5 max-w-md overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-200 transition-[width] duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>

          <div className="mt-7 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setRunning((value) => !value)}
              disabled={remaining === 0}
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-full bg-cyan-200 px-6 py-3 font-bold text-slate-950 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? "暂停" : remaining === minutes * 60 ? "开始" : "继续"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-slate-100 transition hover:bg-white/15 active:scale-[0.98]"
              aria-label="重新开始"
              title="重新开始"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 rounded-2xl bg-white/[0.06] p-4 text-sm leading-6 text-slate-300">
            <span className="font-semibold text-slate-100">今天只做一件事：</span>
            坐舒服，肩膀放松。注意呼吸跑掉了，就轻轻把注意力带回来。
          </div>
        </section>
      </div>
    </main>
  );
}
