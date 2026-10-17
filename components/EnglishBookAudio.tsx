"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  X
} from "lucide-react";

type AudioKind = "reading" | "vocab";
type ReadingMode = "tap" | "english" | "hints";
type PlaybackMode = "sentence" | "continuous";

type AudioItem = {
  id: string;
  name: string;
  viewUrl: string;
  audioUrl: string;
  subtitleUrl: string;
};

type AudioListResponse = {
  ok: boolean;
  kind: AudioKind;
  label?: string;
  folderUrl: string;
  needsSharing?: boolean;
  items: AudioItem[];
  error?: string;
};

type SubtitleSegment = {
  start: number;
  end: number;
  text: string;
};

type SubtitlePayload = {
  source_file?: string;
  duration?: number;
  model?: string;
  segments?: SubtitleSegment[];
};

type StudyWord = {
  word: string;
  ja: string;
  zh: string;
  level: "2級" | "準1級";
};

const EIKEN_STUDY_WORDS: Record<string, Omit<StudyWord, "word">> = {
  achieve: { ja: "達成する", zh: "实现；达成", level: "2級" },
  advantage: { ja: "利点", zh: "优点；优势", level: "2級" },
  affect: { ja: "影響を与える", zh: "影响", level: "2級" },
  apply: { ja: "適用する・申し込む", zh: "应用；申请", level: "2級" },
  approach: { ja: "方法・接近する", zh: "方法；接近", level: "2級" },
  appropriate: { ja: "適切な", zh: "适当的；合适的", level: "準1級" },
  available: { ja: "利用できる", zh: "可获得的；可利用的", level: "2級" },
  benefit: { ja: "利益・恩恵", zh: "好处；受益", level: "2級" },
  challenge: { ja: "課題・挑戦", zh: "挑战；难题", level: "2級" },
  communicate: { ja: "意思疎通する", zh: "沟通", level: "2級" },
  compare: { ja: "比較する", zh: "比较", level: "2級" },
  concern: { ja: "懸念・関係する", zh: "担忧；涉及", level: "2級" },
  consider: { ja: "考慮する", zh: "考虑", level: "2級" },
  contribute: { ja: "貢献する", zh: "贡献", level: "2級" },
  decrease: { ja: "減少する", zh: "减少", level: "2級" },
  demand: { ja: "需要・要求する", zh: "需求；要求", level: "2級" },
  determine: { ja: "決定する・判断する", zh: "决定；确定", level: "2級" },
  develop: { ja: "発達する・開発する", zh: "发展；开发", level: "2級" },
  environment: { ja: "環境", zh: "环境", level: "2級" },
  establish: { ja: "設立する・確立する", zh: "建立；确立", level: "2級" },
  evidence: { ja: "証拠", zh: "证据", level: "2級" },
  factor: { ja: "要因", zh: "因素", level: "2級" },
  feature: { ja: "特徴", zh: "特征；功能", level: "2級" },
  generate: { ja: "生み出す", zh: "产生；生成", level: "2級" },
  identify: { ja: "特定する", zh: "识别；确定", level: "2級" },
  impact: { ja: "影響", zh: "影响", level: "2級" },
  improve: { ja: "改善する", zh: "改善", level: "2級" },
  increase: { ja: "増加する", zh: "增加", level: "2級" },
  individual: { ja: "個人・個々の", zh: "个人；个体的", level: "2級" },
  influence: { ja: "影響を与える", zh: "影响", level: "2級" },
  involve: { ja: "含む・関与させる", zh: "涉及；包含", level: "2級" },
  issue: { ja: "問題・論点", zh: "问题；议题", level: "2級" },
  maintain: { ja: "維持する", zh: "维持", level: "2級" },
  occur: { ja: "起こる", zh: "发生", level: "2級" },
  opportunity: { ja: "機会", zh: "机会", level: "2級" },
  participate: { ja: "参加する", zh: "参加", level: "2級" },
  particular: { ja: "特定の・特に", zh: "特定的；特别的", level: "2級" },
  perform: { ja: "行う・演じる", zh: "执行；表演", level: "2級" },
  prevent: { ja: "防ぐ", zh: "防止", level: "2級" },
  process: { ja: "過程・処理する", zh: "过程；处理", level: "2級" },
  provide: { ja: "提供する", zh: "提供", level: "2級" },
  require: { ja: "必要とする", zh: "需要；要求", level: "2級" },
  research: { ja: "研究", zh: "研究", level: "2級" },
  respond: { ja: "応答する", zh: "回应", level: "2級" },
  significant: { ja: "重要な・かなりの", zh: "重要的；显著的", level: "2級" },
  specific: { ja: "具体的な・特定の", zh: "具体的；特定的", level: "2級" },
  suggest: { ja: "提案する・示唆する", zh: "建议；表明", level: "2級" },
  support: { ja: "支援する", zh: "支持；支援", level: "2級" },
  technology: { ja: "技術", zh: "技术", level: "2級" },
  tend: { ja: "～する傾向がある", zh: "倾向于", level: "2級" },
  theory: { ja: "理論", zh: "理论", level: "2級" },
  therefore: { ja: "したがって", zh: "因此", level: "2級" },
  various: { ja: "さまざまな", zh: "各种各样的", level: "2級" },
  ability: { ja: "能力", zh: "能力", level: "2級" },
  accurate: { ja: "正確な", zh: "准确的", level: "2級" },
  adapt: { ja: "適応する", zh: "适应", level: "準1級" },
  analyze: { ja: "分析する", zh: "分析", level: "2級" },
  artificial: { ja: "人工の", zh: "人工的", level: "2級" },
  assumption: { ja: "仮定", zh: "假设", level: "準1級" },
  awareness: { ja: "認識・意識", zh: "意识；认知", level: "準1級" },
  capable: { ja: "能力がある", zh: "有能力的", level: "2級" },
  circumstance: { ja: "状況・事情", zh: "情况；环境", level: "準1級" },
  complex: { ja: "複雑な", zh: "复杂的", level: "2級" },
  consequence: { ja: "結果・重大な影響", zh: "后果；结果", level: "準1級" },
  context: { ja: "文脈・状況", zh: "语境；背景", level: "準1級" },
  crucial: { ja: "極めて重要な", zh: "至关重要的", level: "準1級" },
  efficient: { ja: "効率的な", zh: "高效的", level: "2級" },
  eliminate: { ja: "取り除く", zh: "消除", level: "準1級" },
  evaluate: { ja: "評価する", zh: "评估", level: "準1級" },
  essential: { ja: "不可欠な", zh: "必不可少的", level: "2級" },
  estimate: { ja: "見積もる", zh: "估计", level: "2級" },
  frequently: { ja: "頻繁に", zh: "频繁地", level: "2級" },
  fundamental: { ja: "基本的な・根本的な", zh: "基本的；根本的", level: "準1級" },
  indicate: { ja: "示す", zh: "表明；指示", level: "2級" },
  interpret: { ja: "解釈する", zh: "解释；理解", level: "準1級" },
  likely: { ja: "可能性が高い", zh: "很可能的", level: "2級" },
  obtain: { ja: "得る", zh: "获得", level: "2級" },
  perceive: { ja: "認識する", zh: "感知；察觉", level: "準1級" },
  potential: { ja: "潜在的な・可能性", zh: "潜在的；潜力", level: "2級" },
  principle: { ja: "原則", zh: "原则", level: "2級" },
  recognize: { ja: "認識する", zh: "识别；认识到", level: "2級" },
  relevant: { ja: "関連のある", zh: "相关的", level: "準1級" },
  reliable: { ja: "信頼できる", zh: "可靠的", level: "2級" },
  resource: { ja: "資源・資料", zh: "资源；资料", level: "2級" },
  restrict: { ja: "制限する", zh: "限制", level: "2級" },
  strategy: { ja: "戦略", zh: "策略；战略", level: "2級" },
  sufficient: { ja: "十分な", zh: "足够的", level: "準1級" },
  transform: { ja: "変える・変換する", zh: "转变；转换", level: "2級" },
  unique: { ja: "独特の", zh: "独特的", level: "2級" },
  accept: { ja: "受け入れる", zh: "接受", level: "2級" },
  action: { ja: "行動", zh: "行动", level: "2級" },
  activity: { ja: "活動", zh: "活动", level: "2級" },
  ancient: { ja: "古代の", zh: "古代的", level: "2級" },
  appear: { ja: "現れる", zh: "出现", level: "2級" },
  avoid: { ja: "避ける", zh: "避免", level: "2級" },
  behavior: { ja: "行動・ふるまい", zh: "行为", level: "2級" },
  cause: { ja: "原因・引き起こす", zh: "原因；导致", level: "2級" },
  change: { ja: "変化・変える", zh: "变化；改变", level: "2級" },
  common: { ja: "一般的な", zh: "常见的", level: "2級" },
  community: { ja: "地域社会・共同体", zh: "社区；共同体", level: "2級" },
  create: { ja: "作り出す", zh: "创造", level: "2級" },
  culture: { ja: "文化", zh: "文化", level: "2級" },
  decision: { ja: "決定", zh: "决定", level: "2級" },
  describe: { ja: "説明する・描写する", zh: "描述", level: "2級" },
  difference: { ja: "違い", zh: "差异", level: "2級" },
  discover: { ja: "発見する", zh: "发现", level: "2級" },
  education: { ja: "教育", zh: "教育", level: "2級" },
  effect: { ja: "効果・影響", zh: "效果；影响", level: "2級" },
  experience: { ja: "経験", zh: "经验", level: "2級" },
  explain: { ja: "説明する", zh: "解释", level: "2級" },
  future: { ja: "未来", zh: "未来", level: "2級" },
  government: { ja: "政府", zh: "政府", level: "2級" },
  habit: { ja: "習慣", zh: "习惯", level: "2級" },
  history: { ja: "歴史", zh: "历史", level: "2級" },
  imagine: { ja: "想像する", zh: "想象", level: "2級" },
  include: { ja: "含む", zh: "包括", level: "2級" },
  information: { ja: "情報", zh: "信息", level: "2級" },
  knowledge: { ja: "知識", zh: "知识", level: "2級" },
  language: { ja: "言語", zh: "语言", level: "2級" },
  local: { ja: "地域の・地元の", zh: "当地的", level: "2級" },
  modern: { ja: "現代の", zh: "现代的", level: "2級" },
  natural: { ja: "自然の", zh: "自然的", level: "2級" },
  necessary: { ja: "必要な", zh: "必要的", level: "2級" },
  opinion: { ja: "意見", zh: "意见", level: "2級" },
  organize: { ja: "整理する・組織する", zh: "组织；整理", level: "2級" },
  possible: { ja: "可能な", zh: "可能的", level: "2級" },
  problem: { ja: "問題", zh: "问题", level: "2級" },
  protect: { ja: "守る", zh: "保护", level: "2級" },
  public: { ja: "公共の・公の", zh: "公共的", level: "2級" },
  reason: { ja: "理由", zh: "理由", level: "2級" },
  relationship: { ja: "関係", zh: "关系", level: "2級" },
  society: { ja: "社会", zh: "社会", level: "2級" },
  solution: { ja: "解決策", zh: "解决方案", level: "2級" },
  traditional: { ja: "伝統的な", zh: "传统的", level: "2級" },
  understand: { ja: "理解する", zh: "理解", level: "2級" },
  value: { ja: "価値", zh: "价值", level: "2級" }
};

