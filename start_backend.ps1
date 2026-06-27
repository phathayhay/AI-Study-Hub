$envFile = "d:\_SUMMER2026_FPT\SWP391\ai-studyhub\.env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from $envFile..." -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $key = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value)
            Set-Item "env:$key" $value
        }
    }
} else {
    Write-Host "Warning: .env file not found!" -ForegroundColor Yellow
}

$env:SPRING_PROFILES_ACTIVE = "dev"
Set-Location "d:\_SUMMER2026_FPT\SWP391\ai-studyhub\ai-studyhub-backend"
$mvnCmd = "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.1\plugins\maven\lib\maven3\bin\mvn.cmd"
Write-Host "Running Maven: $mvnCmd spring-boot:run" -ForegroundColor Green
& $mvnCmd spring-boot:run
