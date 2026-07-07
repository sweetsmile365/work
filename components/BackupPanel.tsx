"use client";

import { createBackupManifest, exportBusTimetablesCsv, exportChildTasksCsv, exportDatabaseJson, exportEventsCsv, exportImportCandidatesCsv, exportRoutesCsv } from "@/lib/backup";
import type { AppState } from "@/lib/db";

function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function BackupPanel({ state }: { state: AppState }) {
  const files = [
    ["events.csv", () => exportEventsCsv(state.events)],
    ["child_tasks.csv", () => exportChildTasksCsv(state.tasks)],
    ["import_candidates.csv", () => exportImportCandidatesCsv(state.importCandidates)],
    ["bus_timetables.csv", () => exportBusTimetablesCsv(state.busTimetables)],
    ["routes.csv", () => exportRoutesCsv(state.routes)],
    ["database_export.json", () => exportDatabaseJson(state)],
    ["manifest.json", () => JSON.stringify(createBackupManifest("local-family", ["events", "child_tasks", "import_candidates", "bus_timetables", "routes"]), null, 2)]
  ] as const;
  return (
    <section className="rounded-md bg-white p-4 shadow-soft">
      <h2 className="mb-3 font-semibold">バックアップ出力</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {files.map(([name, getContent]) => (
          <button key={name} className="focus-ring rounded-md border border-black/10 px-3 py-2 text-left hover:bg-black/5" onClick={() => download(name, getContent())}>{name}</button>
        ))}
      </div>
    </section>
  );
}
