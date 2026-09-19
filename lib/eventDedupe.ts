import type { FamilyEvent } from "@/types/events";
import { zhText } from "./displayText";

function text(value?: string | null) {
  return zhText(value ?? "").trim().replace(/\s+/g, " ");
}

export function eventDedupeKey(event: FamilyEvent) {
  return [
    event.date,
    text(event.title),
    event.event_type,
    event.calendar_type,
    event.start_datetime ?? "",
    event.end_datetime ?? "",
    text(event.location),
    event.all_day ? "all_day" : "",
    event.visibility,
    event.is_day_off ? "day_off" : "",
    event.need_parent_action ? "parent_action" : "",
    text(event.parent_task),
    text(event.child_note),
    event.route_id ?? "",
    event.bus_timetable_id ?? "",
    event.need_transport ? "transport" : "",
    event.transport_owner ?? "",
    event.planned_departure_time ?? "",
    event.planned_arrival_time ?? "",
    event.pickup_required ? "pickup" : "",
    event.dropoff_required ? "dropoff" : "",
    event.created_by ?? "",
    event.deleted_at ?? ""
  ].join("|");
}

function scoreEvent(event: FamilyEvent) {
  let score = 0;
  if (!event.deleted_at) score += 100;
  if (event.id && !/[ÃÂ�]/.test(event.id)) score += 10;
  if (event.need_parent_action) score += 2;
  if (event.need_transport) score += 2;
  if (event.pickup_required || event.dropoff_required) score += 1;
  return score;
}

export function dedupeEvents(events: FamilyEvent[] = []) {
  const bestByKey = new Map<string, FamilyEvent>();
  const order: string[] = [];

  for (const event of events) {
    const normalized: FamilyEvent = {
      ...event,
      title: text(event.title),
      location: text(event.location),
      parent_task: text(event.parent_task) || undefined,
      child_note: text(event.child_note) || undefined
    };
    const key = eventDedupeKey(normalized);
    const current = bestByKey.get(key);

    if (!current) {
      bestByKey.set(key, normalized);
      order.push(key);
      continue;
    }

    if (scoreEvent(normalized) > scoreEvent(current)) {
      bestByKey.set(key, normalized);
    }
  }

  return order.map((key) => bestByKey.get(key)).filter(Boolean) as FamilyEvent[];
}
