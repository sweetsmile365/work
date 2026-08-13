"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck
} from "lucide-react";

type Step = {
  id: string;
  title: string;
  duration: number;
  cue: string;
  detail: string;
  side?: "forehand" | "backhand" | "overhead" | "drive" | "relax";
};

const routine: Step[] = [
  {
    id: "warmup",
    title: "Warm-up · 肩・肘・手首",
    duration: 60,
    cue: "力を抜く",
    detail: "肩を回し、肘と手首をゆっくり動かします。まだラケットは強く振りません。",
    side: "relax"
  },
  {
    id: "forehand",
    title: "Forehand Clear · フォアハンドクリア",
    duration: 120,
    cue: "グリップは軽く · 打点は身体の前上方",
    detail: "振る前はグリップを軽くし、インパクトの瞬間だけ短く握ります。前腕の回旋と自然なフォロースルーを意識し、速さは求めません。",
    side: "forehand"
  },
  {
    id: "backhand",
    title: "Backhand · バックハンド",
    duration: 120,
    cue: "親指で支える · 前腕を回旋",
    detail: "手首だけで振らず、肘まわりに余裕を持たせ、前腕の回旋で加速します。",
    side: "backhand"
  },
  {
    id: "overhead",
    title: "Overhead · オーバーヘッド",
    duration: 120,
    cue: "半身で構える · 高い打点を前でとる",
    detail: "まずゆっくり、構え→テイクバック→インパクト→フォロースルーまで通して行います。肩をすくめないようにします。",
    side: "overhead"
  },
  {
    id: "drive",
    title: "Drive · ドライブ",
    duration: 90,
    cue: "コンパクトに · ラケットヘッドを速く",
    detail: "腕の動きを小さくし、ラケット面を安定させます。左右交互に行い、毎回構えの位置へ戻します。",
    side: "drive"
  },
  {
    id: "form",
    title: "Form Review · ゆっくりフォーム確認",
    duration: 90,
    cue: "回数よりフォーム",
    detail: "今日いちばん不安定だった動きを選び、50〜60％の速さで繰り返します。グリップ、打点、フォロースルーを毎回確認します。",
    side: "relax"
  }
];

const totalSeconds = routine.reduce((sum, step) => sum + step.duration, 0);

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

function SwingAnimation({
  kind
}: {
  kind: Step["side"];
}) {
  const animation =
    kind === "backhand"
      ? "backhandSwing"
      : kind === "drive"
        ? "driveSwing"
        : kind === "overhead"
          ? "overheadSwing"
          : kind === "relax"
            ? "slowSwing"
            : "forehandSwing";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-300/10 bg-slate-950/35">
      <style jsx>{`
        @keyframes forehandSwing {
          0%, 100% { transform: rotate(-55deg); }
          45% { transform: rotate(42deg); }
          60% { transform: rotate(58deg); }
        }
        @keyframes backhandSwing {
          0%, 100% { transform: rotate(50deg); }
          50% { transform: rotate(-42deg); }
        }
        @keyframes overheadSwing {
          0%, 100% { transform: rotate(-72deg); }
          52% { transform: rotate(26deg); }
        }
        @keyframes driveSwing {
          0%, 100% { transform: rotate(-25deg); }
          50% { transform: rotate(24deg); }
        }
        @keyframes slowSwing {
          0%, 100% { transform: rotate(-32deg); }
          50% { transform: rotate(28deg); }
        }
        @keyframes shuttlePath {
          0% { transform: translate(0, 0); opacity: 0.25; }
          45% { transform: translate(44px, -34px); opacity: 0.85; }
          100% { transform: translate(92px, -54px); opacity: 0; }
        }
      `}</style>

      <div className="absolute left-4 top-3 z-10 rounded-full bg-white/[0.07] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-sky-200">
        素振りガイド
      </div>

      <svg viewBox="0 0 460 280" className="h-[250px] w-full sm:h-[300px]">
        <line
          x1="55"
          y1="238"
          x2="405"
          y2="238"
          stroke="rgba(148,163,184,0.18)"
          strokeWidth="2"
        />

        <circle cx="210" cy="80" r="16" fill="rgba(226,232,240,0.94)" />
        <line x1="210" y1="98" x2="210" y2="165" stroke="rgba(226,232,240,0.92)" strokeWidth="10" strokeLinecap="round" />
        <line x1="210" y1="165" x2="182" y2="232" stroke="rgba(226,232,240,0.9)" strokeWidth="9" strokeLinecap="round" />
        <line x1="210" y1="165" x2="242" y2="232" stroke="rgba(226,232,240,0.9)" strokeWidth="9" strokeLinecap="round" />

        <line x1="210" y1="116" x2="182" y2="150" stroke="rgba(226,232,240,0.8)" strokeWidth="8" strokeLinecap="round" />

        <g
          style={{
            transformOrigin: "210px 116px",
            animation: `${animation} ${kind === "drive" ? "1.25s" : "2.1s"} ease-in-out infinite`
          }}
        >
          <line x1="210" y1="116" x2="257" y2="146" stroke="rgba(226,232,240,0.86)" strokeWidth="8" strokeLinecap="round" />
          <line x1="257" y1="146" x2="301" y2="105" stroke="rgba(125,211,252,0.95)" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="320" cy="87" rx="19" ry="29" fill="none" stroke="rgba(125,211,252,0.95)" strokeWidth="5" />
          <line x1="305" y1="70" x2="335" y2="104" stroke="rgba(125,211,252,0.45)" strokeWidth="2" />
          <line x1="335" y1="70" x2="305" y2="104" stroke="rgba(125,211,252,0.45)" strokeWidth="2" />
        </g>

        {kind !== "relax" ? (
          <g style={{ animation: "shuttlePath 2.1s ease-out infinite" }}>
            <circle cx="330" cy="82" r="5" fill="rgba(253,224,71,0.95)" />
            <path d="M325 76 L318 67 M330 76 L328 64 M335 77 L340 67" stroke="rgba(253,224,71,0.9)" strokeWidth="2" />
          </g>
        ) : null}

        <path
          d="M285 168 C330 150 352 120 360 92"
          fill="none"
          stroke="rgba(110,231,183,0.55)"
          strokeWidth="3"
          strokeDasharray="7 7"
        />

        <text x="230" y="263" textAnchor="middle" fill="rgba(148,163,184,0.78)" fontSize="11">
          軽いグリップ · 打点は前 · 自然なフォロースルー
        </text>
      </svg>
    </div>
  );
}

