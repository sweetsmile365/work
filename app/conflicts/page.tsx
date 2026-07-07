"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ConflictCard } from "@/components/ConflictCard";
import { RoleGuard } from "@/components/RoleGuard";
import { checkConflicts } from "@/lib/conflictChecker";
import { loadState, type AppState } from "@/lib/db";

export default function ConflictsPage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  const conflicts = checkConflicts(state.events, state.routes);
  return <RoleGuard><AppShell title="競合チェック"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{conflicts.map((conflict) => <ConflictCard key={conflict.id} conflict={conflict} />)}</div></AppShell></RoleGuard>;
}
