# TWIN BLOOMING local development; uses Windows PowerShell / PowerShell 7
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
try { $ver = (node --version) } catch { Write-Host 'Node.js 20+ 설치가 필요합니다: https://nodejs.org/' -ForegroundColor Yellow; exit 1 }
Write-Host "Node $ver / TWIN BLOOMING localhost" -ForegroundColor Cyan
npm run dev
