"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadState, refreshCloudStateNow, type AppState } from "@/lib/db";
import { canAccessRoute } from "@/lib/permissions";
import type { AppRoute } from "@/types/permissions";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() as AppRoute;
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const session = await fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : null).catch(() => null);
      if (!active || !session?.role) {
        router.replace("/login");
        return;
      }
      await refreshCloudStateNow();
      if (!active) return;
      const loaded = loadState();
      const currentUser = loaded.users.find((user) => user.role === session.role) ?? null;
      const next = { ...loaded, currentUser };
      setState(next);
      if (!currentUser || !canAccessRoute(currentUser.role, pathname)) router.replace("/dashboard");
    })();
    return () => { active = false; };
  }, [pathname, router]);

  if (!state?.currentUser) return <main className="p-6">読み込み中...</main>;
  if (!canAccessRoute(state.currentUser.role, pathname)) return <main className="p-6">権限を確認中...</main>;
  return <>{children}</>;
}
