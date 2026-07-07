"use client";

import type { Conflict } from "@/lib/conflictChecker";

const levelClass = {
  high: "border-red-300 bg-red-50 text-red-800",
  medium: "border-yellow-300 bg-yellow-50 text-yellow-800",
  low: "border-blue-300 bg-blue-50 text-blue-800",
  info: "border-gray-200 bg-gray-50 text-gray-700"
};

export function ConflictCard({ conflict }: { conflict: Conflict }) {
  return (
    <article className={`rounded-md border p-3 ${levelClass[conflict.level]}`}>
      <div className="mb-1 text-xs font-semibold uppercase">{conflict.level}</div>
      <div className="font-medium">{conflict.title}</div>
      <div className="text-sm opacity-80">{conflict.detail}</div>
    </article>
  );
}
