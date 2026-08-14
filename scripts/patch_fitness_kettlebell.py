from pathlib import Path

path = Path("app/fitness/page.tsx")
if not path.exists():
    raise SystemExit("Run this from the repository root.")

text = path.read_text(encoding="utf-8")
original = text

import_anchor = 'import { ensureDailyTasks, localDateKey } from "@/lib/dailyTasks";\n'
imports = (
    'import { DadKettlebellWeeklyPlan } from "@/components/DadKettlebellWeeklyPlan";\n'
    'import { DadKettlebellFollowAlong } from "@/components/DadKettlebellFollowAlong";\n'
)

if 'DadKettlebellWeeklyPlan' not in text:
    if import_anchor not in text:
        raise SystemExit("Import anchor not found.")
    text = text.replace(import_anchor, import_anchor + imports, 1)

anchor = '        <FitnessMusic person={person} />\n'
if '<DadKettlebellWeeklyPlan />' not in text:
    if anchor not in text:
        raise SystemExit("FitnessMusic anchor not found.")
    block = (
        '        {person === "dad" ? (\n'
        '          <>\n'
        '            <DadKettlebellWeeklyPlan />\n'
        '            <DadKettlebellFollowAlong />\n'
        '          </>\n'
        '        ) : null}\n\n'
    )
    text = text.replace(anchor, block + anchor, 1)

if text == original:
    raise SystemExit("No changes needed.")

path.write_text(text, encoding="utf-8")
print("Patched app/fitness/page.tsx")
