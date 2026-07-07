"use client";

import type { RoutePath } from "@/types/routes";
import { zhText } from "@/lib/displayText";

export function RouteSelector({ routes, value, onChange }: { routes: RoutePath[]; value?: string; onChange: (routeId: string) => void }) {
  return (
    <select className="focus-ring w-full rounded-md border border-black/10 bg-white px-3 py-2" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">ルートを選択しない</option>
      {routes.map((route) => <option key={route.id} value={route.id}>{zhText(route.name)}</option>)}
    </select>
  );
}
