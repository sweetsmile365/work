$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbPath = Join-Path $repoRoot "lib\db.ts"

if (-not (Test-Path $dbPath)) {
    throw "Cannot find lib\db.ts. Put this script in the project root (work) and run it again."
}

$text = Get-Content -Raw -Encoding UTF8 $dbPath

$marker = 'function createZkaiReviewCalendarEvents(): FamilyEvent[]'

if ($text.Contains($marker)) {
    Write-Host "Z会 review calendar events are already installed. No duplicate changes made."
    exit 0
}

$insertBefore = 'const users: FamilyUser[] = ['
if (-not $text.Contains($insertBefore)) {
    throw "Could not find users anchor. No file changes were made."
}

$zkaiBlock = @'
const zkaiReviewEvents: Array<{
  date: string;
  title: string;
  child_note: string;
}> = [
  {
    date: "2026-08-16",
    title: "Z会 AI速効｜数学 30分",
    child_note:
      "☑ 文字式を使った説明問題\n☑ 1次方程式の計算\n☑ 1次方程式の文章題\n\n目的：当前最值得确认的3项"
  },
  {
    date: "2026-08-17",
    title: "Z会 AI速効｜理科 20分",
    child_note:
      "☑ 身のまわりの物質とその性質\n☑ 気体の性質\n\n目的：植物、动物已有较多完成证据，不重刷"
  },
  {
    date: "2026-08-18",
    title: "Z会 AI速効｜英語 30分",
    child_note:
      "☑ be動詞の文\n☑ 一般動詞の文（I、You）\n☑ 一般動詞の文（3人称単数）\n\n目的：过去 Grammar / be动词相关成绩有明显不稳定，值得重新确认"
  },
  {
    date: "2026-08-19",
    title: "Z会 AI速効｜数学確認 20分",
    child_note:
      "8/16の3項が基本できていれば：\n☑ 乗法と除法\n☑ 四則演算、正の数・負の数の応用\n\n目的：现在还会不会的一次确认"
  },
  {
    date: "2026-08-20",
    title: "C Test 模擬①｜総合診断",
    child_note:
      "Z会 AI速効はしない。\nC Test 模擬①を実施し、8/21以降に復習する弱点を決める。"
  },
  {
    date: "2026-08-21",
    title: "Z会 AI速効｜Mock弱点 1～3項 20～30分",
    child_note:
      "8/20のMock結果から、本当に弱かった1～3項だけを選択して復習する。\n全部の範囲を先に刷らない。"
  }
];

function createZkaiReviewCalendarEvents(): FamilyEvent[] {
  return zkaiReviewEvents.map((event) => ({
    id: `zkai-ai-review-${event.date}`,
    title: event.title,
    event_type: "other",
    calendar_type: "child_activity",
    date: event.date,
    all_day: true,
    visibility: "family",
    need_parent_action: false,
    child_note: event.child_note,
    created_by: "study-plan-2026-08"
  }));
}

'@

$text = $text.Replace($insertBefore, $zkaiBlock + $insertBefore)

$initialAnchor = '    ...createMomHandwrittenCalendarEvents(),'
if (-not $text.Contains($initialAnchor)) {
    throw "Could not find initialState event anchor. No file changes were made."
}
$text = $text.Replace(
    $initialAnchor,
    $initialAnchor + "`r`n" + '    ...createZkaiReviewCalendarEvents(),'
)

$mergeAnchor = '  const missingMomEvents = createMomHandwrittenCalendarEvents().filter(isMissingEvent);'
if (-not $text.Contains($mergeAnchor)) {
    throw "Could not find mergeDefaultData anchor. No file changes were made."
}
$text = $text.Replace(
    $mergeAnchor,
    $mergeAnchor + "`r`n" + '  const missingZkaiReviewEvents = createZkaiReviewCalendarEvents().filter(isMissingEvent);'
)

$mergedEventsAnchor = '  const mergedEvents = [...missingCompanyEvents, ...missingSchoolEvents, ...missingBadmintonEvents, ...missingMomEvents, ...state.events]'
if (-not $text.Contains($mergedEventsAnchor)) {
    throw "Could not find mergedEvents anchor. No file changes were made."
}
$text = $text.Replace(
    $mergedEventsAnchor,
    '  const mergedEvents = [...missingCompanyEvents, ...missingSchoolEvents, ...missingBadmintonEvents, ...missingMomEvents, ...missingZkaiReviewEvents, ...state.events]'
)

Set-Content -Path $dbPath -Value $text -Encoding UTF8

Write-Host ""
Write-Host "Updated: lib\db.ts"
Write-Host "Added Z会 / C Test review events for 2026-08-16 through 2026-08-21."
Write-Host "No exact clock times were added because the plan only specified durations."
Write-Host "Existing local/cloud state will receive the events through mergeDefaultData."
