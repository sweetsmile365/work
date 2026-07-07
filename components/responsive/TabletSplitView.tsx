"use client";

export function TabletSplitView({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-1 md:[@media_(orientation:landscape)]:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
      <section className="min-w-0">{left}</section>
      <section className="min-w-0">{right}</section>
    </div>
  );
}
