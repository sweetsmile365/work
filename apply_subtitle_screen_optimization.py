from pathlib import Path

ROOT = Path.cwd()
TARGET = ROOT / "components" / "EnglishBookAudio.tsx"

if not TARGET.exists():
    raise SystemExit(
        "找不到 components/EnglishBookAudio.tsx\n"
        "请把本脚本放到 work 项目根目录后再运行。"
    )

text = TARGET.read_text(encoding="utf-8")

old = '''                        {subtitleLoading ? (
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
'''

new = '''                        {subtitleLoading ? (
                          <div className="mt-4 text-lg text-slate-300">
                            字幕を読み込み中…
                          </div>
                        ) : (subtitle?.segments?.length ?? 0) > 0 ? (
                          <>
                            <div className="mt-4 rounded-2xl border-2 border-cyan-200/35 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(99,102,241,0.14))] px-5 py-4 shadow-[0_0_34px_rgba(34,211,238,0.12)]">
                              <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.16em] text-cyan-200 sm:text-xs">
                                <span className={`h-2.5 w-2.5 rounded-full ${playing ? "animate-pulse bg-cyan-300" : "bg-slate-500"}`} />
                                NOW READING
                              </div>

                              <div className="mt-3 min-h-[4.8rem] text-[clamp(1.55rem,2.0vw,2.35rem)] font-black leading-[1.38] tracking-[0.005em] text-white">
                                {activeSegmentIndex >= 0
                                  ? subtitle!.segments![activeSegmentIndex]?.text
                                  : subtitle!.segments![0]?.text}
                              </div>

                              <div className="mt-2 text-sm font-bold tabular-nums text-cyan-200/80 sm:text-base">
                                {formatTime(
                                  activeSegmentIndex >= 0
                                    ? subtitle!.segments![activeSegmentIndex]?.start ?? 0
                                    : subtitle!.segments![0]?.start ?? 0
                                )}
                              </div>
                            </div>

                            <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                              {subtitle!.segments!.map((segment, index) => {
                                const active = index === activeSegmentIndex;
                                const near =
                                  activeSegmentIndex >= 0 &&
                                  Math.abs(index - activeSegmentIndex) <= 1;

                                return (
                                  <button
                                    key={`${segment.start}-${index}`}
                                    ref={(element) => {
                                      subtitleRefs.current[index] = element;
                                    }}
                                    type="button"
                                    onClick={() => jumpToSegment(segment)}
                                    className={`block w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                                      active
                                        ? "border-cyan-100/70 bg-cyan-300 text-slate-950 shadow-[0_0_26px_rgba(103,232,249,0.28)]"
                                        : near
                                          ? "border-white/[0.07] bg-slate-900/70 text-white"
                                          : "border-transparent bg-slate-950/28 text-slate-300 hover:bg-white/[0.06]"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span
                                        className={`mt-1 shrink-0 text-xs font-bold tabular-nums sm:text-sm ${
                                          active ? "text-slate-700" : "text-slate-500"
                                        }`}
                                      >
                                        {formatTime(segment.start)}
                                      </span>

                                      <span
                                        className={`min-w-0 text-[clamp(1.08rem,1.15vw,1.35rem)] leading-[1.65] ${
                                          active
                                            ? "font-black"
                                            : near
                                              ? "font-bold"
                                              : "font-medium"
                                        }`}
                                      >
                                        {segment.text}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </>
'''

if old not in text:
    raise SystemExit(
        "没有找到当前字幕代码块。\n"
        "可能 components/EnglishBookAudio.tsx 已经再次修改，请不要强行运行。"
    )

text = text.replace(old, new, 1)

text = text.replace(
    '''                            <div className="mt-1 text-sm text-slate-400">
                              当前句高亮 · 点击句子重新播放
                            </div>''',
    '''                            <div className="mt-1 text-base font-semibold text-slate-300">
                              大屏字幕 · 当前句高亮 · 点击句子重新播放
                            </div>''',
    1,
)

TARGET.write_text(text, encoding="utf-8")

print("完成：components/EnglishBookAudio.tsx")
print("- NOW READING 大字幕")
print("- 当前句亮青色高亮")
print("- 前后句加粗")
print("- 普通字幕整体放大")
print("- 自动滚动保持")
print("下一步：GitHub Desktop -> Commit -> Push origin")
