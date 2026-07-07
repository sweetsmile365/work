$env:Path = "C:\Program Files\nodejs;" + $env:Path
$env:npm_config_cache = "C:\Users\truma\Documents\home\.npm-cache"
Set-Location "C:\Users\truma\Documents\home"
npm.cmd run dev
