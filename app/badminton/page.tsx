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

function FollowAlongAnimation({
  step,
  running
}: {
  step: Step;
  running: boolean;
}) {
  const motion =
    step.side === "backhand"
      ? "followBackhand"
      : step.side === "overhead"
        ? "followOverhead"
        : step.side === "drive"
          ? "followDrive"
          : step.side === "relax"
            ? "followRelax"
            : "followForehand";

  const cycle = step.side === "drive" ? 1.45 : 2.4;
  const playState = running ? "running" : "paused";

  const renderPerson = ({
    x,
    kid,
    delay
  }: {
    x: number;
    kid: boolean;
    delay: number;
  }) => {
    const headY = kid ? 78 : 66;
    const shoulderY = kid ? 118 : 112;
    const hipY = kid ? 184 : 192;
    const groundY = 268;
    const bodyWidth = kid ? 42 : 50;
    const racketLength = kid ? 72 : 82;
    const skin = kid ? "#f0c7a9" : "#d9ad8c";
    const jersey = kid ? "#38bdf8" : "#34d399";
    const shorts = kid ? "#1e3a5f" : "#164e63";
    const stroke = "rgba(226,232,240,0.92)";

    return (
      <g transform={`translate(${x} 0)`}>
        <ellipse
          cx="0"
          cy={groundY + 6}
          rx={kid ? 54 : 62}
          ry="8"
          fill="rgba(0,0,0,0.22)"
        />

        <circle cx="0" cy={headY} r={kid ? 15 : 17} fill={skin} />
        <path
          d={
            kid
              ? `M -15 ${headY - 6} Q 0 ${headY - 22} 15 ${headY - 6}`
              : `M -17 ${headY - 7} Q 0 ${headY - 24} 17 ${headY - 7}`
          }
          fill={kid ? "#2b1d1a" : "#27364a"}
        />

        <rect
          x={-bodyWidth / 2}
          y={shoulderY}
          width={bodyWidth}
          height={hipY - shoulderY}
          rx={kid ? 15 : 17}
          fill={jersey}
        />

        <path
          d={`M -${bodyWidth / 2 - 4} ${hipY - 5} L ${bodyWidth / 2 - 4} ${hipY - 5} L ${
            bodyWidth / 2 + 4
          } ${hipY + 28} L -${bodyWidth / 2 + 4} ${hipY + 28} Z`}
          fill={shorts}
        />

        <g
          style={{
            transformOrigin: `0px ${shoulderY + 4}px`,
            animation: `${motion} ${cycle}s cubic-bezier(.45,.05,.25,1) ${delay}s infinite`,
            animationPlayState: playState
          }}
        >
          <line
            x1="2"
            y1={shoulderY + 4}
            x2={kid ? 34 : 40}
            y2={kid ? shoulderY + 28 : shoulderY + 30}
            stroke={skin}
            strokeWidth={kid ? 9 : 10}
            strokeLinecap="round"
          />
          <line
            x1={kid ? 34 : 40}
            y1={kid ? shoulderY + 28 : shoulderY + 30}
            x2={kid ? 62 : 72}
            y2={kid ? shoulderY + 12 : shoulderY + 10}
            stroke={skin}
            strokeWidth={kid ? 8 : 9}
            strokeLinecap="round"
          />

          <line
            x1={kid ? 60 : 70}
            y1={kid ? shoulderY + 12 : shoulderY + 10}
            x2={kid ? 60 + racketLength - 28 : 70 + racketLength - 30}
            y2={kid ? shoulderY - 30 : shoulderY - 38}
            stroke="#cbd5e1"
            strokeWidth="5"
            strokeLinecap="round"
          />

          <ellipse
            cx={kid ? 60 + racketLength - 16 : 70 + racketLength - 18}
            cy={kid ? shoulderY - 46 : shoulderY - 56}
            rx={kid ? 16 : 18}
            ry={kid ? 23 : 27}
            fill="rgba(15,23,42,0.2)"
            stroke="#f8fafc"
            strokeWidth="4"
          />
          <line
            x1={kid ? 60 + racketLength - 28 : 70 + racketLength - 31}
            y1={kid ? shoulderY - 46 : shoulderY - 56}
            x2={kid ? 60 + racketLength - 4 : 70 + racketLength - 5}
            y2={kid ? shoulderY - 46 : shoulderY - 56}
            stroke="rgba(248,250,252,0.45)"
            strokeWidth="1.5"
          />
          <line
            x1={kid ? 60 + racketLength - 16 : 70 + racketLength - 18}
            y1={kid ? shoulderY - 66 : shoulderY - 79}
            x2={kid ? 60 + racketLength - 16 : 70 + racketLength - 18}
            y2={kid ? shoulderY - 26 : shoulderY - 33}
            stroke="rgba(248,250,252,0.45)"
            strokeWidth="1.5"
          />
        </g>

        <line
          x1="-4"
          y1={shoulderY + 8}
          x2={kid ? -28 : -34}
          y2={kid ? shoulderY + 38 : shoulderY + 42}
          stroke={skin}
          strokeWidth={kid ? 9 : 10}
          strokeLinecap="round"
        />

        <line
          x1="-10"
          y1={hipY + 20}
          x2={kid ? -26 : -31}
          y2={groundY}
          stroke={stroke}
          strokeWidth={kid ? 10 : 11}
          strokeLinecap="round"
        />
        <line
          x1="10"
          y1={hipY + 20}
          x2={kid ? 30 : 36}
          y2={groundY}
          stroke={stroke}
          strokeWidth={kid ? 10 : 11}
          strokeLinecap="round"
        />

        <line
          x1={kid ? -34 : -40}
          y1={groundY}
          x2={kid ? -18 : -22}
          y2={groundY}
          stroke="#f8fafc"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <line
          x1={kid ? 24 : 29}
          y1={groundY}
          x2={kid ? 42 : 50}
          y2={groundY}
          stroke="#f8fafc"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>
    );
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-sky-300/10 bg-slate-950/35">
      <style jsx>{`
        @keyframes followForehand {
          0%,
          14% {
            transform: rotate(-48deg);
          }
          44% {
            transform: rotate(26deg);
          }
          58% {
            transform: rotate(58deg);
          }
          78% {
            transform: rotate(38deg);
          }
          100% {
            transform: rotate(-48deg);
          }
        }

        @keyframes followBackhand {
          0%,
          14% {
            transform: rotate(42deg);
          }
          48% {
            transform: rotate(-34deg);
          }
          64% {
            transform: rotate(-58deg);
          }
          100% {
            transform: rotate(42deg);
          }
        }

        @keyframes followOverhead {
          0%,
          16% {
            transform: rotate(-82deg);
          }
          42% {
            transform: rotate(-38deg);
          }
          58% {
            transform: rotate(34deg);
          }
          76% {
            transform: rotate(58deg);
          }
          100% {
            transform: rotate(-82deg);
          }
        }

        @keyframes followDrive {
          0%,
          12% {
            transform: rotate(-20deg);
          }
          46% {
            transform: rotate(18deg);
          }
          62% {
            transform: rotate(32deg);
          }
          100% {
            transform: rotate(-20deg);
          }
        }

        @keyframes followRelax {
          0%,
          18% {
            transform: rotate(-24deg);
          }
          52% {
            transform: rotate(18deg);
          }
          100% {
            transform: rotate(-24deg);
          }
        }

        @keyframes hitPulse {
          0%,
          38%,
          100% {
            opacity: 0.22;
            transform: scale(0.82);
          }
          52%,
          62% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        @keyframes shuttleMove {
          0%,
          38% {
            transform: translate(0, 0);
            opacity: 0;
          }
          52% {
            opacity: 1;
          }
          100% {
            transform: translate(82px, -42px);
            opacity: 0;
          }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.14em] text-sky-200">
            FOLLOW ALONG · いっしょに素振り
          </div>
          <div className="mt-0.5 text-sm font-semibold text-white">
            コーチを見て → 0.5秒あとにまねる
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              running ? "bg-emerald-300" : "bg-slate-600"
            }`}
          />
          <span className="text-[10px] font-semibold text-slate-300">
            {running ? "練習中" : "スタートで開始"}
          </span>
        </div>
      </div>

      <div className="relative min-h-[330px] overflow-hidden bg-[radial-gradient(circle_at_50%_15%,rgba(56,189,248,0.10),transparent_30%),linear-gradient(180deg,#071524,#091421)]">
        <div className="absolute inset-x-0 top-3 grid grid-cols-2 px-8 text-center">
          <div>
            <div className="text-[10px] font-bold tracking-[0.16em] text-emerald-200">
              COACH
            </div>
            <div className="mt-1 text-[10px] text-slate-500">先に動く</div>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-[0.16em] text-sky-200">
              KID
            </div>
            <div className="mt-1 text-[10px] text-slate-500">0.5秒あと</div>
          </div>
        </div>

        <svg
          viewBox="0 0 760 330"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`${step.title} のコーチと子どもの素振りアニメーション`}
        >
          <line
            x1="36"
            y1="286"
            x2="724"
            y2="286"
            stroke="rgba(148,163,184,0.14)"
            strokeWidth="2"
          />

          <line
            x1="380"
            y1="56"
            x2="380"
            y2="286"
            stroke="rgba(148,163,184,0.09)"
            strokeDasharray="8 10"
          />

          {renderPerson({ x: 205, kid: false, delay: 0 })}
          {renderPerson({ x: 555, kid: true, delay: 0.5 })}

          <g
            style={{
              transformOrigin: "335px 116px",
              animation: `${motion} ${cycle}s cubic-bezier(.45,.05,.25,1) 0s infinite`,
              animationPlayState: playState
            }}
          >
            <g
              style={{
                transformOrigin: "345px 93px",
                animation: `shuttleMove ${cycle}s ease-out 0s infinite`,
                animationPlayState: playState
              }}
            >
              <circle cx="344" cy="94" r="5" fill="#fde047" />
              <path
                d="M340 90 L334 83 M344 89 L343 80 M348 90 L353 83"
                stroke="#fde68a"
                strokeWidth="2"
              />
            </g>
          </g>
        </svg>

        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-slate-950/55 px-4 py-2 backdrop-blur-sm">
            {["1", "2", "3", "HIT"].map((beat, index) => (
              <span
                key={beat}
                className={`grid h-8 min-w-8 place-items-center rounded-full px-2 text-[10px] font-bold ${
                  beat === "HIT"
                    ? "bg-amber-300/15 text-amber-100"
                    : "bg-white/[0.06] text-slate-300"
                }`}
                style={
                  beat === "HIT"
                    ? {
                        animation: `hitPulse ${cycle}s ease-in-out 0s infinite`,
                        animationPlayState: playState
                      }
                    : undefined
                }
              >
                {beat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-2 border-t border-white/5 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <div className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
          今見るポイント
        </div>
        <div className="text-sm leading-relaxed text-slate-300">
          {step.cue}
        </div>
      </div>

      <div className="border-t border-white/5 px-4 py-3 text-[11px] leading-relaxed text-slate-500">
        COACHの動きを見てからKIDが少し遅れて同じ動きをします。
        速さよりフォームを優先し、疲れたら一度止めてください。
      </div>
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
              <FollowAlongAnimation step={current} running={running} />
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
                  ゆっくり5回 → 通常速度で10回 → 一度止まってフォーム確認 → もう一度繰り返します。回数を増やすことは目的にしません。
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
                室内では、人・照明・家具にラケットが当たらない十分なスペースを確保してください。肩・肘・手首に痛みが出たら中止します。アニメーションは動きの目安であり、実際のフォームは必要に応じてコーチに確認してください。
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
