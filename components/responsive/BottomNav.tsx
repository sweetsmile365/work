"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Inbox, ListTodo, User, School } from "lucide-react";
import type { UserRole } from "@/types/permissions";

const parentItems = [
  { href: "/dashboard", label: "今日", icon: Home },
  { href: "/calendar", label: "日历", icon: CalendarDays },
  { href: "/child-schedule", label: "孩子", icon: School },
  { href: "/import-inbox", label: "导入", icon: Inbox },
  { href: "/account", label: "我的", icon: User }
];

const childItems = [
  { href: "/dashboard", label: "今日", icon: Home },
  { href: "/add-event", label: "我的予定", icon: CalendarDays },
  { href: "/child-schedule", label: "任务", icon: ListTodo },
  { href: "/calendar", label: "日历", icon: CalendarDays },
  { href: "/account", label: "我的", icon: User }
];

export function BottomNav({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const items = role === "child_editor" ? childItems : parentItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-xs font-medium ${active ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}>
              <item.icon size={20} />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
