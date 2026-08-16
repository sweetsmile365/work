$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbPath = Join-Path $repoRoot "lib\db.ts"

if (-not (Test-Path $dbPath)) {
    throw "Cannot find lib\db.ts. Put this script in the project root (work) and run it again."
}

$text = Get-Content -Raw -Encoding UTF8 $dbPath

$marker = 'const zkaiLearningTasks: ChildTask[] = ['
if ($text.Contains($marker)) {
    Write-Host "Z会 Learning tasks are already installed. No duplicate changes made."
    exit 0
}

$insertBefore = 'const defaultSchoolTimetable: SchoolTimetable = {'
if (-not $text.Contains($insertBefore)) {
    throw "Could not find defaultSchoolTimetable anchor. No file changes were made."
}

$block = @'
const zkaiLearningTasks: ChildTask[] = [
  {
    id: "zkai-learning-2026-08-16-math",
    title: "Math · Z会 AI速効 30分",
    task_type: "practice",
    due_date: "2026-08-16",
    status: "todo",
    completed_by_child: false,
    note:
      "☑ 文字式を使った説明問題\n☑ 1次方程式の計算\n☑ 1次方程式の文章題\n\n当前最值得确认的3项"
  },
  {
    id: "zkai-learning-2026-08-17-science",
    title: "Science · Z会 AI速効 20分",
    task_type: "practice",
    due_date: "2026-08-17",
    status: "todo",
    completed_by_child: false,
    note:
      "☑ 身のまわりの物質とその性質\n☑ 気体の性質\n\n植物、动物已有较多完成证据，不重刷"
  },
  {
    id: "zkai-learning-2026-08-18-english",
    title: "English · Z会 AI速効 30分",
    task_type: "practice",
    due_date: "2026-08-18",
    status: "todo",
    completed_by_child: false,
    note:
      "☑ be動詞の文\n☑ 一般動詞の文（I、You）\n☑ 一般動詞の文（3人称単数）\n\nGrammar / be動詞相关成绩有明显不稳定，重新确认"
  },
  {
    id: "zkai-learning-2026-08-19-math-check",
    title: "Math · Z会 AI速効 数学確認 20分",
    task_type: "practice",
    due_date: "2026-08-19",
    status: "todo",
    completed_by_child: false,
    note:
      "8/16の3項が基本できていれば：\n☑ 乗法と除法\n☑ 四則演算、正の数・負の数の応用\n\n现在还会不会的一次确认"
  },
  {
    id: "zkai-learning-2026-08-20-ctest",
    title: "Other · C Test 模擬①｜総合診断",
    task_type: "exam_preparation",
    due_date: "2026-08-20",
    status: "todo",
    completed_by_child: false,
    note:
      "この日はZ会 AI速効をしない。\nC Test 模擬①を実施し、8/21以降に復習する弱点を診断する。"
  },
  {
    id: "zkai-learning-2026-08-21-mock-weakness",
    title: "Other · Z会 AI速効｜Mock弱点 1～3項 20～30分",
    task_type: "practice",
    due_date: "2026-08-21",
    status: "todo",
    completed_by_child: false,
    note:
      "8/20のMock結果から、本当に弱かった1～3項だけを選んで復習する。\n全部の範囲を先に刷らない。"
  }
];

'@

$text = $text.Replace($insertBefore, $block + $insertBefore)

$initialTasksAnchor = '  tasks: ['
if (-not $text.Contains($initialTasksAnchor)) {
    throw "Could not find initial tasks anchor. No file changes were made."
}

$initialTaskBlock = @'
  tasks: [
    ...zkaiLearningTasks,
'@

$text = $text.Replace($initialTasksAnchor, $initialTaskBlock)

$mergeAnchor = '  const mergedEvents = [...missingCompanyEvents, ...missingSchoolEvents, ...missingBadmintonEvents, ...missingMomEvents'
if (-not $text.Contains($mergeAnchor)) {
    throw "Could not find mergeDefaultData area. No file changes were made."
}

$returnAnchor = '    tasks: state.tasks.map((task) => ({'
if (-not $text.Contains($returnAnchor)) {
    throw "Could not find tasks merge anchor. No file changes were made."
}

$replacement = @'
    tasks: [
      ...zkaiLearningTasks.filter(
        (defaultTask) =>
          !(state.tasks ?? []).some((task) => task.id === defaultTask.id)
      ),
      ...(state.tasks ?? [])
    ].map((task) => ({
'@

$text = $text.Replace($returnAnchor, $replacement)

Set-Content -Path $dbPath -Value $text -Encoding UTF8

Write-Host ""
Write-Host "Updated: lib\db.ts"
Write-Host "Added 6 Z会/C Test Learning tasks for 2026-08-16 through 2026-08-21."
Write-Host "Existing saved Learning tasks are preserved."
Write-Host "The new items will appear in /learning and can be checked done individually."
