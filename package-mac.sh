#!/usr/bin/env bash
# PNG 序列預覽 — 打包自簽章 .zxp + 分平台標注的 ZIP (macOS / Windows)
# 需求：上層專案的 tools/ZXPSignCmd 與 tools/bencode-cert.p12
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
SIGN="$ROOT/tools/ZXPSignCmd"
CERT="$ROOT/tools/bencode-cert.p12"
PASS="bencode"
STAGE="$HERE/dist/staging"
VER="1.0.9"
BASE="PNG-Sequence-Preview-v${VER}"
DIST="$HERE/dist"
ZXP="$DIST/${BASE}.zxp"
MANUAL="$HERE/使用說明書_Manual.md"

if [ ! -x "$SIGN" ]; then
  echo "找不到 $SIGN，請先下載 Adobe ZXPSignCmd。"; exit 1
fi

echo "==> 準備乾淨的打包內容 (CSXS/client/host + bin/ffmpeg)"
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -R "$HERE/CSXS" "$STAGE/"
cp -R "$HERE/client" "$STAGE/"
cp -R "$HERE/host" "$STAGE/"
if [ -x "$HERE/bin/macos/ffmpeg" ]; then
  mkdir -p "$STAGE/bin/macos" "$STAGE/bin/win"
  cp -f "$HERE/bin/macos/ffmpeg" "$STAGE/bin/macos/ffmpeg"
  chmod +x "$STAGE/bin/macos/ffmpeg"
  [ -d "$HERE/bin/macos/lib" ] && cp -R "$HERE/bin/macos/lib" "$STAGE/bin/macos/" || true
  [ -f "$HERE/bin/win/ffmpeg.exe" ] && cp -f "$HERE/bin/win/ffmpeg.exe" "$STAGE/bin/win/" || true
  cp -f "$HERE/bin/README.txt" "$STAGE/bin/" 2>/dev/null || true
  echo "    ✓ bin/ffmpeg 已包含"
else
  echo "    ⚠ 未找到 bin/macos/ffmpeg — 請先執行 ./scripts/fetch-ffmpeg-mac.sh"
fi
find "$STAGE" -name '.DS_Store' -delete 2>/dev/null || true

echo "==> 產生自簽章憑證 (如不存在)"
if [ ! -f "$CERT" ]; then
  "$SIGN" -selfSignedCert TW Taiwan "MARCY" "MARCY Dev" "$PASS" "$CERT"
fi

echo "==> 簽章打包 ZXP"
rm -f "$ZXP"
"$SIGN" -sign "$STAGE" "$ZXP" "$CERT" "$PASS"

# 分平台標注的 ZXP 檔名（內容相同，通用 CEP 擴充）
cp -f "$ZXP" "$DIST/${BASE}-macOS.zxp"
cp -f "$ZXP" "$DIST/${BASE}-Windows.zxp"

pack_zip() {
  local platform="$1"
  local out="$DIST/${BASE}-${platform}.zip"
  local tmp="$DIST/_ziptmp_${platform}"
  rm -rf "$tmp"; mkdir -p "$tmp"
  cp "$ZXP" "$tmp/${BASE}-${platform}.zxp"
  [ -f "$MANUAL" ] && cp "$MANUAL" "$tmp/"
  cat > "$tmp/PLATFORM.txt" <<EOF
平台 / Platform: ${platform}
版本 / Version: v${VER}

此 ZXP 為通用 CEP 擴充，macOS 與 Windows 的 After Effects 均可安裝同一檔案。
This ZXP is a universal CEP extension — install the same file on AE for macOS or Windows.

macOS 使用者請下載：${BASE}-macOS.zxp 或 ${BASE}-macOS.zip
Windows 使用者請下載：${BASE}-Windows.zxp 或 ${BASE}-Windows.zip
EOF
  ( cd "$tmp" && zip -r -X "$out" . -x '.DS_Store' >/dev/null )
  rm -rf "$tmp"
  echo "  ✓ $out"
}

echo "==> 打包分平台 ZIP (ZXP + 說明書 + PLATFORM.txt)"
pack_zip "macOS"
pack_zip "Windows"

echo ""
echo "完成 v${VER}："
ls -la "$ZXP" "$DIST/${BASE}"-macOS.* "$DIST/${BASE}"-Windows.*
