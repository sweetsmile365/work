import type { FamilyEvent } from "@/types/events";
import type { AppRoute, UserRole } from "@/types/permissions";
import type { RoutePath } from "@/types/routes";

const routeRoles: Record<AppRoute, UserRole[]> = {
  "/dashboard": ["admin", "parent", "child_editor"],
  "/calendar": ["admin", "parent", "child_editor"],
  "/add-event": ["admin", "parent", "child_editor"],
  "/child-schedule": ["admin", "parent", "child_editor"],
  "/account": ["admin", "parent", "child_editor"],
  "/settings": ["admin"],
  "/settings/account": ["admin"],
  "/backup": ["admin"],
  "/company": ["admin", "parent"],
  "/import-inbox": ["admin", "parent"],
  "/holidays": ["admin", "parent"],
  "/routes": ["admin", "parent", "child_editor"],
  "/bus-timetable": ["admin", "parent", "child_editor"],
  "/conflicts": ["admin", "parent"],
  "/school": ["admin", "parent", "child_editor"],
  "/recycle-bin": ["admin", "parent"]
};

const childReadOnlyTypes = new Set([
  "piano_lesson",
  "english_lesson",
  "chinese_lesson",
  "badminton_practice",
  "badminton_match",
  "badminton_tournament",
  "badminton_support",
  "school_event",
  "school_holiday",
  "exam",
  "deadline"
]);

const childBlockedFields = new Set([
  "date",
  "start_datetime",
  "end_datetime",
  "title",
  "location",
  "teacher_name",
  "fee_note",
  "recurrence",
  "makeup_lesson",
  "cancellation",
  "transport_owner"
]);

export function canAccessRoute(userRole: UserRole, path: AppRoute) {
  return routeRoles[path]?.includes(userRole) ?? false;
}

export function canEditEvent(userRole: UserRole, event: FamilyEvent, fieldName = "title") {
  if (userRole === "admin") return true;
  if (userRole === "parent") {
    return !["japan_public_holiday", "china_public_holiday_reference", "china_adjusted_workday_reference"].includes(event.event_type);
  }
  if (event.event_type === "personal_event") return true;
  if (fieldName === "child_note") return true;
  if (childReadOnlyTypes.has(event.event_type)) return !childBlockedFields.has(fieldName);
  return false;
}

export function canViewRoute(userRole: UserRole, _routePath?: RoutePath) {
  return ["admin", "parent", "child_editor"].includes(userRole);
}

export function canAccessBackup(userRole: UserRole) {
  return userRole === "admin";
}

export function canConfirmImportCandidate(userRole: UserRole) {
  return userRole === "admin" || userRole === "parent";
}

export function canRunOcr(userRole: UserRole) {
  return userRole === "admin" || userRole === "parent";
}

export function canManageRoutes(userRole: UserRole) {
  return userRole === "admin" || userRole === "parent";
}

export function canManageBusTimetable(userRole: UserRole) {
  return userRole === "admin" || userRole === "parent";
}
