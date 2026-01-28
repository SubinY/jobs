Param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl
)

$ErrorActionPreference = "Stop"
$env:DATABASE_URL = $DatabaseUrl

node "$PSScriptRoot\init-db.mjs"
