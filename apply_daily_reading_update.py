from __future__ import annotations

from pathlib import Path

ROOT = Path.cwd()

DISPLAY = ROOT / "app" / "display" / "page.tsx"
MEALTIME = ROOT / "app" / "mealtime" / "page.tsx"
COMPONENT = ROOT / "components" / "EnglishBookAudio.tsx"
BOOK_API = ROOT / "app" / "api" / "book-audio" / "route.ts"
STREAM_API = ROOT / "app" / "api" / "book-audio" / "stream" / "route.ts"


def must_exist(path: Path) -> None:
    if not path.exists():
        raise SystemExit(f"找不到文件: {path}\n请在 work 项目根目录运行这个脚本。")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count == 0:
        raise SystemExit(f"没有找到需要修改的代码块: {label}\n可能文件版本已经变化。")
    if count > 1:
        raise SystemExit(f"找到多个相同代码块: {label} ({count})\n为避免误改，脚本已停止。")
    return text.replace(old, new, 1)


for p in [DISPLAY, MEALTIME, COMPONENT, BOOK_API]:
    must_exist(p)

# 1) EnglishBookAudio.tsx
text = COMPONENT.read_text(encoding="utf-8")

if "  Square,\n" not in text:
    text = replace_once(
        text,
        "  Play,\n  Volume2,\n",
        "  Play,\n  Square,\n  Volume2,\n",
        "导入 Square 图标",
    )

auto_open_anchor = """  const [audioError, setAudioError] = useState(false);

  const items = list?.items ?? [];
"""
auto_open_new = """  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("audio") === "1") {
      setOpen(true);
    }
  }, []);

  const items = list?.items ?? [];
"""
if 'params.get("audio") === "1"' not in text:
    text = replace_once(
        text,
        auto_open_anchor,
        auto_open_new,
        "从 Dashboard 自动打开每日阅读播放器",
    )

toggle_anchor = """  async function togglePlay() {
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

  function seekTo(value: number) {
"""
toggle_new = """  async function togglePlay() {
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
"""
if "function stopPlayback()" not in text:
    text = replace_once(text, toggle_anchor, toggle_new, "增加 STOP 功能")

old_floating = """      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] inline-flex min-h-12 items-center gap-2 rounded-full border border-sky-200/20 bg-slate-950/90 px-4 text-sm font-bold text-sky-100 shadow-[0_12px_36px_rgba(0,0,0,0.38)] backdrop-blur-xl transition hover:bg-slate-900"
        aria-label="英语书音频播放器"
      >
        <Headphones className="h-5 w-5" />
        BOOK AUDIO
      </button>
"""
new_floating = """      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] inline-flex min-h-14 items-center gap-2 rounded-2xl border-2 border-violet-200/35 bg-violet-300 px-5 text-sm font-black text-slate-950 shadow-[0_14px_40px_rgba(139,92,246,0.38)] transition hover:bg-violet-200"
        aria-label="每日阅读音频播放器"
      >
        <Headphones className="h-5 w-5" />
        每日阅读 · AUDIO
      </button>
"""
if "每日阅读 · AUDIO" not in text:
    text = replace_once(text, old_floating, new_floating, "增强每日阅读浮动入口")

old_controls = """                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => seekBy(-10)}
                          className="min-h-11 rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-slate-200"
                        >
                          −10s
                        </button>

                        <button
                          type="button"
                          onClick={togglePlay}
                          className="grid h-14 w-14 place-items-center rounded-full bg-sky-300 text-slate-950"
                          aria-label={playing ? "暂停" : "播放"}
                        >
                          {playing ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6 pl-0.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => seekBy(10)}
                          className="min-h-11 rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-slate-200"
                        >
                          +10s
                        </button>
                      </div>
"""
new_controls = """                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
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
"""
if '{playing ? "PAUSE" : "PLAY"}' not in text:
    text = replace_once(text, old_controls, new_controls, "明显的 PLAY / PAUSE / STOP")

text = text.replace(
    "                  ENGLISH BOOK AUDIO\n",
    "                  每日阅读 · ENGLISH AUDIO\n",
    1,
)
COMPONENT.write_text(text, encoding="utf-8")

# 2) book-audio route -> local stream API
text = BOOK_API.read_text(encoding="utf-8")
old_audio_url = """      audioUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
"""
new_audio_url = """      audioUrl: `/api/book-audio/stream?id=${encodeURIComponent(file.id)}`,
"""
if old_audio_url in text:
    text = text.replace(old_audio_url, new_audio_url, 1)
elif "/api/book-audio/stream?id=" not in text:
    raise SystemExit("没有找到 app/api/book-audio/route.ts 的 audioUrl。")
BOOK_API.write_text(text, encoding="utf-8")

# 3) new stream route
STREAM_API.parent.mkdir(parents=True, exist_ok=True)

