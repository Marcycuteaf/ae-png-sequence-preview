#!/usr/bin/env bash
# PNG 序列預覽 — 打包成自簽章 .zxp + 中英文說明書 ZIP (macOS)
# 需求：上層專案的 tools/ZXPSignCmd 與 tools/bencode-cert.p12
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
SIGN="$ROOT/tools/ZXPSignCmd"
CERT="$ROOT/tools/bencode-cert.p12"
PASS="bencode"
STAGE="$HERE/dist/staging"
NAME="PNG-Sequence-Preview"
ZXP="$HERE/dist/$NAME.zxp"
MANUAL="$HERE/使用說明書_Manual.md"
ZIP="$HERE/dist/${NAME}_v1.0.zip"

if [ ! -x "$SIGN" ]; then
  echo "找不到 $SIGN，請先下載 Adobe ZXPSignCmd。"; exit 1
fi

echo "==> 準備乾淨的打包內容 (僅 CSXS/client/host)"
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -R "$HERE/CSXS" "$STAGE/"
cp -R "$HERE/client" "$STAGE/"
cp -R "$HERE/host" "$STAGE/"
find "$STAGE" -name '.DS_Store' -delete 2>/dev/null || true

echo "==> 產生自簽章憑證 (如不存在)"
if [ ! -f "$CERT" ]; then
  "$SIGN" -selfSignedCert TW Taiwan "MARCY" "MARCY Dev" "$PASS" "$CERT"
fi

echo "==> 簽章打包 ZXP"
rm -f "$ZXP"
"$SIGN" -sign "$STAGE" "$ZXP" "$CERT" "$PASS"

echo "==> 打包成 ZIP (ZXP + 中英文說明書)"
rm -f "$ZIP"
TMP="$HERE/dist/_ziptmp"
rm -rf "$TMP"; mkdir -p "$TMP"
cp "$ZXP" "$TMP/"
[ -f "$MANUAL" ] && cp "$MANUAL" "$TMP/"
( cd "$TMP" && zip -r -X "$ZIP" . -x '.DS_Store' >/dev/null )
rm -rf "$TMP"

echo ""
echo "完成："
ls -la "$ZXP" "$ZIP"
