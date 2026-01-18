# How to Re-encode Videos for Web Playback

The error "FFmpegDemuxer: no supported streams" means your videos are encoded with a codec that browsers don't support well. You need to re-encode them in a web-compatible format.

## Required Format
- **Video Codec**: H.264 (AVC)
- **Audio Codec**: AAC
- **Container**: MP4
- **Fast Start**: Enabled (for web streaming)

## Method 1: Using FFmpeg (Recommended)

### Install FFmpeg
1. Download from: https://ffmpeg.org/download.html
2. Or use Chocolatey: `choco install ffmpeg`
3. Or use winget: `winget install ffmpeg`

### Re-encode Your Videos

Open PowerShell in the project directory and run:

```powershell
# Navigate to your videos folder
cd "C:\Users\User\Desktop\diverse dynamics\new\public\videos\projects\3d"

# Re-encode Redbull video
ffmpeg -i "0001-0240 - Copy.mp4" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -movflags +faststart "0001-0240-web.mp4"

# Re-encode Ring video
ffmpeg -i "0001-0201.mp4" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -movflags +faststart "0001-0201-web.mp4"
```

### What the parameters mean:
- `-c:v libx264`: Use H.264 video codec
- `-preset medium`: Encoding speed (faster = larger file, slower = smaller file)
- `-crf 23`: Quality (18-28, lower = better quality but larger file)
- `-c:a aac`: Use AAC audio codec
- `-b:a 128k`: Audio bitrate
- `-movflags +faststart`: Enable web streaming (starts playing before fully downloaded)

### Replace the old files:
After encoding, replace the old files:
```powershell
# Backup old files (optional)
Move-Item "0001-0240 - Copy.mp4" "0001-0240 - Copy.mp4.backup"
Move-Item "0001-0201.mp4" "0001-0201.mp4.backup"

# Rename new files
Move-Item "0001-0240-web.mp4" "0001-0240 - Copy.mp4"
Move-Item "0001-0201-web.mp4" "0001-0201.mp4"
```

## Method 2: Using HandBrake (GUI - Easier)

1. Download HandBrake: https://handbrake.fr/
2. Install and open HandBrake
3. Click "Open Source" and select your video file
4. Use these settings:
   - **Preset**: Web > Gmail Large 3 Minutes 720p30
   - **Video Codec**: H.264 (x264)
   - **Framerate**: Same as source
   - **Quality**: RF 23 (or adjust for file size)
   - **Audio Codec**: AAC
   - **Audio Bitrate**: 128
5. Click "Start Encode"
6. Replace the original file with the new one

## Method 3: Online Converter (Easiest but slower)

1. Go to: https://cloudconvert.com/mp4-converter
2. Upload your video file
3. Set format to MP4
4. In advanced options:
   - Video codec: H.264
   - Audio codec: AAC
5. Convert and download
6. Replace the original file

## Method 4: Quick PowerShell Script (If FFmpeg is installed)

Save this as `reencode-videos.ps1` in your project root:

```powershell
# Re-encode all MP4 videos in the 3d folder
$videoPath = "public\videos\projects\3d"
$videos = Get-ChildItem -Path $videoPath -Filter "*.mp4"

foreach ($video in $videos) {
    $inputFile = $video.FullName
    $outputFile = Join-Path $video.DirectoryName "$($video.BaseName)-web.mp4"
    
    Write-Host "Re-encoding: $($video.Name)"
    ffmpeg -i "`"$inputFile`"" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -movflags +faststart "`"$outputFile`" -y
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully encoded: $($video.Name)" -ForegroundColor Green
        # Backup original
        Move-Item $inputFile "$inputFile.backup" -Force
        # Rename new file
        Move-Item $outputFile $inputFile -Force
    } else {
        Write-Host "✗ Failed to encode: $($video.Name)" -ForegroundColor Red
    }
}

Write-Host "`nDone! Original files backed up with .backup extension"
```

Run it with:
```powershell
.\reencode-videos.ps1
```

## After Re-encoding

1. Clear your browser cache
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. The videos should now play correctly!

## Troubleshooting

- **FFmpeg not found**: Make sure FFmpeg is installed and in your PATH
- **File still doesn't play**: Try a lower CRF value (like 20) for better compatibility
- **File too large**: Increase CRF value (like 26) or use a lower resolution
- **Audio issues**: Check that audio codec is AAC
