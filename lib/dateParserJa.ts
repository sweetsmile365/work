import { classifyJapaneseEvent } from "./eventClassifierJa";
import type { ImportCandidate } from "@/types/imports";

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

export function convertReiwaToGregorian(reiwaYear: number) {
  return 2018 + reiwaYear;
}

export function validateJapaneseWeekday(date: Date, weekdayText?: string) {
  if (!weekdayText) return true;
  return weekdays[date.getDay()] === weekdayText.replace(/[（）()曜日]/g, "");
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseJapaneseDate(rawText: string, fiscalYear: number) {
  const text = rawText.trim();
  const patterns = [
    /(?<year>\d{4})年\s*(?<month>\d{1,2})月\s*(?<day>\d{1,2})日(?:[（(](?<weekday>[日月火水木金土])[）)])?/,
    /令和(?<reiwa>\d{1,2})年\s*(?<month>\d{1,2})月\s*(?<day>\d{1,2})日(?:[（(](?<weekday>[日月火水木金土])[）)])?/,
    /R(?<reiwa>\d{1,2})[./](?<month>\d{1,2})[./](?<day>\d{1,2})(?:[（(](?<weekday>[日月火水木金土])[）)])?/i,
    /(?<month>\d{1,2})月\s*(?<day>\d{1,2})日(?:[（(](?<weekday>[日月火水木金土])[）)])?/,
    /(?<month>\d{1,2})\/(?<day>\d{1,2})(?:[（(](?<weekday>[日月火水木金土])[）)])?/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.groups) continue;
    const month = Number(match.groups.month);
    const day = Number(match.groups.day);
    const year = match.groups.year ? Number(match.groups.year) : match.groups.reiwa ? convertReiwaToGregorian(Number(match.groups.reiwa)) : fiscalYear;
    const date = new Date(Date.UTC(year, month - 1, day));
    const ok = validateJapaneseWeekday(date, match.groups.weekday);
    return {
      date: toDateString(year, month, day),
      weekdayText: match.groups.weekday,
      status: ok ? "ok" : "warning",
      note: ok ? undefined : "日付と曜日が一致していません。確認してください。"
    } as const;
  }
  if (/毎週[日月火水木金土]曜日/.test(text) || /第\d[日月火水木金土]曜日/.test(text)) {
    return { status: "warning", note: "繰り返し曜日を検出しました。確認時に具体的な日付を補ってください。" } as const;
  }
  return { status: "failed", note: "日付を解析できませんでした。" } as const;
}

export function parse_text_to_events_japanese(rawText: string, sourceType = "pasted_text", fiscalYear = new Date().getFullYear()): ImportCandidate[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parsed = parseJapaneseDate(line, fiscalYear);
      const classified = classifyJapaneseEvent(`${sourceType} ${line}`);
      const title = line.replace(/\d{4}年|\d{1,2}月|\d{1,2}日|[（）()日月火水木金土/.\sR令和年]/g, "").trim() || line;
      return {
        id: `candidate-${Date.now()}-${index}`,
        import_id: "local",
        date: "date" in parsed ? parsed.date : undefined,
        title,
        raw_text_jp: line,
        event_type: classified.event_type,
        calendar_type: classified.calendar_type,
        confidence: parsed.status === "ok" ? 0.86 : 0.62,
        date_parse_status: parsed.status,
        date_parse_note: parsed.note,
        need_parent_action: classified.need_parent_action
      };
    });
}
