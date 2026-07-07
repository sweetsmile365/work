"use client";

import { BottomNav } from "./BottomNav";
import type { FamilyUser } from "@/lib/db";

export function MobileLayout({ title, user, children }: { title: string; user?: FamilyUser | null; children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-[calc(84px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="text-xs font-medium text-slate-500">Family Schedule Hub</div>
        <h1 className="text-xl font-bold tracking-tight text-slate-950">{title}</h1>
      </header>
      <main className="space-y-4 px-4 py-4 text-base">{children}</main>
      <BottomNav role={user?.role} />
    </div>
  );
}
