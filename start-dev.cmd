@echo off
setlocal
echo Starting Family Schedule Hub...
cd /d C:\Users\truma\Documents\home
echo Current directory: %CD%

if not exist "C:\Program Files\nodejs\node.exe" (
  echo ERROR: Node.js was not found at C:\Program Files\nodejs\node.exe
  pause
  exit /b 1
)

if not exist "node_modules\next\dist\bin\next" (
  echo ERROR: Next.js dependencies are missing.
  echo Run this once:
  echo "C:\Program Files\nodejs\npm.cmd" install
  pause
  exit /b 1
)

"C:\Program Files\nodejs\node.exe" --version
echo Opening http://localhost:3000 ...
echo iPhone/iPad QR URL: http://192.168.1.17:3000/dashboard
"C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" dev -H 0.0.0.0

echo.
echo Dev server stopped.
pause
