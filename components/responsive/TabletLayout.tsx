"use client";

export function TabletLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="text-sm font-medium text-slate-500">Family Schedule Hub</div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </header>
      <main className="p-5">{children}</main>
    </div>
  );
}