const SPEEDS = [0.75, 0.9, 1, 1.15, 1.25, 1.5];

const KIND_LABELS: Record<AudioKind, string> = {
  reading: "READING AUDIO",
  vocab: "VOCAB AUDIO"
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const secs = String(whole % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function progressKey(itemId: string) {
  return `english-book-audio-position:${itemId}`;
}

function lastItemKey(kind: AudioKind) {
  return `english-book-audio-last:${kind}`;
}

function knownWordsKey(itemId: string) {
  return `english-book-known-words:${itemId}`;
}

function readCountKey(itemId: string) {
  return `english-book-read-count:${itemId}`;
}

function readingModeKey() {
  if (typeof window === "undefined") return "english-reading-mode:default";
  try {
    const raw = window.localStorage.getItem("family-schedule-hub-state");
    const state = raw ? (JSON.parse(raw) as { currentUser?: { id?: string; role?: string } }) : null;
    const user = state?.currentUser;
    return `english-reading-mode:${user?.id ?? user?.role ?? "default"}`;
  } catch {
    return "english-reading-mode:default";
  }
}

function normalizeWord(value: string) {
  return value.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
}

export default function EnglishBookAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const subtitleRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastSavedSecond = useRef(-1);
  const sentenceTargetIndex = useRef<number | null>(null);
  const pendingAutoPlay = useRef(false);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<AudioKind>("reading");
  const [list, setList] = useState<AudioListResponse | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState<SubtitlePayload | null>(null);
  const [subtitleLoading, setSubtitleLoading] = useState(false);
  const [subtitleOn, setSubtitleOn] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const [readCount, setReadCount] = useState(0);
  const [readingMode, setReadingMode] = useState<ReadingMode>("tap");
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("sentence");
  const [autoNextTrack, setAutoNextTrack] = useState(false);
  const [translatedWord, setTranslatedWord] = useState<string | null>(null);
  const [offlineDictionary, setOfflineDictionary] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("audio") === "1") setOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(readingModeKey());
    if (saved === "tap" || saved === "english" || saved === "hints") {
      setReadingMode(saved);
    }
  }, []);

  useEffect(() => {
    if (!open || Object.keys(offlineDictionary).length > 0) return;
    let cancelled = false;
    void fetch("/dictionaries/ejdict-subtitle.json")
      .then((response) => (response.ok ? response.json() : {}))
      .then((payload) => {
        if (!cancelled && payload && typeof payload === "object") {
          setOfflineDictionary(payload as Record<string, string>);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [offlineDictionary, open]);

  function changeReadingMode(mode: ReadingMode) {
    setReadingMode(mode);
    setTranslatedWord(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(readingModeKey(), mode);
    }
  }

  const items = list?.items ?? [];
  const selected =
    items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const selectedIndex = selected
    ? items.findIndex((item) => item.id === selected.id)
    : -1;

  // Audio files and OCR subtitle JSON can have different leading silence or
  // encoding durations. Keep both views on one normalized timeline.
  const subtitleTimingScale =
    duration > 0 && (subtitle?.duration ?? 0) > 0
      ? duration / (subtitle?.duration ?? duration)
      : 1;

  const activeSegmentIndex = useMemo(() => {
    const segments = subtitle?.segments ?? [];
    if (segments.length === 0) return -1;
    const subtitleTime = currentTime / subtitleTimingScale;

    const exact = segments.findIndex(
      (segment) =>
        subtitleTime >= segment.start &&
        subtitleTime < Math.max(segment.end, segment.start + 0.15)
    );

    if (exact >= 0) return exact;

    for (let index = segments.length - 1; index >= 0; index -= 1) {
      if (subtitleTime >= segments[index].start) return index;
    }

    return -1;
  }, [currentTime, subtitle, subtitleTimingScale]);

  const studyWords = useMemo(() => {
    const seen = new Set<string>();
    const result: StudyWord[] = [];

    for (const segment of subtitle?.segments ?? []) {
      for (const token of segment.text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []) {
        const word = normalizeWord(token);
        if (!word || seen.has(word)) continue;
        const entry = EIKEN_STUDY_WORDS[word];
        if (!entry) continue;
        seen.add(word);
        result.push({ word, ...entry });
      }
    }

    return result
      .filter((item) => !knownWords.includes(item.word))
      .slice(0, 15);
  }, [knownWords, subtitle]);

  const activeWords = useMemo(() => {
    const activeText =
      activeSegmentIndex >= 0
        ? subtitle?.segments?.[activeSegmentIndex]?.text ?? ""
        : "";

    return new Set(
      (activeText.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).map(normalizeWord)
    );
  }, [activeSegmentIndex, subtitle]);

  const activeDictionaryWords = useMemo(() => {
    if (readingMode === "english") return [];
    const text = activeSegmentIndex >= 0 ? subtitle?.segments?.[activeSegmentIndex]?.text ?? "" : "";
    return Array.from(new Set((text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).map(normalizeWord)))
      .filter((word) => Boolean(EIKEN_STUDY_WORDS[word]))
      .map((word) => ({ word, ...EIKEN_STUDY_WORDS[word] }));
  }, [activeSegmentIndex, readingMode, subtitle]);

  const activeSentenceText = useMemo(() => {
    if (!(subtitle?.segments?.length ?? 0)) return "";
    return activeSegmentIndex >= 0
      ? subtitle?.segments?.[activeSegmentIndex]?.text ?? ""
      : subtitle?.segments?.[0]?.text ?? "";
  }, [activeSegmentIndex, subtitle]);

  const selectedWordMeaning = translatedWord
    ? offlineDictionary[translatedWord] ?? EIKEN_STUDY_WORDS[translatedWord]?.ja ?? ""
    : "";

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setListLoading(true);
    setList(null);
    setSelectedId(null);

    void fetch(`/api/book-audio?kind=${kind}`, { cache: "no-store" })
      .then(async (response) => {
        const value = (await response.json()) as AudioListResponse;
        if (cancelled) return;

        setList(value);

        const saved =
          typeof window !== "undefined"
            ? window.localStorage.getItem(lastItemKey(kind))
            : null;

        const initial =
          value.items.find((item) => item.id === saved) ??
          value.items[0] ??
          null;

        setSelectedId(initial?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setList({
            ok: false,
            kind,
            folderUrl: "",
            needsSharing: true,
            items: [],
            error: "Audio list could not be loaded."
          });
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, open]);

  useEffect(() => {
    if (!selected || typeof window === "undefined") {
      setReadCount(0);
      return;
    }

    const saved = Number(window.localStorage.getItem(readCountKey(selected.id)));
    setReadCount(Number.isFinite(saved) && saved > 0 ? Math.floor(saved) : 0);
  }, [selected?.id]);

  useEffect(() => {
    if (!selected || typeof window === "undefined") {
      setKnownWords([]);
      return;
    }

    try {
      const saved = JSON.parse(
        window.localStorage.getItem(knownWordsKey(selected.id)) ?? "[]"
      );
      setKnownWords(Array.isArray(saved) ? saved : []);
    } catch {
      setKnownWords([]);
    }
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) {
      setSubtitle(null);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(lastItemKey(kind), selected.id);
    }

    let cancelled = false;
    setSubtitleLoading(true);
    setSubtitle(null);

    void fetch(selected.subtitleUrl, { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Subtitle ${response.status}`);
        const value = (await response.json()) as SubtitlePayload;
        if (!cancelled) setSubtitle(value);
      })
      .catch(() => {
        if (!cancelled) setSubtitle({ segments: [] });
      })
      .finally(() => {
        if (!cancelled) setSubtitleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, selected]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selected) return;

    audio.pause();
    audio.src = selected.audioUrl;
    audio.playbackRate = speed;
    audio.load();

    setPlaying(false);
    setCurrentTime(0);
    setDuration(subtitle?.duration ?? 0);
    setAudioError(false);
    setTranslatedWord(null);
    sentenceTargetIndex.current = null;
    lastSavedSecond.current = -1;
  }, [selected?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (!subtitleOn || activeSegmentIndex < 0) return;
    subtitleRefs.current[activeSegmentIndex]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth"
    });
  }, [activeSegmentIndex, subtitleOn]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function restorePosition() {
    if (!selected || !audioRef.current || typeof window === "undefined") return;
    const saved = Number(window.localStorage.getItem(progressKey(selected.id)));
    if (
      Number.isFinite(saved) &&
      saved > 0 &&
      saved <
        Math.max(audioRef.current.duration || 0, subtitle?.duration || 0) - 2
    ) {
      audioRef.current.currentTime = saved;
      setCurrentTime(saved);
    }
  }

  function persistPosition(value: number) {
    if (!selected || typeof window === "undefined") return;
    const second = Math.floor(value);
    if (second === lastSavedSecond.current || second % 5 !== 0) return;

    lastSavedSecond.current = second;
    window.localStorage.setItem(progressKey(selected.id), String(value));
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !selected) return;

    setAudioError(false);

    if (playing) {
      audio.pause();
      return;
    }

    try {
      audio.playbackRate = speed;
      if (playbackMode === "sentence" && (subtitle?.segments?.length ?? 0) > 0) {
        const index = activeSegmentIndex >= 0 ? activeSegmentIndex : 0;
        const segment = subtitle!.segments![index];
        const start = segment.start * subtitleTimingScale;
        const end = segment.end * subtitleTimingScale;
        if (audio.currentTime < start - 0.05 || audio.currentTime >= end - 0.08) {
          seekTo(start + 0.01);
        }
        sentenceTargetIndex.current = index;
      } else {
        sentenceTargetIndex.current = null;
      }
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
    sentenceTargetIndex.current = null;
  }

  function seekTo(value: number) {
    const audio = audioRef.current;
    if (!audio) return;

    const upper =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : duration || subtitle?.duration || value;

    const next = Math.max(0, Math.min(value, upper));
    audio.currentTime = next;
    setCurrentTime(next);
  }

  function pickRelative(offset: number) {
    if (selectedIndex < 0) return;
    const next = items[selectedIndex + offset];
    if (next) setSelectedId(next.id);
  }

  function playSegment(index: number) {
    const segment = subtitle?.segments?.[index];
    if (!segment) return;

    seekTo(segment.start * subtitleTimingScale + 0.01);
    sentenceTargetIndex.current = playbackMode === "sentence" ? index : null;
    setAudioError(false);
    void audioRef.current?.play().catch(() => {
      setAudioError(true);
      setPlaying(false);
    });
  }

  function moveSentence(offset: number) {
    const segments = subtitle?.segments ?? [];
    if (segments.length === 0) return;
    const base = activeSegmentIndex >= 0 ? activeSegmentIndex : 0;
    playSegment(Math.max(0, Math.min(base + offset, segments.length - 1)));
  }

  function replaySentence() {
    const segments = subtitle?.segments ?? [];
    if (segments.length === 0) return;
    playSegment(activeSegmentIndex >= 0 ? activeSegmentIndex : 0);
  }

  function selectWord(word: string) {
    if (playbackMode === "sentence") audioRef.current?.pause();
    setTranslatedWord((current) => (current === word ? null : word));
  }

  function markWordKnown(word: string) {
    if (!selected || typeof window === "undefined") return;
    const next = Array.from(new Set([...knownWords, word]));
    setKnownWords(next);
    window.localStorage.setItem(knownWordsKey(selected.id), JSON.stringify(next));
  }

  function restoreKnownWords() {
    if (!selected || typeof window === "undefined") return;
    setKnownWords([]);
    window.localStorage.removeItem(knownWordsKey(selected.id));
  }

  const progressMax = Math.max(
    duration || 0,
    subtitle?.duration || 0,
    currentTime,
    1
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] inline-flex min-h-14 items-center gap-2 rounded-2xl border-2 border-violet-200/35 bg-violet-300 px-5 text-sm font-black text-slate-950 shadow-[0_14px_40px_rgba(139,92,246,0.38)] transition hover:bg-violet-200"
        aria-label="每日阅读音频播放器"
      >
        <Headphones className="h-5 w-5" />
        每日阅读 · AUDIO
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] bg-slate-950/82 p-3 backdrop-blur-md sm:p-5">
          <div className="mx-auto flex h-full max-w-[1480px] flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,#0b1724,#0b1f2b_52%,#0b1724)] text-white shadow-2xl">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-sky-200">
                  <BookOpen className="h-4 w-4" />
                  每日阅读 · ENGLISH AUDIO
                </div>
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  《超强英语阅读训练 1》
                </h2>
                <div className="mt-1 text-xs text-slate-400">
                  Google Drive Audio · Sync Subtitle · EIKEN 2+ Vocabulary
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  audioRef.current?.pause();
                  setOpen(false);
                }}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-slate-200"
                aria-label="关闭播放器"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="max-h-[48vh] overflow-y-auto border-b border-white/[0.07] p-4 lg:max-h-none lg:min-h-0 lg:border-b-0 lg:border-r">
                <div className="grid grid-cols-2 gap-2">
                  {(["reading", "vocab"] as AudioKind[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setKind(value)}
                      className={`min-h-11 rounded-xl text-xs font-bold ${
                        kind === value
                          ? "bg-sky-300 text-slate-950"
                          : "bg-white/[0.05] text-slate-300"
                      }`}
                    >
                      {KIND_LABELS[value]}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
                    SELECT
                  </label>

                  <select
                    value={selected?.id ?? ""}
                    onChange={(event) => setSelectedId(event.target.value)}
                    disabled={items.length === 0}
                    className="mt-2 h-11 w-full rounded-xl border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-white outline-none disabled:opacity-50"
                  >
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name.replace(/\.mp3$/i, "")}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => pickRelative(-1)}
                      disabled={selectedIndex <= 0}
                      className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/[0.05] text-xs font-semibold text-slate-300 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      PREV
                    </button>
                    <button
                      type="button"
                      onClick={() => pickRelative(1)}
                      disabled={
                        selectedIndex < 0 || selectedIndex >= items.length - 1
                      }
                      className="flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/[0.05] text-xs font-semibold text-slate-300 disabled:opacity-30"
                    >
                      NEXT
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {listLoading ? (
                  <div className="mt-4 rounded-xl bg-white/[0.04] p-3 text-xs text-slate-400">
                    Google Drive を読み込み中…
                  </div>
                ) : null}

                {!listLoading && list?.needsSharing ? (
                  <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.07] p-3 text-xs leading-relaxed text-amber-100">
                    Google Drive 文件夹目前无法从 Dashboard 读取。
                    <div className="mt-2 text-slate-300">
                      文件夹共享设置改成「知道链接的人 / 閲覧者」后，
                      这里会自动列出全部音频。
                    </div>
                    {list.folderUrl ? (
                      <a
                        href={list.folderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-300/10 px-3 py-2 font-semibold"
                      >
                        OPEN DRIVE
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {selected ? (
                  <div className="mt-4 rounded-xl bg-white/[0.035] p-3">
                    <div className="text-[10px] text-slate-500">
                      CURRENT TRACK
                    </div>
                    <div className="mt-1 break-words text-sm font-semibold text-white">
                      {selected.name}
                    </div>
                    <a
                      href={selected.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-200"
                    >
                      Google Driveで開く
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}

                {selected ? (
                  <div className="mt-4 rounded-xl border border-cyan-200/15 bg-cyan-300/[0.055] p-3">
                    <div className="text-[10px] font-bold tracking-[0.12em] text-cyan-200">
                      再生コントロール
                    </div>

                    <div className="mt-3 grid grid-cols-2 rounded-xl bg-slate-950/55 p-1">
                      {([
                        ["sentence", "一文ずつ"],
                        ["continuous", "連続再生"]
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setPlaybackMode(value);
                            sentenceTargetIndex.current =
                              value === "sentence" && activeSegmentIndex >= 0
                                ? activeSegmentIndex
                                : null;
                          }}
                          className={`min-h-10 rounded-lg px-2 text-xs font-black transition ${
                            playbackMode === value
                              ? "bg-cyan-300 text-slate-950"
                              : "text-slate-300 hover:bg-white/[0.07]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-cyan-100/60 bg-cyan-300 px-4 text-base font-black text-slate-950 shadow-[0_0_24px_rgba(103,232,249,0.2)]"
                        aria-label={playing ? "一時停止" : "再生"}
                      >
                        {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        {playing ? "一時停止" : "再生"}
                      </button>
                      <button
                        type="button"
                        onClick={stopPlayback}
                        className="inline-flex min-h-14 min-w-14 items-center justify-center rounded-xl border border-rose-200/30 bg-rose-300/15 text-rose-100"
                        aria-label="停止"
                        title="停止"
                      >
                        <Square className="h-5 w-5 fill-current" />
                      </button>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => moveSentence(-1)}
                        disabled={(subtitle?.segments?.length ?? 0) === 0 || activeSegmentIndex <= 0}
                        className="inline-flex h-12 items-center justify-center rounded-lg bg-white/[0.06] text-slate-200 disabled:opacity-30"
                        aria-label="前の文"
                        title="前の文"
                      >
                        <SkipBack className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={replaySentence}
                        disabled={(subtitle?.segments?.length ?? 0) === 0}
                        className="inline-flex h-12 items-center justify-center rounded-lg bg-white/[0.06] text-slate-200 disabled:opacity-30"
                        aria-label="現在の文をもう一度"
                        title="もう一度"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSentence(1)}
                        disabled={
                          (subtitle?.segments?.length ?? 0) === 0 ||
                          activeSegmentIndex >= (subtitle?.segments?.length ?? 0) - 1
                        }
                        className="inline-flex h-12 items-center justify-center rounded-lg bg-white/[0.06] text-slate-200 disabled:opacity-30"
                        aria-label="次の文"
                        title="次の文"
                      >
                        <SkipForward className="h-5 w-5" />
                      </button>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={progressMax}
                      step="0.1"
                      value={Math.min(currentTime, progressMax)}
                      onChange={(event) => seekTo(Number(event.target.value))}
                      className="mt-3 w-full accent-sky-300"
                      aria-label="再生位置"
                    />
                    <div className="mt-1 flex justify-between text-xs font-semibold tabular-nums text-slate-300">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(progressMax)}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="text-[10px] leading-relaxed text-emerald-100">
                        読了 {readCount} 回
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubtitleOn((value) => !value)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          subtitleOn
                            ? "bg-violet-300/15 text-violet-100"
                            : "bg-white/[0.05] text-slate-400"
                        }`}
                      >
                        CC {subtitleOn ? "ON" : "OFF"}
                      </button>
                    </div>

                    <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg bg-white/[0.045] px-3 text-xs font-bold text-slate-300">
                      <span>終了後に次の音声を再生</span>
                      <input
                        type="checkbox"
                        checked={autoNextTrack}
                        onChange={(event) => setAutoNextTrack(event.target.checked)}
                        disabled={playbackMode !== "continuous"}
                        className="h-5 w-5 accent-cyan-300 disabled:opacity-40"
                      />
                    </label>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-slate-400">
                        <Volume2 className="h-4 w-4" />
                        再生速度
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {SPEEDS.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSpeed(value)}
                            className={`min-h-10 rounded-lg px-2 text-xs font-bold ${
                              speed === value
                                ? "bg-emerald-300 text-slate-950"
                                : "bg-white/[0.06] text-slate-300"
                            }`}
                          >
                            {value}×
                          </button>
                        ))}
                      </div>
                    </div>

                    {audioError ? (
                      <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.07] p-3 text-xs leading-relaxed text-amber-100">
                        音声を再生できません。Google Drive の共有設定を確認してください。
                      </div>
                    ) : null}

                    <div className="mt-4 text-[10px] font-bold tracking-[0.12em] text-slate-400">
                      読み方
                    </div>
                    <div className="mt-2 grid gap-2">
                      {([
                        ["tap", "タップで意味を見る"],
                        ["english", "英語のみ"],
                        ["hints", "単語ヒント"]
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => changeReadingMode(value)}
                          className={`min-h-11 rounded-lg px-3 text-sm font-bold transition ${
                            readingMode === value
                              ? "bg-cyan-300 text-slate-950"
                              : "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </aside>

              <main className="min-h-0 overflow-y-auto p-4 sm:p-6">
                <audio
                  ref={audioRef}
                  preload="metadata"
                  onLoadedMetadata={(event) => {
                    const value = event.currentTarget.duration;
                    if (Number.isFinite(value)) setDuration(value);
                    event.currentTarget.playbackRate = speed;
                    if (!pendingAutoPlay.current) restorePosition();
                  }}
                  onCanPlay={(event) => {
                    if (!pendingAutoPlay.current) return;
                    pendingAutoPlay.current = false;
                    event.currentTarget.currentTime = 0;
                    event.currentTarget.playbackRate = speed;
                    void event.currentTarget.play().catch(() => {
                      setAudioError(true);
                      setPlaying(false);
                    });
                  }}
                  onTimeUpdate={(event) => {
                    const value = event.currentTarget.currentTime;
                    setCurrentTime(value);
                    persistPosition(value);

                    const target = sentenceTargetIndex.current;
                    const segment =
                      target === null ? null : subtitle?.segments?.[target] ?? null;
                    if (playbackMode === "sentence" && segment) {
                      const stopAt = Math.max(
                        segment.start * subtitleTimingScale,
                        segment.end * subtitleTimingScale - 0.04
                      );
                      if (value >= stopAt) {
                        event.currentTarget.pause();
                        event.currentTarget.currentTime = stopAt;
                        setCurrentTime(stopAt);
                        sentenceTargetIndex.current = null;
                      }
                    }
                  }}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => {
                    setPlaying(false);
                    sentenceTargetIndex.current = null;
                    if (selected && typeof window !== "undefined") {
                      setReadCount((current) => {
                        const next = current + 1;
                        window.localStorage.setItem(readCountKey(selected.id), String(next));
                        return next;
                      });
                    }

                    if (
                      playbackMode === "continuous" &&
                      autoNextTrack &&
                      selectedIndex >= 0 &&
                      selectedIndex < items.length - 1
                    ) {
                      pendingAutoPlay.current = true;
                      setSelectedId(items[selectedIndex + 1].id);
                    }
                  }}
                  onError={() => {
                    setAudioError(true);
                    setPlaying(false);
                  }}
                />

                {selected ? (
                  <>
                    {subtitleOn ? (
                      <section className="rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="min-w-0">
                            <div className="text-[10px] font-bold tracking-[0.12em] text-violet-200">
                              SYNC SUBTITLE
                            </div>
                            <div className="mt-1 text-base font-semibold text-slate-300">
                              {playbackMode === "sentence"
                                ? "一文ずつ停止 · 文をタップして練習"
                                : "連続再生 · 現在の文をハイライト"}
                            </div>
                            </div>
                          </div>

                          {subtitle?.model ? (
                            <span className="text-[9px] text-slate-500">
                              {subtitle.model}
                            </span>
                          ) : null}
                        </div>

                        {subtitleLoading ? (
                          <div className="mt-4 text-lg text-slate-300">
                            字幕を読み込み中…
                          </div>
                        ) : (subtitle?.segments?.length ?? 0) > 0 ? (
                          <>
                            <div className="mt-4 rounded-2xl border-2 border-cyan-200/35 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(99,102,241,0.14))] px-5 py-4 shadow-[0_0_34px_rgba(34,211,238,0.12)]">
                              <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.16em] text-cyan-200 sm:text-xs">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    playing
                                      ? "animate-pulse bg-cyan-300"
                                      : "bg-slate-500"
                                  }`}
                                />
                                NOW READING
                              </div>

                              <div className="mt-3 min-h-[4.8rem] text-[clamp(1.55rem,2.0vw,2.35rem)] font-black leading-[1.5] tracking-[0.005em] text-white">
                                {readingMode === "english"
                                  ? activeSentenceText
                                  : activeSentenceText
                                      .split(/([A-Za-z][A-Za-z'’-]*)/g)
                                      .map((part, index) => {
                                        const word = normalizeWord(part);
                                        const meaning =
                                          offlineDictionary[word] ?? EIKEN_STUDY_WORDS[word]?.ja;
                                        if (!meaning || !/[A-Za-z]/.test(part)) {
                                          return <span key={`${part}-${index}`}>{part}</span>;
                                        }
                                        const selectedWord = translatedWord === word;
                                        return (
                                          <button
                                            key={`${part}-${index}`}
                                            type="button"
                                            onClick={() => selectWord(word)}
                                            className={`mx-0.5 inline rounded-lg px-1 py-0.5 text-left font-black underline decoration-dotted underline-offset-4 transition ${
                                              selectedWord
                                                ? "bg-amber-300 text-slate-950 decoration-transparent"
                                                : "text-white decoration-cyan-300/70 hover:bg-white/10 focus:bg-white/10"
                                            }`}
                                            aria-label={`${part} の意味を見る`}
                                          >
                                            {part}
                                          </button>
                                        );
                                      })}
                              </div>

                              {translatedWord && selectedWordMeaning ? (
                                <div className="mt-4 rounded-xl border border-amber-200/30 bg-slate-950/45 px-4 py-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-sm font-black uppercase tracking-wide text-amber-200">
                                      {translatedWord}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setTranslatedWord(null)}
                                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-slate-300"
                                      aria-label="単語の意味を閉じる"
                                      title="閉じる"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className="mt-1 text-base font-semibold leading-relaxed text-white">
                                    {selectedWordMeaning}
                                  </div>
                                  <div className="mt-2 text-[10px] text-slate-400">
                                    EJDict · CC0 · オフライン英和辞典
                                  </div>
                                </div>
                              ) : null}

                              {readingMode === "hints" && activeDictionaryWords.length > 0 ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {activeDictionaryWords.map((item) => (
                                    <button
                                      key={item.word}
                                      type="button"
                                      onClick={() => selectWord(item.word)}
                                      className="min-h-10 rounded-lg border border-amber-200/30 bg-amber-200/10 px-3 text-sm font-bold text-amber-100"
                                    >
                                      {item.word}
                                      {readingMode === "hints" || translatedWord === item.word ? ` · ${item.ja}` : ""}
                                    </button>
                                  ))}
                                </div>
                              ) : null}

                              <div className="mt-2 text-sm font-bold tabular-nums text-cyan-200/80 sm:text-base">
                                {formatTime(
                                  activeSegmentIndex >= 0
                                    ? subtitle!.segments![activeSegmentIndex]
                                        ?.start ?? 0
                                    : subtitle!.segments![0]?.start ?? 0
                                )}
                              </div>
                            </div>

                            <div
                              className={`mt-4 grid min-h-0 gap-4 ${
                                readingMode === "hints"
                                  ? "xl:grid-cols-[minmax(0,1fr)_330px]"
                                  : "grid-cols-1"
                              }`}
                            >
                              <div className="max-h-[56vh] w-full space-y-2 overflow-y-auto pr-1">
                                {subtitle!.segments!.map((segment, index) => {
                                  const active =
                                    index === activeSegmentIndex;
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
                                      onClick={() => playSegment(index)}
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
                                            active
                                              ? "text-slate-700"
                                              : "text-slate-500"
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

                              {readingMode === "hints" ? <aside className="max-h-[50vh] overflow-hidden rounded-2xl border border-amber-200/15 bg-amber-200/[0.045]">
                                <div className="border-b border-white/[0.06] bg-[#111d26]/95 px-4 py-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="text-[10px] font-black tracking-[0.14em] text-amber-200">
                                        VOCAB · 英検2級+
                                      </div>
                                      <div className="mt-1 text-xs leading-relaxed text-slate-400">
                                        本文の難しい単語 · 日語 + 中文
                                      </div>
                                    </div>

                                    {knownWords.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={restoreKnownWords}
                                        className="shrink-0 rounded-lg bg-white/[0.06] px-2 py-1 text-[9px] font-bold text-slate-400"
                                      >
                                        RESET
                                      </button>
                                    ) : null}
                                  </div>

                                  <div className="mt-2 text-[10px] text-slate-500">
                                    {studyWords.length} words · 目標 10〜15語 · 「覚えた」で非表示
                                  </div>
                                </div>

                                <div className="max-h-[calc(50vh-82px)] space-y-2 overflow-y-auto p-3">
                                  {studyWords.length > 0 ? (
                                    studyWords.map((item) => {
                                      const active = activeWords.has(item.word);

                                      return (
                                        <div
                                          key={item.word}
                                          className={`rounded-xl border p-3 transition ${
                                            active
                                              ? "border-amber-200/60 bg-amber-200/15 shadow-[0_0_18px_rgba(253,230,138,0.10)]"
                                              : "border-white/[0.06] bg-slate-950/30"
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-base font-black text-white">
                                                  {item.word}
                                                </span>
                                                <span
                                                  className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                                                    item.level === "準1級"
                                                      ? "bg-rose-300/15 text-rose-200"
                                                      : "bg-sky-300/15 text-sky-200"
                                                  }`}
                                                >
                                                  英検{item.level}
                                                </span>
                                              </div>

                                              <div className="mt-2 text-sm font-bold text-amber-100">
                                                🇯🇵 {item.ja}
                                              </div>
                                              <div className="mt-1 text-sm font-semibold text-cyan-100">
                                                🇨🇳 {item.zh}
                                              </div>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                markWordKnown(item.word)
                                              }
                                              className="shrink-0 rounded-lg bg-emerald-300/10 px-2 py-1.5 text-[9px] font-bold text-emerald-200"
                                            >
                                              覚えた
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="rounded-xl bg-slate-950/30 p-4 text-center text-xs leading-relaxed text-slate-400">
                                      この文章では、登録済みの英検2級以上の単語は見つかりませんでした。
                                    </div>
                                  )}
                                </div>
                              </aside> : null}
                            </div>
                          </>
                        ) : (
                          <div className="mt-4 rounded-xl bg-slate-950/30 p-4 text-sm text-slate-400">
                            这条音频没有找到对应的 JSON 字幕。
                          </div>
                        )}
                      </section>
                    ) : null}
                  </>
                ) : (
                  <div className="grid min-h-[360px] place-items-center rounded-2xl bg-slate-950/30 text-center text-sm text-slate-400">
                    {listLoading
                      ? "Google Drive 音频读取中…"
                      : "先完成 Drive 文件夹共享设置。"}
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
