import type { FamilyEvent } from "@/types/events";
import type { RoutePath } from "@/types/routes";

export type ConflictLevel = "high" | "medium" | "low" | "info";

export type Conflict = {
  id: string;
  level: ConflictLevel;
  title: string;
  detail: string;
  eventIds: string[];
};

function overlaps(a: FamilyEvent, b: FamilyEvent) {
  if (!a.start_datetime || !a.end_datetime || !b.start_datetime || !b.end_datetime) return a.date === b.date;
  return new Date(a.start_datetime) < new Date(b.end_datetime) && new Date(b.start_datetime) < new Date(a.end_datetime);
}

export function checkConflicts(events: FamilyEvent[], routes: RoutePath[] = []): Conflict[] {
  const active = events.filter((event) => !event.deleted_at);
  const conflicts: Conflict[] = [];
  active.forEach((event) => {
    if (event.calendar_type === "china_reference_holiday") {
      conflicts.push({ id: `info-${event.id}`, level: "info", title: "中国休日参考", detail: `${event.title} は参考情報のみで、強い競合判定には使いません。`, eventIds: [event.id] });
    }
    if ((event.pickup_required || event.dropoff_required || event.need_transport) && !event.transport_owner) {
      conflicts.push({ id: `transport-owner-${event.id}`, level: "high", title: "送迎未設定", detail: `${event.title} は送迎が必要ですが、担当が未設定です。`, eventIds: [event.id] });
    }
    if (event.need_transport && !event.route_id) {
      conflicts.push({ id: `route-${event.id}`, level: "medium", title: "ルート未設定", detail: `${event.title} は移動が必要ですが、ルートが選択されていません。`, eventIds: [event.id] });
    }
    if (event.route_id && !routes.some((route) => route.id === event.route_id)) {
      conflicts.push({ id: `route-missing-${event.id}`, level: "low", title: "ルート参照の確認が必要", detail: `${event.title} で使っているルートが存在しないか、無効になっています。`, eventIds: [event.id] });
    }
  });
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i];
      const b = active[j];
      if (!overlaps(a, b)) continue;
      if (a.event_type === "company_meeting" && (b.need_parent_action || b.calendar_type === "school")) {
        conflicts.push({ id: `parent-company-${a.id}-${b.id}`, level: "high", title: "会社会議と保護者対応が重複", detail: `${a.title} と ${b.title} の時間が重なっています。`, eventIds: [a.id, b.id] });
      }
      if (["piano_lesson", "english_lesson", "chinese_lesson"].includes(a.event_type) && b.event_type.startsWith("badminton")) {
        conflicts.push({ id: `lesson-bad-${a.id}-${b.id}`, level: "medium", title: "習い事と部活が重複", detail: `${a.title} と ${b.title} の時間が重なっています。`, eventIds: [a.id, b.id] });
      }
    }
  }
  return conflicts;
}
