param(
  [string]$collection = "docs/postman/HustleHub.part2.postman_collection.json",
  [string]$environment = "docs/postman/HustleHub.local.postman_environment.json",
  [string]$baseUrl = "https://localhost:5000/api",
  [string]$adminEmail = "",
  [string]$adminPassword = ""
)

Write-Host "Validating collection scripts..."
node "$(Join-Path $PSScriptRoot 'validateCollection.js')" $collection
if($LASTEXITCODE -ne 0){ Write-Error 'Validation failed'; exit 1 }

Write-Host "Running Newman..."
npx newman run $collection -e $environment --env-var baseUrl=$baseUrl --env-var adminEmail=$adminEmail --env-var adminPassword=$adminPassword --reporters cli,htmlextra --insecure --color off
