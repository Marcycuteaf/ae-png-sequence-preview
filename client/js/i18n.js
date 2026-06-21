/* PNG Sequence Preview — i18n (TC · SC · en · ja) */
var I18n = (function () {
    'use strict';

    var LANG_KEY = 'pngseq.lang.v1';
    var DEFAULT = 'zh-TW';

    var LABELS = {
        'zh-TW': 'TC',
        'zh-CN': 'SC',
        'en': 'English',
        'ja': '日本語'
    };

    var STR = {
        'zh-TW': {
            pick: '➕ 加入資料夾',
            pickTitle: 'Windows：Explorer 大視窗｜Shift+點擊=除錯',
            clearTitle: '清空全部',
            themeTitle: '介面顏色',
            langTitle: '語言',
            noFolders: '尚未載入資料夾…',
            foldersLoaded: '已載入 {n} 個資料夾',
            colorPrimary: '主色',
            colorSecondary: '副色',
            colorBg: '背景',
            reset: '重設',
            searchPh: '🔍 搜尋序列名稱…',
            seqCount: '{n} 序列',
            seqMatch: '{m} / {n} 序列',
            expandAll: '全部展開',
            collapseAll: '全部收合',
            emptyPreview: '選擇左側序列後在此預覽<br>切換時會自動播放，雙擊即可加入時間軸',
            frames: '{i} / {n} 格',
            play: '▶ 播放',
            pause: '⏸ 暫停',
            prevTitle: '上一個序列',
            nextTitle: '下一個序列',
            autoplay: '自動播放',
            autoplayTitle: '切換序列時自動播放',
            autoloop: '自動 Loop',
            autoloopTitle: '加入時間軸時自動套用 loopOut 循環',
            loop: '🔁 Loop',
            loopTitle: '對時間軸選取圖層套用 loopOut(cycle)',
            import: '⬇ 加入時間軸',
            removeRoot: '移除此資料夾',
            ready: '準備就緒',
            noAe: '未偵測到 After Effects 環境',
            diag: '除錯：{info}',
            openingExplorer: '正在開啟 Explorer 大視窗…',
            openingNative: '正在開啟系統資料夾選擇器…',
            loading: '載入：{name}',
            scanning: '掃描中：{path}',
            addedRoot: '已加入：{name}（共 {n} 序列）',
            folderExists: '此資料夾已加入',
            selectSeqFirst: '請先選擇序列',
            adding: '加入時間軸中…',
            applyingLoop: '套用 Loop…',
            removedOne: '已移除一個資料夾',
            cleared: '已清空',
            clearedAll: '已清空全部資料夾',
            restoring: '還原上次的 {n} 個資料夾…',
            restoreFail: '上次的資料夾已不存在或無序列',
            cancelled: '已取消',
            cancelledReason: '已取消 ({reason})',
            explorerFallback: 'Explorer 已取消 → 改用備用',
            explorerErr: 'Explorer：{err} → 改用備用',
            seqLoaded: '{name} — {n} 格',
            pickDialog: '選擇含有 PNG 序列的資料夾',
            pickHint: '選擇此資料夾',
            parseFail: '解析失敗',
            addFail: '加入失敗',
            loopFail: 'Loop 失敗',
            added: '已加入：{msg}',
            loopOk: '已套用 loopOut(cycle) × {n}',
            'err.folder_not_found': '資料夾不存在',
            'err.file_not_found': '檔案不存在',
            'err.no_project': '找不到 AE 專案',
            'err.no_active_comp': '無作用中合成',
            'err.select_layer_first': '請先選擇圖層',
            'err.system_unavailable': 'system.callSystem 不可用（請確認 AE 偏好設定允許腳本）'
        },
        'zh-CN': {
            pick: '➕ 添加文件夹',
            pickTitle: 'Windows：Explorer 大窗口｜Shift+点击=调试',
            clearTitle: '清空全部',
            themeTitle: '界面颜色',
            langTitle: '语言',
            noFolders: '尚未加载文件夹…',
            foldersLoaded: '已加载 {n} 个文件夹',
            colorPrimary: '主色',
            colorSecondary: '副色',
            colorBg: '背景',
            reset: '重置',
            searchPh: '🔍 搜索序列名称…',
            seqCount: '{n} 序列',
            seqMatch: '{m} / {n} 序列',
            expandAll: '全部展开',
            collapseAll: '全部收起',
            emptyPreview: '选择左侧序列后在此预览<br>切换时会自动播放，双击即可加入时间轴',
            frames: '{i} / {n} 帧',
            play: '▶ 播放',
            pause: '⏸ 暂停',
            prevTitle: '上一个序列',
            nextTitle: '下一个序列',
            autoplay: '自动播放',
            autoplayTitle: '切换序列时自动播放',
            autoloop: '自动 Loop',
            autoloopTitle: '加入时间轴时自动套用 loopOut 循环',
            loop: '🔁 Loop',
            loopTitle: '对时间轴选中图层套用 loopOut(cycle)',
            import: '⬇ 加入时间轴',
            removeRoot: '移除此文件夹',
            ready: '准备就绪',
            noAe: '未检测到 After Effects 环境',
            diag: '调试：{info}',
            openingExplorer: '正在打开 Explorer 大窗口…',
            openingNative: '正在打开系统文件夹选择器…',
            loading: '加载：{name}',
            scanning: '扫描中：{path}',
            addedRoot: '已添加：{name}（共 {n} 序列）',
            folderExists: '此文件夹已添加',
            selectSeqFirst: '请先选择序列',
            adding: '加入时间轴中…',
            applyingLoop: '套用 Loop…',
            removedOne: '已移除一个文件夹',
            cleared: '已清空',
            clearedAll: '已清空全部文件夹',
            restoring: '还原上次的 {n} 个文件夹…',
            restoreFail: '上次的文件夹已不存在或无序列',
            cancelled: '已取消',
            cancelledReason: '已取消 ({reason})',
            explorerFallback: 'Explorer 已取消 → 改用备用',
            explorerErr: 'Explorer：{err} → 改用备用',
            seqLoaded: '{name} — {n} 帧',
            pickDialog: '选择含有 PNG 序列的文件夹',
            pickHint: '选择此文件夹',
            parseFail: '解析失败',
            addFail: '加入失败',
            loopFail: 'Loop 失败',
            added: '已加入：{msg}',
            loopOk: '已套用 loopOut(cycle) × {n}',
            'err.folder_not_found': '文件夹不存在',
            'err.file_not_found': '文件不存在',
            'err.no_project': '找不到 AE 项目',
            'err.no_active_comp': '无活动合成',
            'err.select_layer_first': '请先选择图层',
            'err.system_unavailable': 'system.callSystem 不可用（请确认 AE 偏好设置允许脚本）'
        },
        'en': {
            pick: '➕ Add folder',
            pickTitle: 'Windows: Explorer dialog · Shift+click = debug',
            clearTitle: 'Clear all',
            themeTitle: 'Theme colors',
            langTitle: 'Language',
            noFolders: 'No folders loaded…',
            foldersLoaded: '{n} folder(s) loaded',
            colorPrimary: 'Primary',
            colorSecondary: 'Secondary',
            colorBg: 'Background',
            reset: 'Reset',
            searchPh: '🔍 Search sequences…',
            seqCount: '{n} sequences',
            seqMatch: '{m} / {n} sequences',
            expandAll: 'Expand all',
            collapseAll: 'Collapse all',
            emptyPreview: 'Select a sequence on the left to preview<br>Auto-plays on switch · double-click to add to timeline',
            frames: '{i} / {n} frames',
            play: '▶ Play',
            pause: '⏸ Pause',
            prevTitle: 'Previous sequence',
            nextTitle: 'Next sequence',
            autoplay: 'Auto-play',
            autoplayTitle: 'Auto-play when switching sequences',
            autoloop: 'Auto Loop',
            autoloopTitle: 'Apply loopOut when adding to timeline',
            loop: '🔁 Loop',
            loopTitle: 'Apply loopOut(cycle) to selected timeline layer(s)',
            import: '⬇ Add to timeline',
            removeRoot: 'Remove this folder',
            ready: 'Ready',
            noAe: 'After Effects environment not detected',
            diag: 'Debug: {info}',
            openingExplorer: 'Opening Explorer dialog…',
            openingNative: 'Opening folder picker…',
            loading: 'Loading: {name}',
            scanning: 'Scanning: {path}',
            addedRoot: 'Added: {name} ({n} sequences total)',
            folderExists: 'Folder already added',
            selectSeqFirst: 'Select a sequence first',
            adding: 'Adding to timeline…',
            applyingLoop: 'Applying Loop…',
            removedOne: 'Folder removed',
            cleared: 'Cleared',
            clearedAll: 'All folders cleared',
            restoring: 'Restoring {n} saved folder(s)…',
            restoreFail: 'Saved folders missing or contain no sequences',
            cancelled: 'Cancelled',
            cancelledReason: 'Cancelled ({reason})',
            explorerFallback: 'Explorer cancelled → using fallback picker',
            explorerErr: 'Explorer: {err} → using fallback',
            seqLoaded: '{name} — {n} frames',
            pickDialog: 'Select folder containing PNG sequences',
            pickHint: 'Select this folder',
            parseFail: 'Parse failed',
            addFail: 'Add failed',
            loopFail: 'Loop failed',
            added: 'Added: {msg}',
            loopOk: 'Applied loopOut(cycle) × {n}',
            'err.folder_not_found': 'Folder not found',
            'err.file_not_found': 'File not found',
            'err.no_project': 'No AE project',
            'err.no_active_comp': 'No active composition',
            'err.select_layer_first': 'Select a layer first',
            'err.system_unavailable': 'system.callSystem unavailable (enable scripts in AE preferences)'
        },
        'ja': {
            pick: '➕ フォルダー追加',
            pickTitle: 'Windows：Explorer 大ウィンドウ｜Shift+クリック=デバッグ',
            clearTitle: 'すべてクリア',
            themeTitle: 'UI 配色',
            langTitle: '言語',
            noFolders: 'フォルダー未読み込み…',
            foldersLoaded: '{n} フォルダー読み込み済み',
            colorPrimary: 'メイン',
            colorSecondary: 'サブ',
            colorBg: '背景',
            reset: 'リセット',
            searchPh: '🔍 シーケンス名を検索…',
            seqCount: '{n} シーケンス',
            seqMatch: '{m} / {n} シーケンス',
            expandAll: 'すべて展開',
            collapseAll: 'すべて折りたたみ',
            emptyPreview: '左のシーケンスを選択してプレビュー<br>切替で自動再生・ダブルクリックでタイムラインへ',
            frames: '{i} / {n} コマ',
            play: '▶ 再生',
            pause: '⏸ 一時停止',
            prevTitle: '前のシーケンス',
            nextTitle: '次のシーケンス',
            autoplay: '自動再生',
            autoplayTitle: 'シーケンス切替時に自動再生',
            autoloop: '自動 Loop',
            autoloopTitle: 'タイムライン追加時に loopOut を適用',
            loop: '🔁 Loop',
            loopTitle: '選択レイヤーに loopOut(cycle) を適用',
            import: '⬇ タイムラインへ',
            removeRoot: 'このフォルダーを削除',
            ready: '準備完了',
            noAe: 'After Effects 環境が検出されません',
            diag: 'デバッグ：{info}',
            openingExplorer: 'Explorer を開いています…',
            openingNative: 'フォルダー選択を開いています…',
            loading: '読み込み：{name}',
            scanning: 'スキャン中：{path}',
            addedRoot: '追加：{name}（計 {n} シーケンス）',
            folderExists: 'このフォルダーは追加済みです',
            selectSeqFirst: 'シーケンスを選択してください',
            adding: 'タイムラインへ追加中…',
            applyingLoop: 'Loop を適用中…',
            removedOne: 'フォルダーを削除しました',
            cleared: 'クリアしました',
            clearedAll: 'すべてのフォルダーをクリア',
            restoring: '前回の {n} フォルダーを復元中…',
            restoreFail: '保存フォルダーが見つからないかシーケンスがありません',
            cancelled: 'キャンセル',
            cancelledReason: 'キャンセル ({reason})',
            explorerFallback: 'Explorer キャンセル → 代替選択器',
            explorerErr: 'Explorer：{err} → 代替選択器',
            seqLoaded: '{name} — {n} コマ',
            pickDialog: 'PNG シーケンスを含むフォルダーを選択',
            pickHint: 'このフォルダーを選択',
            parseFail: '解析失敗',
            addFail: '追加失敗',
            loopFail: 'Loop 失敗',
            added: '追加：{msg}',
            loopOk: 'loopOut(cycle) を適用 × {n}',
            'err.folder_not_found': 'フォルダーが存在しません',
            'err.file_not_found': 'ファイルが存在しません',
            'err.no_project': 'AE プロジェクトがありません',
            'err.no_active_comp': 'アクティブなコンポがありません',
            'err.select_layer_first': 'レイヤーを選択してください',
            'err.system_unavailable': 'system.callSystem 使用不可（AE のスクリプト設定を確認）'
        }
    };

    var lang = DEFAULT;

    function fmt(s, vars) {
        if (!vars) return s;
        return s.replace(/\{(\w+)\}/g, function (_, k) {
            return vars[k] != null ? String(vars[k]) : '{' + k + '}';
        });
    }

    function t(key, vars) {
        var pack = STR[lang] || STR[DEFAULT];
        var s = pack[key];
        if (s == null) s = STR[DEFAULT][key];
        if (s == null) return key;
        return fmt(s, vars);
    }

    function detectLang() {
        try {
            var saved = localStorage.getItem(LANG_KEY);
            if (saved && STR[saved]) return saved;
        } catch (e) {}
        if (typeof navigator !== 'undefined') {
            var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
            if (nav.indexOf('zh-tw') >= 0 || nav.indexOf('zh-hant') >= 0) return 'zh-TW';
            if (nav.indexOf('zh') >= 0) return 'zh-CN';
            if (nav.indexOf('ja') >= 0) return 'ja';
            if (nav.indexOf('en') >= 0) return 'en';
        }
        return DEFAULT;
    }

    function getLang() { return lang; }

    function setLang(code) {
        if (!STR[code]) code = DEFAULT;
        lang = code;
        try { localStorage.setItem(LANG_KEY, code); } catch (e) {}
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.lang = code === 'zh-CN' ? 'zh-Hans' : (code === 'zh-TW' ? 'zh-Hant' : code);
        }
    }

    function applyDOM(root) {
        root = root || document;
        var nodes = root.querySelectorAll('[data-i18n]');
        for (var i = 0; i < nodes.length; i++) {
            var k = nodes[i].getAttribute('data-i18n');
            var html = nodes[i].getAttribute('data-i18n-html');
            if (html === '1') nodes[i].innerHTML = t(k);
            else nodes[i].textContent = t(k);
        }
        var phs = root.querySelectorAll('[data-i18n-ph]');
        for (var j = 0; j < phs.length; j++) phs[j].placeholder = t(phs[j].getAttribute('data-i18n-ph'));
        var titles = root.querySelectorAll('[data-i18n-title]');
        for (var u = 0; u < titles.length; u++) titles[u].title = t(titles[u].getAttribute('data-i18n-title'));
    }

    function hostErr(ret) {
        if (!ret || ret.indexOf('ERR:') !== 0) return ret || '';
        var body = ret.slice(4);
        var i = body.indexOf(':');
        var code = i >= 0 ? body.slice(0, i) : body;
        var extra = i >= 0 ? body.slice(i + 1) : '';
        var msg = t('err.' + code);
        if (msg === 'err.' + code) msg = body;
        return extra ? (msg + (extra.charAt(0) === ' ' ? '' : '：') + extra) : msg;
    }

    function hostOk(ret) {
        if (!ret || ret.indexOf('OK:') !== 0) return ret || '';
        var body = ret.slice(3);
        if (body.indexOf('loop:') === 0) {
            return t('loopOk', { n: body.slice(5) });
        }
        return body;
    }

    function validate() {
        var base = STR[DEFAULT];
        var keys = [];
        for (var k in base) if (base.hasOwnProperty(k)) keys.push(k);
        var missing = [];
        for (var code in STR) {
            if (!STR.hasOwnProperty(code)) continue;
            for (var n = 0; n < keys.length; n++) {
                if (STR[code][keys[n]] == null) missing.push(code + ' missing ' + keys[n]);
            }
        }
        return missing;
    }

    try { setLang(detectLang()); } catch (e) { lang = DEFAULT; }

    return {
        t: t, fmt: fmt, getLang: getLang, setLang: setLang, applyDOM: applyDOM,
        hostErr: hostErr, hostOk: hostOk, validate: validate,
        LABELS: LABELS, LANGS: ['zh-TW', 'zh-CN', 'en', 'ja']
    };
})();
