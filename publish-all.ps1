# Run from a newly extracted, dedicated project folder. Interactive account authorization required.
# Never overwrites an existing GitHub repository. Does not embed or print API keys.
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
& "$PSScriptRoot\publish-github.ps1"
if (-not $?) { throw 'GitHub publish stopped. Netlify deployment not started.' }
& "$PSScriptRoot\deploy-netlify.ps1"
