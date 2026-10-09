<#
.SYNOPSIS
  Runs the whole Newman evidence procedure from fresh databases and keeps the last run's files.

.DESCRIPTION
  For each run it: stops anything on the API port, picks a NEW database name, seeds the admin,
  starts the API, waits for /api/health, runs the full Postman collection with Newman, saves the
  CLI output (UTF-8) and the HTML report to docs/newman, then stops the API.
  The files from the LAST run are the ones left in docs/newman. If any run fails, the script exits
  with code 1 and says so: do not commit the evidence files from a failed run.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\docs\newman\full-evidence-run.ps1

.EXAMPLE
  # Atlas: {0} is replaced by a fresh database name for every run
  .\docs\newman\full-evidence-run.ps1 -MongoUriTemplate "mongodb+srv://user:pass@cluster0.abcde.mongodb.net/{0}"

  Before running, make sure SSL_PFX_PATH is commented out in api/.env so the API serves plain HTTP.
#>
param(
  [string]$MongoUriTemplate = "mongodb://127.0.0.1:27017/{0}",
  [string]$AdminEmail = "admin@hustlehub.test",
  [string]$AdminPassword = "AdminPass-123",
  [int]$Port = 5000,
  [int]$Runs = 2
)

$ErrorActionPreference = "Stop"

$repo        = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$api         = Join-Path $repo "api"
$collection  = Join-Path $repo "docs/postman/HustleHub.part2.postman_collection.json"
$environment = Join-Path $repo "docs/postman/HustleHub.local.postman_environment.json"
$validator   = Join-Path $repo "docs/newman/validateCollection.js"
$cliOut      = Join-Path $repo "docs/newman/newman-cli-final.txt"
$htmlOut     = Join-Path $repo "docs/newman/newman-report-final.html"
$baseUrl     = "http://localhost:$Port/api"
$stamp       = Get-Date -Format "yyyyMMddHHmmss"
$onWindows   = ($PSVersionTable.PSEdition -eq "Desktop") -or ($IsWindows -eq $true)
$tempDir     = [System.IO.Path]::GetTempPath()

function Stop-ApiOnPort([int]$p) {
  if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
	Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue |
	  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  }
}

function Test-TcpPort([string]$hostName, [int]$p) {
  try {
	$c = New-Object System.Net.Sockets.TcpClient
	$iar = $c.BeginConnect($hostName, $p, $null, $null)
	$ok = $iar.AsyncWaitHandle.WaitOne(2000)
	if ($ok) { $c.EndConnect($iar) }
	$c.Close()
	return $ok
  } catch { return $false }
}

# ---------- preflight ----------
Write-Host "Preflight checks" -ForegroundColor Cyan
foreach ($tool in @("node", "npm")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "$tool was not found on PATH." }
}
if (-not (Test-Path $collection)) { throw "Collection not found: $collection" }
if ($MongoUriTemplate -match "^mongodb://(127\.0\.0\.1|localhost):(\d+)") {
  $mongoPort = [int]$Matches[2]
  if (-not (Test-TcpPort "127.0.0.1" $mongoPort)) {
	throw "MongoDB is not reachable on 127.0.0.1:$mongoPort. Install MongoDB Community Server as a service (or pass -MongoUriTemplate for Atlas) and try again."
  }
  Write-Host "  MongoDB is reachable on 127.0.0.1:$mongoPort"
}

if (-not (Test-Path (Join-Path $api "node_modules"))) {
  Write-Host "  Installing API dependencies"
  Push-Location $api; npm install --no-audit --no-fund; Pop-Location
}
if (-not (Test-Path (Join-Path $repo "node_modules/newman")) -or -not (Test-Path (Join-Path $repo "node_modules/newman-reporter-htmlextra"))) {
  Write-Host "  Installing newman and the HTML reporter (not saved to package.json)"
  Push-Location $repo; npm install --no-save --no-audit --no-fund newman newman-reporter-htmlextra; Pop-Location
}
if (Test-Path $validator) {
  node $validator $collection
  if ($LASTEXITCODE -ne 0) { throw "The collection has a script syntax error." }
}

# ---------- runs ----------
$results = @()

