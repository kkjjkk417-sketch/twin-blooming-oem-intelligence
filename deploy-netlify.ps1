# Interactive first-time Netlify deploy. Requires browser login and Netlify account access.
# Run only after you inspect the public site and confirm API key management.
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js/npm 설치가 필요합니다.' }
Write-Host 'Installing server dependencies...' -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
Write-Host 'Netlify login. Authorize in browser if prompted.' -ForegroundColor Cyan
npx --yes netlify-cli login
if ($LASTEXITCODE -ne 0) { throw 'Netlify login failed' }
Write-Host 'Create/connect Netlify site. Select the intended GitHub repo; do not select an existing unrelated site.' -ForegroundColor Cyan
npx --yes netlify-cli init
if ($LASTEXITCODE -ne 0) { throw 'Netlify init failed or was cancelled' }
Write-Host 'Deploying to production...' -ForegroundColor Cyan
npx --yes netlify-cli deploy --prod --dir=public --functions=netlify/functions
if ($LASTEXITCODE -ne 0) { throw 'Production deploy failed' }
Write-Host 'Check the Production URL above. Add KIPRIS_PLUS_API_KEY, EPO_OPS_KEY, EPO_OPS_SECRET to Netlify project settings.' -ForegroundColor Green
