"use client";

import type { BusTimetable } from "@/types/busTimetable";
import { zhText } from "@/lib/displayText";

export function BusTimetableSelector({ items, value, onChange }: { items: BusTimetable[]; value?: string; onChange: (id: string) => void }) {
  return (
    <select className="focus-ring w-full rounded-md border border-black/10 bg-white px-3 py-2" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">バス便を選択しない</option>
      {items.map((item) => <option key={item.id} value={item.id}>{item.departure_time} {zhText(item.line_name)} {zhText(item.from_label)} → {zhText(item.to_label)}</option>)}
    </select>
  );
}
