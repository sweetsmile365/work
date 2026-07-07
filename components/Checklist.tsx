"use client";

import { useState } from "react";

export function Checklist({ title, items }: { title: string; items: string[] }) {
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <div className="grid gap-2">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={checked.includes(item)}
              onChange={() => setChecked((prev) => (prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]))}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
