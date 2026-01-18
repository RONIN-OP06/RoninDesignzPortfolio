# Re-encode all MP4 videos in the 3d folder to web-compatible format
# Requires FFmpeg to be installed at C:\ffmpegEncode

$videoPath = "public\videos\projects\3d"

# Find FFmpeg executable
$ffmpegPath = "C:\ffmpegEncode\bin\ffmpeg.exe"
if (-not (Test-Path $ffmpegPath)) {
    # Try to find it in the directory
    $ffmpegExe = Get-ChildItem "C:\ffmpegEncode" -Recurse -Filter "ffmpeg.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($ffmpegExe) {
        $ffmpegPath = $ffmpegExe.FullName
        Write-Host "Found FFmpeg at: $ffmpegPath" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: FFmpeg not found at C:\ffmpegEncode\bin\ffmpeg.exe" -ForegroundColor Red
        Write-Host "Please check your FFmpeg installation location" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Using FFmpeg: $ffmpegPath" -ForegroundColor Cyan
Write-Host ""

# Check if video directory exists
if (-not (Test-Path $videoPath)) {
    Write-Host "ERROR: Video directory not found: $videoPath" -ForegroundColor Red
    exit 1
}

# Get all MP4 files
$videos = Get-ChildItem -Path $videoPath -Filter "*.mp4" | Where-Object { $_.Name -notlike "*-web.mp4" -and $_.Name -notlike "*.backup" }

if ($videos.Count -eq 0) {
    Write-Host "No MP4 videos found in $videoPath" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($videos.Count) video(s) to re-encode" -ForegroundColor Cyan
Write-Host ""

foreach ($video in $videos) {
    $inputFile = $video.FullName
    $outputFile = Join-Path $video.DirectoryName "$($video.BaseName)-web.mp4"
    
    Write-Host "Re-encoding: $($video.Name)" -ForegroundColor White
    Write-Host "  Input:  $inputFile"
    Write-Host "  Output: $outputFile"
    
    # Re-encode with H.264/AAC
    $ffmpegArgs = @(
        "-i", "`"$inputFile`"",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "`"$outputFile`"",
        "-y"
    )
    
    & $ffmpegPath $ffmpegArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Successfully encoded!" -ForegroundColor Green
        
        # Backup original
        $backupFile = "$inputFile.backup"
        if (Test-Path $backupFile) {
            Remove-Item $backupFile -Force
        }
        Move-Item $inputFile $backupFile -Force
        Write-Host "  Original backed up to: $backupFile" -ForegroundColor Gray
        
        # Rename new file to original name
        Move-Item $outputFile $inputFile -Force
        Write-Host "  New file saved as: $inputFile" -ForegroundColor Gray
    } else {
        Write-Host "  Failed to encode (Error code: $LASTEXITCODE)" -ForegroundColor Red
        if (Test-Path $outputFile) {
            Remove-Item $outputFile -Force
        }
    }
    
    Write-Host ""
}

Write-Host "Done! Original files backed up with .backup extension" -ForegroundColor Green
Write-Host "Clear your browser cache and refresh the page to see the new videos." -ForegroundColor Yellow
