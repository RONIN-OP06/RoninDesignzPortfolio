# Installing FFmpeg for Windows

According to the [official FFmpeg download page](https://ffmpeg.org/download.html), FFmpeg only provides source code. For Windows, you need to download pre-built executables from third-party providers.

## Recommended: gyan.dev Builds

### Step 1: Download FFmpeg

1. Go to: **https://www.gyan.dev/ffmpeg/builds/**
2. Click on **"ffmpeg-release-essentials.zip"** (or the latest release essentials build)
3. This is a complete, ready-to-use build

### Step 2: Extract and Install

1. Extract the ZIP file to a location like `C:\ffmpeg`
2. You should see a `bin` folder inside with `ffmpeg.exe`, `ffprobe.exe`, and `ffplay.exe`

### Step 3: Add to PATH

**Option A: Using System Environment Variables (Recommended)**
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find and select "Path", then click "Edit"
5. Click "New" and add: `C:\ffmpeg\bin` (or wherever you extracted it)
6. Click "OK" on all dialogs
7. **Restart your terminal/PowerShell**

**Option B: Using PowerShell (Temporary for current session)**
```powershell
$env:Path += ";C:\ffmpeg\bin"
```

### Step 4: Verify Installation

Open a **new** PowerShell window and run:
```powershell
ffmpeg -version
```

You should see FFmpeg version information. If you get an error, FFmpeg is not in your PATH.

## Alternative: BtbN Builds

If gyan.dev doesn't work, try:
1. Go to: **https://github.com/BtbN/FFmpeg-Builds/releases**
2. Download the latest `ffmpeg-master-latest-win64-gpl.zip`
3. Extract and add to PATH as above

## After Installation

Once FFmpeg is installed and in your PATH, you can run the re-encoding script:

```powershell
.\reencode-videos.ps1
```

Or manually re-encode videos using the commands in `REENCODE_VIDEOS.md`.
