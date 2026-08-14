from pathlib import Path

path = Path("app/fitness/page.tsx")
if not path.exists():
    raise SystemExit("app/fitness/page.tsx not found. Run from repository root.")

text = path.read_text(encoding="utf-8")
original = text

import_anchor = 'import { ensureDailyTasks, localDateKey } from "@/lib/dailyTasks";\n'
import_line = 'import { DadKettlebellFollowAlong } from "@/components/DadKettlebellFollowAlong";\n'

if "DadKettlebellFollowAlong" not in text:
    if import_anchor not in text:
        raise SystemExit("dailyTasks import anchor not found.")
    text = text.replace(import_anchor, import_anchor + import_line, 1)

anchor = '        <FitnessMusic person={person} />\n'

if "<DadKettlebellFollowAlong" not in text:
    if anchor not in text:
        raise SystemExit("FitnessMusic anchor not found.")
    block = '''        {person === "dad" ? (
          <DadKettlebellFollowAlong />
        ) : null}

'''
    text = text.replace(anchor, block + anchor, 1)

if text == original:
    raise SystemExit("No changes were needed.")

path.write_text(text, encoding="utf-8")
print("Patched:", path)
print("Added Dad VIDEO WORKOUT follow-along panel.")
