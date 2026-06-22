#!/usr/bin/env bash
# 複製 ffmpeg 到擴充功能 bin/macos/（打包前執行）
#
# 發佈給其他使用者時，建議改用「靜態連結」版 ffmpeg（單一檔案、無 Homebrew 依賴）：
#   https://evermeet.cx/ffmpeg/  → 解壓後覆蓋 bin/macos/ffmpeg
#
set -e
HERE="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HERE/bin/macos/ffmpeg"
mkdir -p "$(dirname "$DEST")"

if [ -n "${1:-}" ] && [ -f "$1" ]; then
  SRC="$1"
  echo "使用指定檔案：$SRC"
else
  SRC="$(command -v ffmpeg || true)"
  if [ -z "$SRC" ]; then
    echo "找不到 ffmpeg。請先：brew install ffmpeg"
    echo "或：./scripts/fetch-ffmpeg-mac.sh /path/to/static/ffmpeg"
    exit 1
  fi
  # 若為 Homebrew symlink，複製實體檔
  if [ -L "$SRC" ]; then
    SRC="$(readlink -f "$SRC" 2>/dev/null || readlink "$SRC")"
    [[ "$SRC" != /* ]] && SRC="$(dirname "$(command -v ffmpeg)")/$SRC"
  fi
fi

cp -f "$SRC" "$DEST"
chmod +x "$DEST"
xattr -cr "$DEST" 2>/dev/null || true
echo "OK: $DEST ($(ls -lh "$DEST" | awk '{print $5}'))"
"$DEST" -version | head -1
echo ""
echo "若需分發給無 Homebrew 的電腦，請改放 evermeet.cx 的 static ffmpeg。"
