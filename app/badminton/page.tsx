"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Timer
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

const badmintonVideoUrl = (path?: string) =>
  path ? `/badminton/videos/${path}` : "";

type RacketSkill = {
  id: string;
  title: string;
  videoPath: string;
  practiceSeconds: number;
  target: string;
  cue: string;
  note: string;
};

const racketSkills: RacketSkill[] = [
  {
    id: "figure-eight",
    practiceSeconds: 40,
    title: "① 八の字 · Figure Eight",
    videoPath: "racket/figure-eight.mp4",
    target: "30〜45秒 × 2回",
    cue: "ラケットヘッドで滑らかな「8」を描く",
    note: "肩の力を抜き、手首と前腕を柔らかく使います。大きく振りすぎません。"
  },
  {
    id: "forearm-figure-eight",
    practiceSeconds: 40,
    title: "② 前腕の八の字",
    videoPath: "racket/forearm-figure-eight.mp4",
    target: "30〜45秒 × 2回",
    cue: "前腕の回旋を使って連続させる",
    note: "肘を固めず、前腕が自然に回る感覚を覚えます。"
  },
  {
    id: "quick-swing",
    practiceSeconds: 30,
    title: "③ 前腕クイックスイング",
    videoPath: "racket/quick-swing.mp4",
    target: "15〜20回 × 2回",
    cue: "小さな動きで素早く切り返す",
    note: "力任せに振らず、指・手首・前腕を連動させます。"
  },
  {
    id: "finger-control",
    practiceSeconds: 40,
    title: "④ 指でラケット操作",
    videoPath: "racket/finger-control.mp4",
    target: "30秒 × 2回",
    cue: "握り込まず、指で拍面をコントロール",
    note: "グリップを常に強く握らず、必要な瞬間だけ短く締めます。"
  },
  {
    id: "grip-switch",
    practiceSeconds: 40,
    title: "⑤ 正反手グリップ切替",
    videoPath: "racket/grip-switch.mp4",
    target: "10〜15往復 × 2回",
    cue: "フォア ↔ バックを止まらず切り替える",
    note: "親指と人差し指を中心に、握り替えを小さく速く行います。"
  },
  {
    id: "juggling",
    practiceSeconds: 90,
    title: "⑥ 正反手リフティング",
    videoPath: "racket/juggling.mp4",
    target: "90秒 · できる所まで",
    cue: "まず同じ面で3回 → 慣れたらフォア・バック交互",
    note: "最初から交互連続を目標にしません。①同じ面で3回、②5回、③正反手交互3回の順に進めます。"
  },
  {
    id: "stop-control",
    practiceSeconds: 90,
    title: "⑦ 正反手ストップ",
    videoPath: "racket/stop-control.mp4",
    target: "90秒 · 1回止められればOK",
    cue: "まず高く上げたシャトルを1回だけ柔らかく止める",
    note: "①フォアだけ、②バックだけ、③左右交互の順。成功回数より、拍面を柔らかく使う感覚を優先します。"
  }
];

type AnkleStep = {
  id: string;
  title: string;
  videoPath?: string;
  practiceSeconds: number;
  target: string;
  cue: string;
  note: string;
};

const ankleRoutine: AnkleStep[] = [
  {
    id: "plantar-flexion",
    practiceSeconds: 60,
    title: "バンド底屈 · つま先を下へ",
    videoPath: "ankle/plantar-flexion.mp4",
    target: "8〜10回 × 2セット",
    cue: "つま先をゆっくり下へ押し、戻す時もゆっくり",
    note: "軽いゴムから開始。膝と股関節はなるべく動かさず、足首をコントロールします。"
  },
  {
    id: "eversion",
    practiceSeconds: 50,
    title: "バンド外返し · 外側を強くする",
    videoPath: "ankle/eversion.mp4",
    target: "8回 × 2セット",
    cue: "かかとを動かさず、足先だけ外へ",
    note: "足首の外側の筋肉を使います。急いで反動をつけないようにします。"
  },
  {
    id: "inversion",
    practiceSeconds: 50,
    title: "バンド内返し · 内側をコントロール",
    videoPath: "ankle/inversion.mp4",
    target: "8回 × 2セット",
    cue: "軽い抵抗で、足先を内側へゆっくり",
    note: "強いゴムは不要です。痛みや引っかかりがあれば中止します。"
  },
  {
    id: "calf-raise",
    practiceSeconds: 60,
    title: "カーフレイズ · 提踵",
    videoPath: "ankle/calf-raise.mp4",
    target: "10回 × 2セット",
    cue: "両足でゆっくり上げて、3秒かけて下ろす",
    note: "壁や椅子に手を添えて安定させます。両足で安定してから片足へ進みます。"
  },
  {
    id: "single-leg-balance",
    practiceSeconds: 30,
    title: "片脚バランス · 足首の安定",
    target: "30秒 × 2回 / 左右",
    cue: "壁や椅子のそばで片脚立ち",
    note: "転びそうになったらすぐ支えられる場所で行います。動画にはありませんが、足首の安定性を高めるために追加しています。"
  }
];

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

