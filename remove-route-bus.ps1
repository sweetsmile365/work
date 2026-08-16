$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$targets = @(
    "app\\routes",
    "app\\bus-timetable"
)

foreach ($target in $targets) {
    $fullPath = Join-Path $repoRoot $target
    if (Test-Path $fullPath) {
        Remove-Item -Recurse -Force $fullPath
        Write-Host "Deleted: $target"
    } else {
        Write-Host "Already absent: $target"
    }
}

Write-Host ""
Write-Host "Route and Bus pages removed."
Write-Host "GitHub Desktop should now show the deletions."
