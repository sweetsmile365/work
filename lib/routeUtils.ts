import type { RoutePath } from "@/types/routes";

export function calculateRoutePlan(startIso: string, route?: RoutePath) {
  if (!route || !startIso) return {};
  const start = new Date(startIso);
  const departure = new Date(start.getTime() - (route.estimated_minutes + route.buffer_minutes) * 60_000);
  const reminder = new Date(departure.getTime() - route.default_departure_reminder_minutes * 60_000);
  return {
    planned_departure_time: departure.toISOString(),
    planned_arrival_time: start.toISOString(),
    departure_reminder_time: reminder.toISOString()
  };
}

export function minutesBetween(fromIso?: string, toIso?: string) {
  if (!fromIso || !toIso) return 0;
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60_000);
}
