# Create a new public repository from THIS directory, without modifying other repositories.
# Requires `gh` GitHub CLI authenticated on user's machine. Never handles personal tokens.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$repoName = 'twin-blooming-oem-intelligence'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git 설치가 필요합니다.' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'GitHub CLI 설치가 필요합니다: https://cli.github.com/' }
gh auth status
if ($LASTEXITCODE -ne 0) { throw 'gh auth login 후 다시 실행하세요.' }
if (-not (Test-Path -LiteralPath '.git')) { git init -b main }
git add public netlify data tests .github package.json netlify.toml .nvmrc .gitignore .env.example README.md LICENSE local-server.mjs start-local.ps1 publish-github.ps1 deploy-netlify.ps1 publish-all.ps1
if ($LASTEXITCODE -ne 0) { throw 'git add 실패' }
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -m 'Initial TWIN BLOOMING OEM intelligence deployment' }
if ($LASTEXITCODE -ne 0) { throw 'Git commit failed. Configure git user.name and user.email if required.' }
$owner = gh api user --jq .login
if (-not $owner) { throw 'GitHub 사용자 확인 실패' }
$fullName = "$owner/$repoName"
$exists = gh repo view $fullName --json name -q .name 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "이미 존재하는 저장소이므로 자동 덮어쓰기를 중단합니다: $fullName"; exit 1 }
gh repo create $fullName --public --source . --remote origin --push
if ($LASTEXITCODE -ne 0) { throw 'GitHub 원격 저장소 업로드 실패' }
Write-Host "GitHub: https://github.com/$fullName" -ForegroundColor Green
Write-Host 'Netlify에서 Add new project -> Import from GitHub 로 연결하세요.'