function PracticeTimer({
  seconds,
  label,
  resetKey
}: {
  seconds: number;
  label: string;
  resetKey: string;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(false);
  }, [seconds, resetKey]);

  useEffect(() => {
    if (!running) return;

    const timerId = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [running]);

  const progress =
    seconds > 0 ? Math.max(0, Math.min(1, remaining / seconds)) : 0;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/35 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-amber-200">
            <Timer size={14} />
            PRACTICE TIMER
          </div>
          <div className="mt-1 text-xs text-slate-400">{label}</div>
        </div>

        <div className="text-3xl font-bold tabular-nums text-white">
          {formatTime(remaining)}
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-emerald-300 transition-[width] duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            if (remaining === 0) setRemaining(seconds);
            setRunning((current) => !current);
          }}
          className={`min-h-11 rounded-xl text-sm font-bold transition active:scale-[0.98] ${
            running
              ? "bg-amber-300/15 text-amber-100"
              : "bg-emerald-300 text-slate-950"
          }`}
        >
          {running ? "PAUSE" : remaining === 0 ? "RESTART" : "START"}
        </button>

        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining(seconds);
          }}
          className="min-h-11 rounded-xl bg-white/[0.07] text-sm font-semibold text-slate-200 transition active:scale-[0.98]"
        >
          RESET
        </button>
      </div>

      {remaining === 0 ? (
        <div className="mt-3 rounded-xl bg-emerald-300/12 px-3 py-2 text-center text-sm font-bold text-emerald-100">
          完了 ✓　少し休んで次へ
        </div>
      ) : null}
    </div>
  );
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
  const [racketIndex, setRacketIndex] = useState(0);
  const [ankleIndex, setAnkleIndex] = useState(0);
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
              真人動画はアプリ内のローカル動画から再生。ラケット7技巧・足首ケア・素振り10分を分けて練習できます。
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



        <section className="mt-4 rounded-3xl border border-sky-300/10 bg-sky-300/[0.055] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-[0.14em] text-sky-200">
                RACKET CONTROL · 7技巧
              </div>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                ラケット操作 · 真人示範
              </h2>
              <div className="mt-1 text-xs leading-relaxed text-slate-400">
                ①〜⑤は毎日の基本練習。⑥〜⑦はチャレンジ練習として、できなくてもOK。動画を見てからタイマーで練習します。
              </div>
            </div>

            <div className="rounded-full border border-sky-200/10 bg-sky-300/10 px-3 py-1.5 text-xs font-semibold text-sky-100">
              LOCAL VIDEO
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-950/35">
              <div className="border-b border-white/5 px-4 py-3">
                <div className="text-[10px] font-bold tracking-[0.12em] text-amber-200">
                  真人示範 · REAL DEMO
                </div>
                <div className="mt-1 text-base font-bold text-white">
                  {racketSkills[racketIndex].title}
                </div>
              </div>

              <div className="flex min-h-[300px] items-center justify-center bg-black p-2">
                <video
                  key={racketSkills[racketIndex].videoPath}
                  className="max-h-[390px] w-full object-contain"
                  src={badmintonVideoUrl(racketSkills[racketIndex].videoPath)}
                  controls
                  playsInline
                  preload="metadata"
                  loop
                >
                  お使いのブラウザでは動画を再生できません。
                </video>
              </div>

              <div className="grid gap-2 border-t border-white/5 px-4 py-3">
                <div className="text-sm font-bold text-sky-100">
                  {racketSkills[racketIndex].target}
                </div>
                <div className="text-sm leading-relaxed text-white">
                  {racketSkills[racketIndex].cue}
                </div>
                <div className="text-xs leading-relaxed text-slate-400">
                  {racketSkills[racketIndex].note}
                </div>

                <PracticeTimer
                  seconds={racketSkills[racketIndex].practiceSeconds}
                  label="動画を見た後、子どもが自分で練習"
                  resetKey={racketSkills[racketIndex].id}
                />
              </div>
            </div>

            <div className="grid content-start gap-2">
              {racketSkills.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRacketIndex(index)}
                  className={`grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 text-left transition ${
                    index === racketIndex
                      ? "bg-sky-300/15 ring-1 ring-sky-300/20"
                      : "bg-slate-950/25 active:bg-white/[0.07]"
                  }`}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.07] text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="block min-w-0 truncate text-sm font-semibold text-white">
                        {item.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          index < 5
                            ? "bg-emerald-300/10 text-emerald-100"
                            : "bg-amber-300/10 text-amber-100"
                        }`}
                      >
                        {index < 5 ? "DAILY" : "CHALLENGE"}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                      {item.target}
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-slate-500" />
                </button>
              ))}

              <div className="mt-2 rounded-2xl border border-sky-300/10 bg-sky-300/[0.04] p-3 text-[11px] leading-relaxed text-slate-400">
                動画は <span className="text-sky-200">public/badminton/videos/racket/</span> から読み込みます。
                完全な39秒動画は使わず、7つの短い示範に分割しています。
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.055] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-emerald-200">
                <Activity size={17} />
                ANKLE GUARD · 足首ケア
              </div>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                足首を守る · 4〜5 min
              </h2>
              <div className="mt-1 text-xs leading-relaxed text-slate-400">
                素振り10分とは別メニュー。痛みがない日に5〜7分程度、軽い強度で行います。
              </div>
            </div>

            <div className="rounded-full border border-emerald-200/10 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              週3回から
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-950/35">
              <div className="border-b border-white/5 px-4 py-3">
                <div className="text-[10px] font-bold tracking-[0.12em] text-amber-200">
                  真人示範 · REAL DEMO
                </div>
                <div className="mt-1 text-base font-bold text-white">
                  {ankleRoutine[ankleIndex].title}
                </div>
              </div>

              {ankleRoutine[ankleIndex].videoPath ? (
                <div className="flex min-h-[300px] items-center justify-center bg-black p-2">
                  <video
                    key={ankleRoutine[ankleIndex].videoPath}
                    className="max-h-[380px] w-full object-contain"
                    src={badmintonVideoUrl(ankleRoutine[ankleIndex].videoPath)}
                    controls
                    playsInline
                    preload="metadata"
                    loop
                  >
                    お使いのブラウザでは動画を再生できません。
                  </video>
                </div>
              ) : (
                <div className="grid min-h-[300px] place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(52,211,153,0.12),transparent_35%),#071524] px-6 text-center">
                  <div>
                    <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-emerald-200/15 bg-emerald-300/10 text-5xl">
                      🦶
                    </div>
                    <div className="mt-4 text-xl font-bold text-white">
                      片脚で30秒
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      壁・椅子のすぐ横で行う
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-2 border-t border-white/5 px-4 py-3">
                <div className="text-sm font-bold text-emerald-100">
                  {ankleRoutine[ankleIndex].target}
                </div>
                <div className="text-sm leading-relaxed text-white">
                  {ankleRoutine[ankleIndex].cue}
                </div>
                <div className="text-xs leading-relaxed text-slate-400">
                  {ankleRoutine[ankleIndex].note}
                </div>

                <PracticeTimer
                  seconds={ankleRoutine[ankleIndex].practiceSeconds}
                  label={
                    ankleRoutine[ankleIndex].id === "single-leg-balance"
                      ? "左右それぞれ。壁・椅子のそばで"
                      : "ゆっくり正しいフォームで行う"
                  }
                  resetKey={ankleRoutine[ankleIndex].id}
                />
              </div>
            </div>

            <div className="grid content-start gap-2">
              {ankleRoutine.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAnkleIndex(index)}
                  className={`grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 text-left transition ${
                    index === ankleIndex
                      ? "bg-emerald-300/15 ring-1 ring-emerald-300/20"
                      : "bg-slate-950/25 active:bg-white/[0.07]"
                  }`}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.07] text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                      {item.target}
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-slate-500" />
                </button>
              ))}

              <div className="mt-2 rounded-2xl border border-amber-300/10 bg-amber-300/[0.05] p-3 text-[11px] leading-relaxed text-slate-400">
                動画内に「20回×4セット」と表示されていますが、このアプリではその回数を採用しません。
                子どもは軽い抵抗・少ない回数から始めます。足首に痛み、腫れ、熱感、不安定感がある日は中止してください。
              </div>
            </div>
          </div>
        </section>

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

            <div className="mt-3 rounded-xl border border-white/[0.05] bg-slate-950/20 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
              真人スイング動画は今後
              <span className="mx-1 text-sky-200">public/badminton/videos/swing/</span>
              に forehand.mp4 / backhand.mp4 / overhead.mp4 を追加して差し替えます。
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

            <section className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.05] p-4">
              <div className="text-xs font-semibold tracking-[0.12em] text-cyan-200">
                RECOMMENDED · おすすめ練習量
              </div>
              <div className="mt-3 grid gap-3">
                <div className="rounded-xl bg-slate-950/25 p-3">
                  <div className="font-bold text-white">ラケット①〜⑤</div>
                  <div className="mt-1 text-xs text-slate-300">
                    毎日OK · 合計3〜5分
                  </div>
                </div>
                <div className="rounded-xl bg-amber-300/[0.05] p-3">
                  <div className="font-bold text-white">ラケット⑥〜⑦</div>
                  <div className="mt-1 text-xs text-slate-300">
                    Challenge · 各90秒 · 失敗してOK
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950/25 p-3">
                  <div className="font-bold text-white">足首ケア</div>
                  <div className="mt-1 text-xs text-slate-300">
                    週3回 · 5〜7分
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950/25 p-3">
                  <div className="font-bold text-white">素振り</div>
                  <div className="mt-1 text-xs text-slate-300">
                    10分 · 疲れた日は短縮
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.05] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-100">
                <ShieldCheck size={17} />
                安全について
              </div>
              <div className="mt-2 text-xs leading-relaxed text-slate-400">
                室内では、人・照明・家具にラケットが当たらない十分なスペースを確保してください。肩・肘・手首、または足首に痛みが出たら中止します。足首に腫れや不安定感がある場合は練習より先に医療者へ相談してください。実際のフォームは必要に応じてコーチに確認してください。
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
