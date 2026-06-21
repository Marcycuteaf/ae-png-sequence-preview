#!/usr/bin/env bash
# 驗證四語系 i18n 字串完整性 + JS 語法
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
JSC="/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"

echo "==> i18n key check"
"$JSC" "$HERE/client/js/i18n.js" -e "
var missing = I18n.validate();
if (missing.length) {
  missing.forEach(function (m) { print('MISSING: ' + m); });
  quit(1);
}
print('OK: all 4 languages complete (' + I18n.LANGS.join(', ') + ')');
I18n.LANGS.forEach(function (code) {
  I18n.setLang(code);
  print('  ' + code + ': ' + I18n.t('pick') + ' | ' + I18n.t('import') + ' | ' + I18n.t('err.folder_not_found'));
});
"

echo "==> JS syntax"
"$JSC" -e "
try {
  load('$HERE/client/js/i18n.js');
  new Function(read('$HERE/client/js/main.js'));
  new Function(read('$HERE/host/host.jsx'));
  print('OK: syntax');
} catch (e) { print('FAIL: ' + e); quit(1); }
"

echo "==> done"
