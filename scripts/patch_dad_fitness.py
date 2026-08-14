from pathlib import Path

path = Path("app/fitness/page.tsx")
if not path.exists():
    raise SystemExit("app/fitness/page.tsx not found. Run from repository root.")

text = path.read_text(encoding="utf-8")
original = text

import_line = '''import {
  DadKettlebellWeeklyPlan,
  buildDadRoutine,
  loadDadPlan,
  type DadPlanConfig
} from "@/components/DadKettlebellWeeklyPlan";
'''

anchor = 'import { ensureDailyTasks, localDateKey } from "@/lib/dailyTasks";\n'
if "DadKettlebellWeeklyPlan" not in text:
    if anchor not in text:
        raise SystemExit("dailyTasks import anchor not found")
    text = text.replace(anchor, anchor + import_line, 1)

# Keep old routine as fallback/reference but use the new weekday plan in the timer.
text = text.replace(
    "const dadRoutine: RoutineStep[] = [",
    "const legacyDadRoutine: RoutineStep[] = [",
    1
)

state_anchor = '''  const [person, setPerson] = useState<Person>("dad");
  const [momMode, setMomMode] = useState<MomMode>("recovery");
'''
if "const [dadPlan, setDadPlan]" not in text:
    if state_anchor not in text:
        raise SystemExit("person/momMode state anchor not found")
    text = text.replace(
        state_anchor,
        state_anchor + '''  const [dadPlan, setDadPlan] = useState<DadPlanConfig | null>(null);
''',
        1
    )

text = text.replace(
    "const [secondsLeft, setSecondsLeft] = useState(dadRoutine[0].duration);",
    "const [secondsLeft, setSecondsLeft] = useState(120);",
    1
)

routine_anchor = '''  const routine =
    person === "dad"
      ? dadRoutine
'''
if routine_anchor in text:
    replacement = '''  useEffect(() => {
    setDadPlan(loadDadPlan());
  }, []);

  const dadRoutine = useMemo(
    () => buildDadRoutine(new Date(), dadPlan),
    [dadPlan, today]
  );

  const routine =
    person === "dad"
      ? dadRoutine
'''
    text = text.replace(routine_anchor, replacement, 1)
elif "const dadRoutine = useMemo(" not in text:
    raise SystemExit("active routine anchor not found")

effect_anchor = '''  useEffect(() => {
    setCurrentIndex(0);
    setSecondsLeft(routine[0].duration);
    setRunning(false);
    setFinished(false);
  }, [person, momMode]);
'''
if effect_anchor in text:
    text = text.replace(
        effect_anchor,
        '''  useEffect(() => {
    setCurrentIndex(0);
    setSecondsLeft(routine[0].duration);
    setRunning(false);
    setFinished(false);
  }, [person, momMode, dadPlan]);
''',
        1
    )

insert_anchor = '''        <FitnessMusic person={person} />
'''
if "<DadKettlebellWeeklyPlan" not in text:
    if insert_anchor not in text:
        raise SystemExit("FitnessMusic anchor not found")
    text = text.replace(
        insert_anchor,
        '''        {person === "dad" ? (
          <DadKettlebellWeeklyPlan
            value={dadPlan}
            onChange={setDadPlan}
          />
        ) : null}

''' + insert_anchor,
        1
    )

if text == original:
    raise SystemExit("No changes made.")

path.write_text(text, encoding="utf-8")
print("Patched:", path)
print("Dad timer now follows the editable weekday kettlebell plan.")
