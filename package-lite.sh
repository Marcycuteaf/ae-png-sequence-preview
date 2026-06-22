#!/usr/bin/env bash
# PNG Seq Lite — 簡約版打包（獨立版本號，與完整版分開）
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
SIGN="$ROOT/tools/ZXPSignCmd"
CERT="$ROOT/tools/bencode-cert.p12"
PASS="bencode"
LITE="$HERE/lite"
STAGE="$HERE/dist/lite-staging"
VER="1.0.1"
BASE="PNG-Seq-Lite-v${VER}"
DIST="$HERE/dist/lite"
ZXP="$DIST/${BASE}.zxp"
README="$LITE/README.md"

if [ ! -x "$SIGN" ]; then
  echo "找不到 $SIGN，請先下載 Adobe ZXPSignCmd。"; exit 1
fi

echo "==> Lite v${VER} — 準備打包內容"
rm -rf "$STAGE"
mkdir -p "$STAGE" "$DIST"
cp -R "$LITE/CSXS" "$STAGE/"
cp -R "$LITE/client" "$STAGE/"
cp -R "$LITE/host" "$STAGE/"
find "$STAGE" -name '.DS_Store' -delete 2>/dev/null || true

echo "==> 簽章打包 ZXP"
rm -f "$ZXP"
"$SIGN" -sign "$STAGE" "$ZXP" "$CERT" "$PASS"

cp -f "$ZXP" "$DIST/${BASE}-macOS.zxp"
cp -f "$ZXP" "$DIST/${BASE}-Windows.zxp"

pack_zip() {
  local platform="$1"
  local out="$DIST/${BASE}-${platform}.zip"
  local tmp="$DIST/_ziptmp_lite_${platform}"
  rm -rf "$tmp"; mkdir -p "$tmp"
  cp "$ZXP" "$tmp/${BASE}-${platform}.zxp"
  [ -f "$README" ] && cp "$README" "$tmp/"
  cat > "$tmp/PLATFORM.txt" <<EOF
產品 / Product: PNG Seq Lite（簡約版）
平台 / Platform: ${platform}
版本 / Version: Lite v${VER}
Bundle ID: com.marcy.pngseq.lite

與完整版 PNG Sequence Preview 可同時安裝（不同 Bundle ID）。
This Lite build can be installed alongside the full PNG Sequence Preview.

完整版 / Full version: https://github.com/Marcycuteaf/ae-png-sequence-preview/releases
EOF
  ( cd "$tmp" && zip -r -X "$out" . -x '.DS_Store' >/dev/null )
  rm -rf "$tmp"
  echo "  ✓ $out"
}

echo "==> 打包 ZIP"
pack_zip "macOS"
pack_zip "Windows"

echo ""
echo "完成 Lite v${VER}："
ls -la "$ZXP" "$DIST/${BASE}"-macOS.* "$DIST/${BASE}"-Windows.*
