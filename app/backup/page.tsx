"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BackupPanel } from "@/components/BackupPanel";
import { RoleGuard } from "@/components/RoleGuard";
import { loadState, type AppState } from "@/lib/db";

export default function BackupPage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  return <RoleGuard><AppShell title="バックアップ"><BackupPanel state={state} /></AppShell></RoleGuard>;
}