for ($i = 1; $i -le $Runs; $i++) {
  $db = "hustlehub_final_${stamp}_$i"
  Write-Host ""
  Write-Host "=== Run $i of $Runs, fresh database: $db ===" -ForegroundColor Cyan
  Stop-ApiOnPort $Port
  $proc = $null

  $env:MONGO_URI      = ($MongoUriTemplate -f $db)
  $env:PORT           = "$Port"
  $env:ADMIN_EMAIL    = $AdminEmail
  $env:ADMIN_PASSWORD = $AdminPassword
  $env:ADMIN_FULL_NAME = "Test Admin"

  try {
	Push-Location $api
	npm run seed:admin
	if ($LASTEXITCODE -ne 0) { throw "npm run seed:admin failed." }
	Pop-Location

	$logOut = Join-Path $tempDir "hustlehub-api-$i.out.log"
	$logErr = Join-Path $tempDir "hustlehub-api-$i.err.log"
	$startArgs = @{
	  FilePath = "node"; ArgumentList = "server.js"; WorkingDirectory = $api; PassThru = $true
	  RedirectStandardOutput = $logOut; RedirectStandardError = $logErr
	}
	if ($onWindows) { $startArgs["WindowStyle"] = "Hidden" }
	$proc = Start-Process @startArgs

	$healthy = $false
	$deadline = (Get-Date).AddSeconds(45)
	while ((Get-Date) -lt $deadline) {
	  try {
		$r = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 2
		if ($r.data.status -eq "ok") { $healthy = $true; break }
	  } catch { }
	  Start-Sleep -Milliseconds 700
	}
	if (-not $healthy) {
	  Write-Host "API output:" -ForegroundColor Yellow
	  Get-Content $logOut, $logErr -ErrorAction SilentlyContinue | Write-Host
	  throw "The API did not answer on $baseUrl/health. If it printed 'listening at https', comment out SSL_PFX_PATH in api/.env and try again."
	}
	Write-Host "  API healthy at $baseUrl"

	Push-Location $repo
	$newmanArgs = @(
	  "newman", "run", $collection,
	  "-e", $environment,
	  "--env-var", "baseUrl=$baseUrl",
	  "--env-var", "adminEmail=$AdminEmail",
	  "--env-var", "adminPassword=$AdminPassword",
	  "--insecure", "--color", "off",
	  "--reporters", "cli,htmlextra",
	  "--reporter-htmlextra-export", $htmlOut,
	  "--reporter-htmlextra-title", "HustleHub+ Part 2 final run $i of $Runs"
	)
	# Windows PowerShell 5.1 turns any native stderr line into a terminating error when the
	# preference is Stop, so relax it just for this call and judge the run by the exit code.
	$previousPreference = $ErrorActionPreference
	$ErrorActionPreference = "Continue"
	$lines = & npx @newmanArgs 2>&1 | ForEach-Object { "$_" }
	$code = $LASTEXITCODE
	$ErrorActionPreference = $previousPreference
	Pop-Location

	$lines | ForEach-Object { Write-Host $_ }
	[System.IO.File]::WriteAllLines($cliOut, [string[]]$lines, (New-Object System.Text.UTF8Encoding($false)))
	$results += [pscustomobject]@{ Run = $i; Database = $db; NewmanExitCode = $code }
  }
  catch {
	Write-Host "Run $i failed: $($_.Exception.Message)" -ForegroundColor Red
	$results += [pscustomobject]@{ Run = $i; Database = $db; NewmanExitCode = -1 }
  }
  finally {
	Set-Location $repo
	if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
	Stop-ApiOnPort $Port
  }
}

# ---------- summary ----------
Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize | Out-String | Write-Host
$bad = @($results | Where-Object { $_.NewmanExitCode -ne 0 })

if ($bad.Count -gt 0) {
  Write-Host "At least one run did not finish clean. Do NOT commit the files in docs/newman as final evidence." -ForegroundColor Red
  Write-Host "Read the output above, fix the cause (or report the app bug), and run the script again."
  exit 1
}

Write-Host "All $Runs runs finished with Newman exit code 0 (no failed requests or assertions)." -ForegroundColor Green
Write-Host "Evidence left from the last run:"
Get-Item $cliOut, $htmlOut | ForEach-Object { Write-Host ("  {0}  ({1:N0} bytes)" -f $_.FullName, $_.Length) }
Write-Host "Open the HTML report in a browser to confirm it shows real results, then commit both files."
exit 0