export default function BadmintonPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(routine[0].duration);
  const [running, setRunning] = useState(false);

  const current = routine[stepIndex];

  const completedBefore = useMemo(
    () => routine.slice(0, stepIndex).reduce((sum, step) => sum + step.duration, 0),
    [stepIndex]
  );

  const progress =
    ((completedBefore + (current.duration - remaining)) / totalSeconds) * 100;

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value > 1) return value - 1;

        if (stepIndex < routine.length - 1) {
          const nextIndex = stepIndex + 1;
          setStepIndex(nextIndex);
          return routine[nextIndex].duration;
        }

        setRunning(false);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, stepIndex]);

  function goToStep(index: number) {
    const safe = Math.max(0, Math.min(index, routine.length - 1));
    setStepIndex(safe);
    setRemaining(routine[safe].duration);
    setRunning(false);
  }

  function reset() {
    setStepIndex(0);
    setRemaining(routine[0].duration);
    setRunning(false);
  }

  return (
    <main className="min-h-[100dvh] bg-[#07111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.13),transparent_28%),radial-gradient(circle_at_90%_12%,rgba(16,185,129,0.10),transparent_25%),linear-gradient(145deg,#07111f,#0b1729_55%,#09131f)]" />

      <div className="relative mx-auto max-w-[1450px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.16em] text-sky-200">
              KID · BADMINTON
            </div>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              素振り練習 · 10 min
            </h1>
            <div className="mt-1 text-sm text-slate-400">
              まずフォームを整えてから、スピードを上げます。今回は素振りだけに集中し、フットワークは入れません。
            </div>
          </div>

          <Link
            href="/display"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-semibold text-slate-200 active:bg-white/[0.14]"
          >
            <ArrowLeft size={18} />
            Screenへ戻る
          </Link>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-3xl border border-sky-300/10 bg-sky-300/[0.07] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold tracking-[0.14em] text-sky-200">
                  STEP {stepIndex + 1} / {routine.length}
                </div>
                <h2 className="mt-1 text-2xl font-bold sm:text-4xl">
                  {current.title}
                </h2>
                <div className="mt-2 text-base text-emerald-100">
                  {current.cue}
                </div>
              </div>

              <div className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-300">
                合計 10分
              </div>
            </div>

            <div className="mt-5">
              <SwingAnimation kind={current.side} />
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-sky-300 transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>

            <div className="mt-5 text-center text-[clamp(4.5rem,10vw,8rem)] font-bold leading-none tabular-nums">
              {formatTime(remaining)}
            </div>

            <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <button
                type="button"
                onClick={() => goToStep(stepIndex - 1)}
                disabled={stepIndex === 0}
                className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.07] disabled:opacity-30"
              >
                <ChevronLeft />
              </button>

              <button
                type="button"
                onClick={() => setRunning((value) => !value)}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sky-300 font-bold text-slate-950 active:scale-[0.99]"
              >
                {running ? <Pause size={22} /> : <Play size={22} />}
                {running ? "一時停止" : "スタート"}
              </button>

              <button
                type="button"
                onClick={() => goToStep(stepIndex + 1)}
                disabled={stepIndex === routine.length - 1}
                className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.07] disabled:opacity-30"
              >
                <ChevronRight />
              </button>
            </div>

            <button
              type="button"
              onClick={reset}
              className="mx-auto mt-3 flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-400 active:bg-white/[0.06]"
            >
              <RotateCcw size={15} />
              リセット
            </button>
          </article>

          <div className="grid content-start gap-4">
            <section className="rounded-3xl bg-white/[0.045] p-5">
              <div className="text-xs font-semibold tracking-[0.14em] text-emerald-200">
                フォームチェック
              </div>
              <div className="mt-3 text-lg font-bold">{current.cue}</div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                {current.detail}
              </div>

              <div className="mt-4 rounded-2xl bg-slate-950/30 p-4">
                <div className="font-semibold text-white">1セットのやり方</div>
                <div className="mt-2 text-sm leading-7 text-slate-400">
                  先慢速 5 次 → 正常速度 10 次 → 停下来检查动作 → 再重复。
                  不需要追求挥拍次数。
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white/[0.045] p-5">
              <div className="text-xs font-semibold tracking-[0.14em] text-sky-200">
                TODAY · 10分メニュー
              </div>

              <div className="mt-3 grid gap-2">
                {routine.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`grid min-h-12 grid-cols-[2.2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 text-left ${
                      index === stepIndex
                        ? "bg-sky-300/15 ring-1 ring-sky-300/20"
                        : "bg-slate-950/25 active:bg-white/[0.07]"
                    }`}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.07] text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-semibold">
                      {step.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {Math.round(step.duration / 30) / 2}m
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.05] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-100">
                <ShieldCheck size={17} />
                安全について
              </div>
              <div className="mt-2 text-xs leading-relaxed text-slate-400">
                室内练习先确认挥拍范围没有人、灯、家具。肩、肘、手腕出现疼痛时停止。
                动画只用于理解挥拍方向，不替代教练现场纠正动作。
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
