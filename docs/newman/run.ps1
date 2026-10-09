param(
  [string]$collection = "docs/postman/HustleHub.part2.postman_collection.json",
  [string]$environment = "docs/postman/HustleHub.local.postman_environment.json",
  [string]$baseUrl = "http://localhost:5000/api",
  [string]$adminEmail = "",
  [string]$adminPassword = "",
  [switch]$StartApi  # if present, the script will attempt to seed and start the API before running
)

function Ensure-NodeScriptValid([string]$file, [string]$collectionPath){
  Write-Host "Validating collection scripts..."
  node "$(Join-Path $PSScriptRoot $file)" $collectionPath
  if($LASTEXITCODE -ne 0){ Write-Error 'Validation failed'; exit 1 }
}

function Ensure-NewmanInstalled(){
  # install reporters locally if missing
  $missing = $false
  try{ npx -y newman -v > $null 2>&1 } catch { $missing = $true }
  if($missing){
	Write-Host 'Installing newman and htmlextra reporter locally (no-save)...'
	npm install --no-save newman newman-reporter-htmlextra
	if($LASTEXITCODE -ne 0){ Write-Error 'Failed to install newman or reporter'; exit 1 }
  }
}

function Run-Newman([string]$collectionPath, [string]$envPath, [string]$baseUrl, [string]$adminEmail, [string]$adminPassword){
	$cliOut = Join-Path $PSScriptRoot 'newman-cli-final.txt'
  $htmlOut = Join-Path $PSScriptRoot 'newman-report-final.html'

  $npArgs = @('newman', 'run', $collectionPath, '-e', $envPath, '--env-var', "baseUrl=$baseUrl", '--env-var', "adminEmail=$adminEmail", '--env-var', "adminPassword=$adminPassword", '--reporters', 'cli,htmlextra', '--reporter-htmlextra-export', $htmlOut, '--insecure', '--color', 'off')

  Write-Host "Running newman with: npx $($npArgs -join ' ')"
  # Capture output, show it, and write UTF8 file
  $out = & npx @npArgs 2>&1
  if($out){ $out | ForEach-Object { Write-Host $_ } }
  $out | Out-File -FilePath $cliOut -Encoding utf8
  $exit = $LASTEXITCODE
  Write-Host "Newman exit code: $exit"
  exit $exit
}

# Main
Ensure-NodeScriptValid 'validateCollection.js' $collection
Ensure-NewmanInstalled

if($StartApi){
  Write-Host 'StartApi flag requested but run.ps1 does not implement automatic API start in this environment.\nPlease start the API per docs/testing.md and then re-run this script without -StartApi.'
}

Run-Newman $collection $environment $baseUrl $adminEmail $adminPassword
