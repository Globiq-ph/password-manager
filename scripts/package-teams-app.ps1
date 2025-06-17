# Create a temporary directory for packaging
$tempDir = "teams-package-temp"
New-Item -ItemType Directory -Path $tempDir -Force

# Copy required files
Copy-Item "manifest.json" -Destination $tempDir
Copy-Item "icons\color.png" -Destination $tempDir
Copy-Item "icons\outline.png" -Destination $tempDir

# Create the zip file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFile = "teams-package-$timestamp.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force

# Clean up
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Teams app package created: $zipFile"
