"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Archive, AlertTriangle, BookOpen, Building2, Bus, CalendarDays, Home, Inbox, LogOut, Map, PlusCircle, School, Settings, ShieldCheck, Trash2, User } from "lucide-react";
import { logout, loadState, type FamilyUser } from "@/lib/db";
import { canAccessRoute } from "@/lib/permissions";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import { MobileLayout } from "@/components/responsive/MobileLayout";
import { TabletLayout } from "@/components/responsive/TabletLayout";
import type { AppRoute } from "@/types/permissions";

const nav = [
  ["/timetable", "時間割", BookOpen],
  ["/dashboard", "今日", Home],
  ["/calendar", "カレンダー", CalendarDays],
  ["/add-event", "手動入力", PlusCircle],
  ["/child-schedule", "子ども", School],
  ["/school", "学校", School],
  ["/company", "会社", Building2],
  ["/holidays", "休日", CalendarDays],
  ["/routes", "ルート", Map],
  ["/bus-timetable", "バス", Bus],
  ["/import-inbox", "取り込み", Inbox],
  ["/conflicts", "競合チェック", AlertTriangle],
  ["/backup", "バックアップ", Archive],
  ["/recycle-bin", "ごみ箱", Trash2],
  ["/settings", "設定", Settings],
  ["/account", "アカウント", User]
] as const;

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, isTablet } = useResponsiveLayout();
  const [user, setUser] = useState<FamilyUser | null>(null);

  useEffect(() => setUser(loadState().currentUser), []);

  if (!user) return <main className="p-6 text-base">読み込み中...</main>;
  if (isMobile) return <MobileLayout title={title} user={user}>{children}</MobileLayout>;
  if (isTablet) return <TabletLayout title={title}>{children}</TabletLayout>;

  const items = nav.filter(([path]) => canAccessRoute(user.role, path as AppRoute));
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 z-20 h-screen w-64 shrink-0 border-r border-black/10 bg-paper/95 px-3 py-3 backdrop-blur">
        <div className="mb-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <ShieldCheck size={22} />
            <span>Family Schedule Hub</span>
          </Link>
        </div>
        <div className="mb-3 rounded-md bg-white p-3 shadow-soft">
          <div className="text-sm text-black/60">現在のユーザー</div>
          <div className="font-medium">{user.display_name}</div>
          <div className="text-xs text-black/55">{user.role}</div>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map(([path, label, Icon]) => (
            <Link key={path} href={path} className={`focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm ${pathname === path ? "bg-ink text-white" : "hover:bg-black/5"}`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <button
          className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm hover:bg-black/5"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </aside>
      <main className="w-full px-8 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-black/55">家族専用の予定管理 PWA</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
