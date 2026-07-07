import { toCsv } from "./csv";
import type { FamilyEvent } from "@/types/events";
import type { ImportCandidate } from "@/types/imports";
import type { BusTimetable } from "@/types/busTimetable";
import type { RoutePath } from "@/types/routes";
import type { ChildTask } from "@/types/activities";

export function createBackupManifest(family_group_id = "local-family", exported_tables: string[] = []) {
  const manifest = {
    backup_version: "1.0",
    created_at: new Date().toISOString(),
    family_group_id,
    app_version: "0.1.0",
    exported_tables,
    file_count: exported_tables.length + 2,
    checksum: `local-${exported_tables.join("-").length}`
  };
  return manifest;
}

export const exportEventsCsv = (events: FamilyEvent[]) => toCsv(events);
export const exportHolidaysCsv = (events: FamilyEvent[]) => toCsv(events.filter((event) => event.calendar_type.includes("holiday")));
export const exportChildTasksCsv = (tasks: ChildTask[]) => toCsv(tasks);
export const exportImportCandidatesCsv = (items: ImportCandidate[]) => toCsv(items);
export const exportBusTimetablesCsv = (items: BusTimetable[]) => toCsv(items);
export const exportRoutesCsv = (items: RoutePath[]) => toCsv(items);

export function exportDatabaseJson(data: unknown) {
  return JSON.stringify(data, null, 2);
}

export function createFullBackupZip(data: Record<string, unknown>) {
  const manifest = createBackupManifest("local-family", Object.keys(data));
  return new Blob([JSON.stringify({ manifest, files: data }, null, 2)], { type: "application/json" });
}
