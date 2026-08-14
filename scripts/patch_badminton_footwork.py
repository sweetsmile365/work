from pathlib import Path

path = Path("app/badminton/page.tsx")
if not path.exists():
    raise SystemExit("app/badminton/page.tsx not found. Run from repository root.")

text = path.read_text(encoding="utf-8")
original = text

import_anchor = 'import Link from "next/link";\n'
import_line = 'import { BadmintonFootworkBlitz } from "@/components/BadmintonFootworkBlitz";\n'

if "BadmintonFootworkBlitz" not in text:
    if import_anchor not in text:
        raise SystemExit("Link import anchor not found.")
    text = text.replace(import_anchor, import_anchor + import_line, 1)

ankle_anchor = '        <section className="mt-4 rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.055] p-4 sm:p-5">'

if "<BadmintonFootworkBlitz" not in text:
    if ankle_anchor not in text:
        raise SystemExit("Ankle section anchor not found.")
    text = text.replace(
        ankle_anchor,
        '        <BadmintonFootworkBlitz />\n\n' + ankle_anchor,
        1,
    )

recommend_anchor = '''                <div className="rounded-xl bg-slate-950/25 p-3">
                  <div className="font-bold text-white">足首ケア</div>'''

if "Footwork BASIC 6" not in text and recommend_anchor in text:
    text = text.replace(
        recommend_anchor,
        '''                <div className="rounded-xl bg-indigo-300/[0.05] p-3">
                  <div className="font-bold text-white">Footwork BASIC 6</div>
                  <div className="mt-1 text-xs text-slate-300">
                    技术练习 · 4〜5分 / FULL 17 は週1〜2回
                  </div>
                </div>
''' + recommend_anchor,
        1,
    )

if text == original:
    raise SystemExit("No changes made.")

path.write_text(text, encoding="utf-8")
print("Patched:", path)
print("Added FOOTWORK between Racket Control and Ankle Guard.")
