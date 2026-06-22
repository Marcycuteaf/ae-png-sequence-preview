#!/usr/bin/env bash
# 取得 Windows 版 ffmpeg.exe 到 bin/win/（打包前執行）
# macOS/Linux 可自動下載 gyan.dev essentials build；Windows 請手動放置或執行本腳本
set -e
HERE="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HERE/bin/win/ffmpeg.exe"
mkdir -p "$(dirname "$DEST")"

if [ -f "$DEST" ]; then
  echo "已存在：$DEST"
  "$DEST" -version 2>/dev/null | head -1 || true
  exit 0
fi

URL="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
TMP="$(mktemp -d)"
ZIP="$TMP/ffmpeg-win.zip"

echo "==> 下載 Windows ffmpeg essentials…"
if ! curl -fsSL "$URL" -o "$ZIP"; then
  rm -rf "$TMP"
  echo "下載失敗。請手動將 ffmpeg.exe 放到："
  echo "  $DEST"
  echo "來源：https://github.com/BtbN/FFmpeg-Builds/releases"
  exit 1
fi

echo "==> 解壓 ffmpeg.exe"
unzip -q -j "$ZIP" "*/bin/ffmpeg.exe" -d "$(dirname "$DEST")"
rm -rf "$TMP"

if [ ! -f "$DEST" ]; then
  echo "解壓失敗，請手動放置 ffmpeg.exe 到 $DEST"
  exit 1
fi

echo "OK: $DEST ($(ls -lh "$DEST" | awk '{print $5}'))"
file "$DEST"