stream_route = r"""import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validDriveId(value: string) {
  return /^[A-Za-z0-9_-]{10,}$/.test(value);
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";

  if (!validDriveId(id)) {
    return NextResponse.json(
      { ok: false, error: "Invalid Google Drive file id" },
      { status: 400 }
    );
  }

  const range = request.headers.get("range");

  const candidates = [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
      id
    )}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`
  ];

  let lastStatus = 502;

  for (const url of candidates) {
    try {
      const upstream = await fetch(url, {
        cache: "no-store",
        redirect: "follow",
        headers: {
          ...(range ? { Range: range } : {}),
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
        }
      });

      lastStatus = upstream.status;

      if (!upstream.ok && upstream.status !== 206) continue;

      const contentType = upstream.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) continue;

      const headers = new Headers();
      headers.set("Content-Type", contentType || "audio/mpeg");
      headers.set("Cache-Control", "private, max-age=3600");
      headers.set("Accept-Ranges", "bytes");

      for (const name of [
        "content-length",
        "content-range",
        "etag",
        "last-modified"
      ]) {
        const value = upstream.headers.get(name);
        if (value) headers.set(name, value);
      }

      return new NextResponse(upstream.body, {
        status: upstream.status === 206 ? 206 : 200,
        headers
      });
    } catch {
      // try next Google Drive endpoint
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        "Google Drive audio could not be streamed. Check folder sharing."
    },
    { status: lastStatus === 403 || lastStatus === 404 ? lastStatus : 502 }
  );
}
"""
STREAM_API.write_text(stream_route, encoding="utf-8")

# 4) Dashboard: remove tiny ENGLISH pill, add prominent Daily Reading card
text = DISPLAY.read_text(encoding="utf-8")

mobile_small = """                <Link
                  href="/mealtime"
                  className="shrink-0 rounded-full bg-violet-300/10 px-3 py-1.5 text-xs font-semibold text-violet-100 active:bg-violet-300/20"
                  aria-label="ごはん時間のニュースと英語"
                  title="NEWS + ENGLISH · ごはん時間の英語"
                >
                  📰 ENGLISH
                </Link>
"""
if mobile_small in text:
    text = text.replace(mobile_small, "", 1)

desktop_small = """                    <Link
                      href="/mealtime"
                      className="rounded-full bg-violet-300/10 px-2.5 py-1 text-[10px] font-semibold text-violet-100 active:bg-violet-300/20"
                      aria-label="ごはん時間のニュースと英語"
                      title="NEWS + ENGLISH · ごはん時間の英語"
                    >
                      📰 ENGLISH
                    </Link>
"""
if desktop_small in text:
    text = text.replace(desktop_small, "", 1)

mobile_insert_anchor = """              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {data.routineTasks.map((task) => (
"""
mobile_card = """              </div>
            </div>

            <Link
              href="/mealtime?audio=1"
              className="mt-3 flex min-h-[74px] items-center justify-between gap-3 rounded-2xl border border-violet-200/25 bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(56,189,248,0.12))] px-4 py-3 shadow-[0_10px_28px_rgba(76,29,149,0.20)] active:bg-violet-300/20"
              aria-label="每日阅读"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-300/20 text-violet-100">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-black text-white">每日阅读</div>
                  <div className="mt-0.5 truncate text-xs text-violet-100/80">
                    英语原文 · 音频 · 同步字幕 · 跟读
                  </div>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-violet-200 px-3 py-1.5 text-xs font-black text-slate-950">
                OPEN →
              </span>
            </Link>

            <div className="mt-3 grid gap-2">
              {data.routineTasks.map((task) => (
"""
if text.count('href="/mealtime?audio=1"') == 0:
    text = replace_once(
        text,
        mobile_insert_anchor,
        mobile_card,
        "移动版 Dashboard 每日阅读大卡片",
    )

desktop_insert_anchor = """                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {data.routineTasks.map((task) => (
"""
desktop_card = """                  </div>
                </div>

                <Link
                  href="/mealtime?audio=1"
                  className="mb-3 flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-violet-200/25 bg-[linear-gradient(135deg,rgba(139,92,246,0.24),rgba(56,189,248,0.12))] px-4 py-3 shadow-[0_10px_28px_rgba(76,29,149,0.20)] transition active:bg-violet-300/20"
                  aria-label="每日阅读"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-300/20 text-violet-100">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[clamp(1rem,1vw,1.2rem)] font-black text-white">
                        每日阅读
                      </div>
                      <div className="mt-0.5 truncate text-[clamp(0.7rem,0.7vw,0.85rem)] text-violet-100/80">
                        英语原文 · 音频 · 同步字幕 · 跟读
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-200 px-3 py-1.5 text-[10px] font-black text-slate-950">
                    OPEN →
                  </span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  {data.routineTasks.map((task) => (
"""
if text.count('href="/mealtime?audio=1"') < 2:
    text = replace_once(
        text,
        desktop_insert_anchor,
        desktop_card,
        "桌面版 Dashboard 每日阅读大卡片",
    )

DISPLAY.write_text(text, encoding="utf-8")

# 5) rename mealtime page
text = MEALTIME.read_text(encoding="utf-8")
text = text.replace("TODAY'S NEWS & ENGLISH", "DAILY ENGLISH READING", 1)
text = text.replace("ごはん時間の英語", "每日阅读", 1)
text = text.replace(
    "公式YouTube · ページ内再生 · 自動更新",
    "英语阅读 · 音频跟读 · 新闻听力",
    1,
)
MEALTIME.write_text(text, encoding="utf-8")

print("修改完成：")
print("  app/display/page.tsx")
print("  app/mealtime/page.tsx")
print("  components/EnglishBookAudio.tsx")
print("  app/api/book-audio/route.ts")
print("  app/api/book-audio/stream/route.ts  (新增)")
print()
print("下一步：GitHub Desktop -> Commit -> Push origin")
