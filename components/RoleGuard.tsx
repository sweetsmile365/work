"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadState, type AppState } from "@/lib/db";
import { canAccessRoute } from "@/lib/permissions";
import type { AppRoute } from "@/types/permissions";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() as AppRoute;
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    if (!loaded.currentUser) router.replace("/login");
    else if (!canAccessRoute(loaded.currentUser.role, pathname)) router.replace("/dashboard");
  }, [pathname, router]);

  if (!state?.currentUser) return <main className="p-6">読み込み中...</main>;
  if (!canAccessRoute(state.currentUser.role, pathname)) return <main className="p-6">権限を確認中...</main>;
  return <>{children}</>;
}
