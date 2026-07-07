import type { BusTimetableCandidate } from "@/types/imports";

export function parse_bus_timetable_text_japanese(rawText: string, routeId?: string): BusTimetableCandidate[] {
  const timePattern = /(?<hour>[01]?\d|2[0-3])[:：時](?<minute>[0-5]\d)/g;
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const candidates: BusTimetableCandidate[] = [];
  lines.forEach((line, index) => {
    const matches = [...line.matchAll(timePattern)];
    if (matches.length === 0) return;
    const dep = matches[0].groups!;
    const arr = matches[1]?.groups;
    const departure = `${dep.hour.padStart(2, "0")}:${dep.minute}`;
    const arrival = arr ? `${arr.hour.padStart(2, "0")}:${arr.minute}` : undefined;
    candidates.push({
      id: `bus-candidate-${Date.now()}-${index}`,
      import_id: "local",
      route_id: routeId,
      line_name: line.includes("スクール") ? "スクールバス" : "公共バス",
      direction_name: line.includes("茗溪") ? "茗溪学園方面" : "方向を手動確認",
      from_label: line.includes("つくば") ? "TXつくば駅" : "未確認",
      to_label: line.includes("茗溪") ? "茗溪学園" : "未確認",
      service_day_type: line.includes("土") ? "saturday" : line.includes("休日") ? "sunday_holiday" : "weekday",
      departure_time: departure,
      arrival_time: arrival,
      estimated_minutes: arrival ? undefined : 25,
      confidence: matches.length > 1 ? 0.84 : 0.7,
      raw_text_jp: line
    });
  });
  return candidates;
}
