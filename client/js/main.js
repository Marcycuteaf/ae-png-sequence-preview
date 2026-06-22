/* PNG 序列預覽 — 面板主程式 (CEP / CEF JavaScript) */
(function () {
    'use strict';

    var STORAGE_KEY = 'pngseq.roots.v1';
    var EXPORT_DIR_KEY = 'pngseq.exportDir.v1';
    var THEME_KEY = 'pngseq.theme.v1';
    var DEFAULT_THEME = { accent: '#2d8ceb', accent2: '#2d8ceb', bg: '#323232' };
    var THEME_CUSTOM_KEY = 'pngseq.theme.custom.v1';
    var cs = (typeof CSInterface !== 'undefined') ? new CSInterface() : null;
    var $ = function (id) { return document.getElementById(id); };

    var PRELOAD_RADIUS = 10;

    var els = {
        langSelect: $('langSelect'),
        pick: $('pick'), folderInput: $('folderInput'), clear: $('clear'), root: $('root'), tree: $('tree'), count: $('count'),
        search: $('search'), expandAll: $('expandAll'), collapseAll: $('collapseAll'),
        frame: $('frame'), empty: $('empty'), name: $('name'), info: $('info'),
        slider: $('slider'), prev: $('prev'), play: $('play'), next: $('next'),
        fps: $('fps'), autoplay: $('autoplay'), autoloop: $('autoloop'), loopBtn: $('loop'),
        importMode: $('importMode'), importBtn: $('import'), gifToPng: $('gifToPng'), status: $('status'),
        selectAll: $('selectAll'), selectedCount: $('selectedCount'), exportAlpha: $('exportAlpha'),
        exportOutPath: $('exportOutPath'), exportOutOpen: $('exportOutOpen'), exportOutPick: $('exportOutPick'), exportOutReset: $('exportOutReset'),
        theme: $('theme'), settings: $('settings'),
        cAccent: $('cAccent'), cAccent2: $('cAccent2'), cBg: $('cBg'), themeReset: $('themeReset')
    };

    var IS_WIN = /Win/i.test(navigator.platform) || /Windows/i.test(navigator.userAgent);

    var state = {
        roots: [],            // 已載入的根路徑（持久化）
        forest: [],           // 對應每個根的樹節點
        seqList: [],          // 攤平的序列節點（依顯示順序）
        current: -1,
        currentPath: '',
        rowOf: {},            // path -> row DOM
        framesCache: {},      // dir -> 帧路徑陣列
        frames: [], frameIdx: 0, imageCache: {}, playing: false, timer: null,
        selected: {}, exporting: false
    };

    function t(key, vars) { return I18n.t(key, vars); }
    function errMsg(ret) { return I18n.hostErr(ret); }

    function initLangSelect() {
        if (!els.langSelect) return;
        els.langSelect.innerHTML = '';
        var langs = I18n.LANGS;
        for (var i = 0; i < langs.length; i++) {
            var opt = document.createElement('option');
            opt.value = langs[i];
            opt.textContent = I18n.LABELS[langs[i]];
            els.langSelect.appendChild(opt);
        }
        els.langSelect.value = I18n.getLang();
        els.langSelect.addEventListener('change', function () {
            I18n.setLang(els.langSelect.value);
            applyLanguage();
        });
    }

    function applyLanguage() {
        I18n.applyDOM();
        if (els.langSelect) els.langSelect.value = I18n.getLang();
        updateRootLabel();
        updateImportUI();
        updateSelectedUI();
        updateExportOutUI();
        if (els.search.value.trim()) applyFilter();
        else els.count.textContent = t('seqCount', { n: state.seqList.length });
        if (state.frames.length) {
            els.info.textContent = t('frames', { i: state.frameIdx + 1, n: state.frames.length });
        } else {
            els.info.textContent = t('frames', { i: 0, n: 0 });
        }
        Icons.setPlayButton(els.play, state.playing);
        var rms = els.tree.querySelectorAll('.rm');
        for (var r = 0; r < rms.length; r++) rms[r].title = t('removeRoot');
    }

    function prependIcon(btn, name) {
        if (!btn || btn.querySelector('.ico-svg')) return;
        var label = btn.querySelector('.btn-label');
        btn.insertBefore(Icons.create(name), label || btn.firstChild);
    }

    function initIcons() {
        prependIcon(els.pick, 'folder-plus');
        Icons.into(els.clear, 'trash');
        Icons.into(els.theme, 'palette');
        Icons.into(els.expandAll, 'expand');
        Icons.into(els.collapseAll, 'collapse');
        var searchWrap = document.querySelector('.search-wrap');
        if (searchWrap && !searchWrap.querySelector('.ico-svg')) {
            searchWrap.insertBefore(Icons.create('search'), searchWrap.firstChild);
        }
        prependIcon(els.exportAlpha, 'export');
        if (els.exportOutOpen) prependIcon(els.exportOutOpen, 'folder');
        if (els.gifToPng) prependIcon(els.gifToPng, 'gif');
        Icons.into(els.prev, 'chevron-left');
        Icons.into(els.next, 'chevron-right');
        Icons.setPlayButton(els.play, false);
        prependIcon(els.loop, 'loop');
        prependIcon(els.import, 'download');
    }

    function updateImportUI() {
        if (!els.importBtn) return;
        var mode = els.importMode ? els.importMode.value : 'timeline';
        var label = els.importBtn.querySelector('.btn-label');
        var text = mode === 'project' ? t('importProject') : t('import');
        if (label) label.textContent = text;
        else els.importBtn.textContent = text;
    }

    function formatSeqMeta(node) {
        if (node.isGif) {
            var g = [];
            if (node.w > 0 && node.h > 0) g.push(node.w + '×' + node.h);
            g.push('GIF');
            return g.join(' ');
        }
        var parts = [];
        if (node.w > 0 && node.h > 0) parts.push(node.w + '×' + node.h);
        parts.push('(' + node.count + ')');
        return parts.join(' ');
    }

    function updateSeqButtons(node) {
        var isGif = node && node.isGif;
        if (els.gifToPng) els.gifToPng.disabled = !isGif;
        if (els.importBtn) els.importBtn.disabled = !node || isGif;
    }

    function countSelected() {
        var n = 0;
        for (var p in state.selected) if (state.selected.hasOwnProperty(p) && state.selected[p]) n++;
        return n;
    }

    function updateSelectedUI() {
        var n = countSelected();
        if (els.selectedCount) els.selectedCount.textContent = t('selectedCount', { n: n });
        if (els.exportAlpha) els.exportAlpha.disabled = n === 0 || state.exporting;
        if (els.selectAll) {
            var total = state.seqList.length;
            els.selectAll.checked = total > 0 && n === total;
            els.selectAll.indeterminate = n > 0 && n < total;
        }
    }

    function setSeqChecked(node, checked) {
        if (checked) state.selected[node.path] = true;
        else delete state.selected[node.path];
        if (node.__chk) node.__chk.checked = checked;
        updateSelectedUI();
    }

    function toggleSelectAll(checked) {
        for (var i = 0; i < state.seqList.length; i++) {
            var node = state.seqList[i];
            if (checked) state.selected[node.path] = true;
            else delete state.selected[node.path];
            if (node.__chk) node.__chk.checked = checked;
        }
        updateSelectedUI();
    }

    function getSelectedNodes() {
        var out = [];
        for (var i = 0; i < state.seqList.length; i++) {
            var n = state.seqList[i];
            if (state.selected[n.path] && !n.isGif) out.push(n);
        }
        return out;
    }

    function loadExportDir() {
        try {
            var p = localStorage.getItem(EXPORT_DIR_KEY);
            return p ? String(p) : '';
        } catch (e) { return ''; }
    }
    function saveExportDir(path) {
        try {
            if (path) localStorage.setItem(EXPORT_DIR_KEY, path);
            else localStorage.removeItem(EXPORT_DIR_KEY);
        } catch (e) {}
    }
    function shortPath(p) {
        if (!p) return '';
        p = String(p);
        if (p.length <= 42) return p;
        return '…' + p.slice(-39);
    }
    function resolveExportDir(seqPath) {
        var custom = loadExportDir();
        if (custom) return custom;
        return String(seqPath).replace(/\\/g, '/').replace(/\/+$/, '') + '/_AlphaExport';
    }
    function updateExportOutUI() {
        if (!els.exportOutPath) return;
        var custom = loadExportDir();
        if (custom) {
            els.exportOutPath.textContent = shortPath(custom);
            els.exportOutPath.title = custom;
        } else {
            els.exportOutPath.textContent = t('exportOutBesideSeq');
            els.exportOutPath.title = t('exportOutBesideSeqHint');
        }
    }
    function pickFolderDialog(cb) {
        // Windows：cep.fs 原生對話框（與加入資料夾相同）
        if (IS_WIN && cepFsAvailable()) {
            setStatus(t('openingExplorer'));
            var cepPath = pickFolderCep();
            cb(cepPath || null);
            return;
        }
        // macOS：ExtendScript Folder.selectDialog
        if (!IS_WIN) {
            pickFolderMac(cb);
            return;
        }
        // Windows 備用
        pickExplorer(function (path) {
            if (path && path.indexOf('ERR:') !== 0 && path.length > 0) cb(path);
            else cb(null);
        });
    }

    function pickExportFolder() {
        pickFolderDialog(function (path) {
            if (!path) { setStatus(t('cancelled')); return; }
            saveExportDir(path);
            updateExportOutUI();
            ensureRoot(path, function () {
                setStatus(t('exportOutSet', { path: path }), 'ok');
            });
        });
    }
    function resetExportFolder() {
        saveExportDir('');
        updateExportOutUI();
        setStatus(t('exportOutResetDone'), 'ok');
    }
    function getExportFolderToOpen() {
        var custom = loadExportDir();
        if (custom) return custom;
        if (state.current >= 0 && state.seqList[state.current]) {
            return resolveExportDir(state.seqList[state.current].path);
        }
        var selected = getSelectedNodes();
        if (selected.length >= 1) return resolveExportDir(selected[0].path);
        if (state.seqList.length === 1) return resolveExportDir(state.seqList[0].path);
        return null;
    }
    function openExportFolder() {
        var folder = getExportFolderToOpen();
        if (!folder) {
            setStatus(t('exportOutOpenNeedSeq'), 'err');
            return;
        }
        call('pngRevealFolder', [folder], function (ret) {
            if (ret.indexOf('OK:') === 0) setStatus(t('exportOutOpened', { path: ret.slice(3) }), 'ok');
            else setStatus(errMsg(ret), 'err');
        });
    }

    function loadFramePaths(dir, cb) {
        if (state.framesCache[dir]) return cb(state.framesCache[dir]);
        call('pngFrames', [dir], function (ret) {
            if (ret.indexOf('ERR') === 0) return cb(null);
            try {
                var arr = JSON.parse(ret);
                state.framesCache[dir] = arr;
                cb(arr);
            } catch (e) { cb(null); }
        });
    }

    function exportOneAlpha(node, fps, cb) {
        var category = node.__rootName || '';
        var displayName = (typeof PngFfmpegExport !== 'undefined' ? PngFfmpegExport.safeName(node.name) : node.name) + ' (Alpha)';
        var outDir = loadExportDir();
        var exportDirHint = resolveExportDir(node.path);
        var doLoop = els.autoloop && els.autoloop.checked;

        function aeRender(lastNote) {
            setStatus(t('exportViaAe', { name: node.name }));
            call('pngRenderAlphaVideo', [node.first, node.name, fps, category, outDir, true, doLoop], function (ret) {
                if (ret.indexOf('ERR') === 0 && lastNote) {
                    cb('ERR:export_failed:' + lastNote + ' | ' + ret.slice(4));
                } else {
                    cb(ret);
                }
            });
        }

        function tryNodeThenAe(lastNote) {
            if (typeof PngFfmpegExport === 'undefined' || !PngFfmpegExport.available()) {
                aeRender(lastNote || (PngFfmpegExport && PngFfmpegExport.nodeError ? PngFfmpegExport.nodeError() : 'node_unavailable'));
                return;
            }
            loadFramePaths(node.path, function (frames) {
                if (!frames || !frames.length) {
                    aeRender('no_frames');
                    return;
                }
                var ext = cs ? cs.getSystemPath(SystemPath.EXTENSION) : '';
                PngFfmpegExport.exportAlpha({
                    seqDir: node.path,
                    seqName: node.name,
                    fps: fps,
                    framePaths: frames,
                    extPath: ext,
                    exportDir: exportDirHint
                }, function (err, outFile, exportDir) {
                    if (err) {
                        aeRender(String(err.message || err));
                        return;
                    }
                    call('pngImportVideo', [outFile, displayName, category, true, doLoop], function (ret) {
                        if (ret.indexOf('ERR') === 0) {
                            aeRender('import:' + ret.slice(4));
                            return;
                        }
                        cb('OK:' + outFile);
                    });
                });
            });
        }

        tryNodeThenAe('');
    }

    function exportSelectedAlpha() {
        if (state.exporting) return;
        var nodes = getSelectedNodes();
        if (!nodes.length) { setStatus(t('selectSeqFirst'), 'err'); return; }
        var fps = parseFloat(els.fps.value) || 24;
        if (fps < 1) fps = 1;
        state.exporting = true;
        updateSelectedUI();
        var idx = 0;
        var okCount = 0;

        function next() {
            if (idx >= nodes.length) {
                state.exporting = false;
                updateSelectedUI();
                setStatus(t('exportAlphaDone', { n: okCount }), 'ok');
                return;
            }
            var node = nodes[idx];
            setStatus(t('exportingAlpha', { i: idx + 1, n: nodes.length, name: node.name }));
            exportOneAlpha(node, fps, function (ret) {
                if (ret.indexOf('ERR') === 0) {
                    state.exporting = false;
                    updateSelectedUI();
                    setStatus(errMsg(ret) || t('exportAlphaFail'), 'err');
                    return;
                }
                okCount++;
                idx++;
                if (ret.indexOf('OK:') === 0) {
                    setStatus(t('exportAlphaSaved', { path: ret.slice(3) }), 'ok');
                }
                next();
            });
        }
        next();
    }

    function pickDialogArgs() {
        return [t('pickDialog'), t('pickHint')];
    }

    function setStatus(msg, type) {
        els.status.textContent = msg;
        els.status.className = 'status ' + (type || '');
    }
    function q(v) {
        if (typeof v === 'number' || typeof v === 'boolean') return String(v);
        return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    }
    function call(fn, args, cb) {
        if (!cs) { setStatus(t('noAe'), 'err'); return; }
        cs.evalScript(fn + '(' + (args || []).map(q).join(',') + ')',
            function (ret) { cb(String(ret == null ? '' : ret)); });
    }
    function normPath(p) {
        return String(p).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
    }
    function findRootIndex(path) {
        var np = normPath(path);
        for (var i = 0; i < state.roots.length; i++) {
            if (normPath(state.roots[i]) === np) return i;
        }
        return -1;
    }

    // 跨平台 file://（修正 Windows 反斜線與磁碟代號）
    function fileURL(p) {
        var s = String(p).replace(/\\/g, '/');
        var parts = s.split('/').filter(function (x) { return x.length > 0; });
        var out = [];
        for (var i = 0; i < parts.length; i++) {
            if (i === 0 && /^[a-zA-Z]:$/.test(parts[i])) out.push(parts[i]);
            else out.push(encodeURIComponent(parts[i]));
        }
        return 'file:///' + out.join('/');
    }

    // 從 HTML 資料夾選擇器取得根目錄
    function rootFromFileList(files) {
        if (!files || !files.length) return null;
        var f = files[0];
        // Windows CEP：file.path 通常可用
        if (f.path) {
            var full = String(f.path);
            if (f.webkitRelativePath) {
                var rel = String(f.webkitRelativePath).replace(/\//g, '\\');
                var fullWin = full.replace(/\//g, '\\');
                var idx = fullWin.toLowerCase().lastIndexOf(rel.toLowerCase());
                if (idx >= 0) return fullWin.substring(0, idx).replace(/[\\\/]+$/, '');
            }
            var sep = Math.max(full.lastIndexOf('\\'), full.lastIndexOf('/'));
            if (sep > 0) return full.substring(0, sep);
        }
        // 僅有 webkitRelativePath：取第一層目錄名，需搭配 path
        return null;
    }

    function pickFolderNative(cb) {
        if (!els.folderInput) { cb(null, 'no-input'); return; }
        els.folderInput.value = '';
        var done = false;
        var blurred = false;

        function finish(root, reason) {
            if (done) return;
            done = true;
            cleanup();
            cb(root, reason || (root ? 'ok' : 'cancel'));
        }
        function cleanup() {
            window.removeEventListener('focus', onWinFocus);
            window.removeEventListener('blur', onBlur);
            els.folderInput.onchange = null;
            clearTimeout(noDialogTimer);
        }
        function onBlur() { blurred = true; }
        function onWinFocus() {
            if (!blurred) return;
            setTimeout(function () {
                if (done) return;
                if (els.folderInput.files && els.folderInput.files.length) return;
                finish(null, 'native-cancel');
            }, 600);
        }
        els.folderInput.onchange = function () {
            var root = rootFromFileList(els.folderInput.files);
            finish(root, root ? 'native-ok' : 'native-empty');
        };
        window.addEventListener('blur', onBlur);
        window.addEventListener('focus', onWinFocus);
        try { els.folderInput.click(); } catch (e) {
            finish(null, 'native-click-err:' + e);
            return;
        }
        // 若 2 秒內沒有 blur，代表對話框可能沒開
        var noDialogTimer = setTimeout(function () {
            if (done) return;
            if (!blurred) finish(null, 'native-no-dialog');
        }, 2000);
    }

    function cepFsAvailable() {
        return !!(window.cep && window.cep.fs && typeof window.cep.fs.showOpenDialog === 'function');
    }

    // CEP 原生 OS 資料夾對話框（Windows 優先使用）
    function pickFolderCep() {
        var title = t('pickDialog');
        var fs = window.cep.fs;
        var result;
        try {
            if (typeof fs.showOpenDialogEx === 'function') {
                result = fs.showOpenDialogEx(false, true, title, '', [], '', IS_WIN ? 'Select Folder' : 'Choose');
            } else {
                result = fs.showOpenDialog(false, true, title, '', []);
            }
        } catch (e) { return null; }
        if (result && result.data && result.data.length > 0 &&
            (result.err === undefined || result.err === 0)) {
            return result.data[0];
        }
        return null;
    }

    function pickFolderMac(cb) {
        setStatus(t('openingExplorer'));
        call('pngPickFolder', pickDialogArgs(), function (path) {
            if (path && path.indexOf('ERR:') !== 0 && path.length > 0) {
                cb(path);
                return;
            }
            if (path && path.indexOf('ERR:') === 0) {
                setStatus(errMsg(path), 'err');
            }
            if (cepFsAvailable()) {
                var cepPath = pickFolderCep();
                if (cepPath) { cb(cepPath); return; }
            }
            cb(null);
        });
    }

    function runDiag() {
        var ext = cs ? cs.getSystemPath(SystemPath.EXTENSION) : '';
        call('pngInit', [ext], function (initRet) {
            call('pngFfmpegTest', [], function (ffRet) {
                call('pngDiag', [], function (ret) {
                    var parts = [];
                    if (initRet.indexOf('OK:') === 0) parts.push(initRet.slice(3));
                    if (ffRet.indexOf('OK:') === 0) parts.push(ffRet.slice(3));
                    else parts.push('ffmpegTest=' + ffRet);
                    if (ret.indexOf('OK:') === 0) parts.push(ret.slice(3));
                    var ok = initRet.indexOf('OK:') === 0 && ffRet.indexOf('OK:') === 0 && ret.indexOf('OK:') === 0;
                    setStatus(t('diag', { info: parts.join(' | ') }), ok ? 'ok' : 'err');
                });
            });
        });
    }

    function initHost(cb) {
        if (!cs) { if (cb) cb(); return; }
        var ext = cs.getSystemPath(SystemPath.EXTENSION);
        call('pngInit', [ext], function (ret) {
            if (ret.indexOf('ERR') === 0) setStatus(errMsg(ret), 'err');
            if (cb) cb();
        });
    }

    function pickExplorer(cb) {
        setStatus(t('openingExplorer'));
        call('pngPickFolder', pickDialogArgs(), function (path) {
            cb(path);
        });
    }

    function pickNativeFallback(cb) {
        setStatus(t('openingNative'));
        pickFolderNative(function (root, reason) {
            cb(root, reason);
        });
    }

    // ================= 持久化 =================
    function saveRoots() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.roots)); } catch (e) {}
    }
    function loadSavedRoots() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) || []) : [];
        } catch (e) { return []; }
    }

    // ================= 介面顏色主題 =================
    function rgbToHex(rgb) {
        if (!rgb) return null;
        var r = rgb.red, g = rgb.green, b = rgb.blue;
        if (r > 255 || g > 255 || b > 255) {
            r = Math.round(r / 256);
            g = Math.round(g / 256);
            b = Math.round(b / 256);
        }
        function h(v) {
            v = Math.max(0, Math.min(255, Math.round(v)));
            var s = v.toString(16);
            return s.length === 1 ? '0' + s : s;
        }
        return '#' + h(r) + h(g) + h(b);
    }
    function uiToHex(ui) { return ui && ui.color ? rgbToHex(ui.color) : null; }
    function isLightBg(hex) {
        var m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
        if (!m) return false;
        var n = parseInt(m[1], 16);
        var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        return (0.299 * r + 0.587 * g + 0.114 * b) > 140;
    }
    function applyHostTheme() {
        if (!cs) return false;
        try {
            var skin = cs.getHostEnvironment().appSkinInfo;
            if (!skin) return false;
            var bg = uiToHex(skin.panelBackgroundColorSRGB) ||
                uiToHex(skin.panelBackgroundColor) || DEFAULT_THEME.bg;
            var hl = rgbToHex(skin.systemHighlightColor) || DEFAULT_THEME.accent;
            var light = isLightBg(bg);
            var s = document.documentElement.style;
            s.setProperty('--bg', bg);
            s.setProperty('--panel', shade(bg, light ? -8 : 8));
            s.setProperty('--panel2', shade(bg, light ? 12 : -12));
            s.setProperty('--panel3', shade(bg, light ? 18 : -6));
            s.setProperty('--line', shade(bg, light ? -20 : 20));
            s.setProperty('--stage', shade(bg, light ? -16 : -16));
            s.setProperty('--txt', light ? '#232323' : '#d4d4d4');
            s.setProperty('--muted', light ? '#666666' : '#999999');
            s.setProperty('--accent', hl);
            s.setProperty('--accent2', hl);
            s.setProperty('--accent-dim', hexToRgba(hl, 0.18));
            if (skin.baseFontFamily) {
                document.body.style.fontFamily = skin.baseFontFamily + ', "PingFang TC", "Segoe UI", sans-serif';
            }
            if (skin.baseFontSize) {
                document.body.style.fontSize = Math.round(skin.baseFontSize) + 'px';
            }
            if (els.cAccent) els.cAccent.value = hl;
            if (els.cAccent2) els.cAccent2.value = hl;
            if (els.cBg) els.cBg.value = bg;
            return true;
        } catch (e) { return false; }
    }
    function shade(hex, amt) {
        var m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
        if (!m) return hex;
        var n = parseInt(m[1], 16);
        var r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
        var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
        var b = Math.max(0, Math.min(255, (n & 255) + amt));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    function applyTheme(t) {
        var s = document.documentElement.style;
        s.setProperty('--accent', t.accent);
        s.setProperty('--accent2', t.accent2);
        s.setProperty('--bg', t.bg);
        s.setProperty('--panel', shade(t.bg, 10));
        s.setProperty('--panel2', shade(t.bg, 18));
        s.setProperty('--panel3', shade(t.bg, 24));
        s.setProperty('--line', shade(t.bg, 32));
        s.setProperty('--accent-dim', hexToRgba(t.accent, 0.14));
        if (els.cAccent) els.cAccent.value = t.accent;
        if (els.cAccent2) els.cAccent2.value = t.accent2;
        if (els.cBg) els.cBg.value = t.bg;
    }
    function hexToRgba(hex, a) {
        var m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
        if (!m) return 'rgba(74,158,255,' + a + ')';
        var n = parseInt(m[1], 16);
        return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    function loadTheme() {
        try { var r = localStorage.getItem(THEME_KEY); return r ? JSON.parse(r) : null; }
        catch (e) { return null; }
    }
    function saveTheme(t) { try { localStorage.setItem(THEME_KEY, JSON.stringify(t)); } catch (e) {} }
    function currentTheme() {
        return { accent: els.cAccent.value, accent2: els.cAccent2.value, bg: els.cBg.value };
    }
    function onThemeChange() {
        var t = currentTheme();
        applyTheme(t);
        saveTheme(t);
        try { localStorage.setItem(THEME_CUSTOM_KEY, '1'); } catch (e) {}
    }

    function updateRootLabel() {
        var n = state.roots.length;
        var sq = state.seqList.length;
        if (n === 0 && sq === 0) {
            els.root.textContent = t('noFolders');
            els.root.title = '';
            return;
        }
        var suffix = sq > 0 ? ' · ' + t('seqCount', { n: sq }) : '';
        if (n === 1 && state.forest[0] && state.forest[0].name) {
            els.root.textContent = state.forest[0].name + suffix;
            els.root.title = state.roots[0];
        } else if (n > 0) {
            els.root.textContent = t('foldersLoaded', { n: n }) + suffix;
            els.root.title = state.roots.join('\n');
        } else if (sq > 0) {
            els.root.textContent = t('seqCount', { n: sq });
            els.root.title = '';
        }
    }

    // ================= 樹狀渲染（多根森林）=================
    function buildForest() {
        state.rowOf = {};
        state.seqList = [];
        els.tree.innerHTML = '';
        var frag = document.createDocumentFragment();
        for (var i = 0; i < state.forest.length; i++)
            frag.appendChild(renderNode(state.forest[i], 0, { isRoot: true, rootName: state.forest[i].name }));
        els.tree.appendChild(frag);
        els.count.textContent = t('seqCount', { n: state.seqList.length });
        updateRootLabel();
        relocateCurrent();
        // 預設展開每個根的第一層
        var tops = els.tree.children;
        for (var t = 0; t < tops.length; t++) {
            var cb = tops[t].querySelector(':scope > .children');
            var tw = tops[t].querySelector(':scope > .row > .tw');
            if (cb) cb.classList.add('open');
            if (tw) tw.classList.add('open');
        }
        updateSelectedUI();
    }

    function renderNode(node, depth, opts) {
        opts = opts || {};
        var wrap = document.createElement('div');
        wrap.className = 'node';

        var row = document.createElement('div');
        row.className = 'row' + (opts.isRoot ? ' root-row' : '');
        row.style.paddingLeft = (4 + depth * 12) + 'px';

        var hasKids = node.children && node.children.length > 0;

        if (node.isSeq) {
            var chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.className = 'seq-chk';
            chk.checked = !!state.selected[node.path];
            chk.addEventListener('click', function (e) { e.stopPropagation(); });
            chk.addEventListener('change', function () { setSeqChecked(node, chk.checked); });
            row.appendChild(chk);
            node.__chk = chk;
        } else {
            var chkSp = document.createElement('span');
            chkSp.className = 'seq-chk';
            chkSp.style.visibility = 'hidden';
            row.appendChild(chkSp);
        }

        var tw = document.createElement('span');
        tw.className = 'tw' + (hasKids ? '' : ' leaf');
        Icons.into(tw, 'chevron-right');
        row.appendChild(tw);

        var ico = document.createElement('span');
        ico.className = 'ico';
        Icons.into(ico, opts.isRoot ? 'root' : (node.isGif ? 'gif' : (node.isSeq ? 'sequence' : 'folder')));
        row.appendChild(ico);

        var label = document.createElement('span');
        label.className = 'label';
        label.textContent = node.name;
        row.appendChild(label);

        if (node.isSeq) {
            var sub = document.createElement('span');
            sub.className = 'sub';
            sub.textContent = formatSeqMeta(node);
            row.appendChild(sub);
            node.__seqIndex = state.seqList.length;
            node.__rootName = opts.rootName || node.name;
            state.seqList.push(node);
            state.rowOf[node.path] = row;
        }

        // 根節點：移除按鈕
        if (opts.isRoot) {
            var rm = document.createElement('span');
            rm.className = 'rm';
            rm.title = t('removeRoot');
            Icons.into(rm, 'close');
            rm.addEventListener('mousedown', function (e) { e.stopPropagation(); });
            rm.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                removeRoot(node.path);
            });
            row.appendChild(rm);
        }

        var childBox = null;
        if (hasKids) {
            childBox = document.createElement('div');
            childBox.className = 'children';
            for (var i = 0; i < node.children.length; i++)
                childBox.appendChild(renderNode(node.children[i], depth + 1, { rootName: opts.rootName }));
        }

        function toggle() {
            if (!childBox) return;
            var open = childBox.classList.toggle('open');
            tw.classList.toggle('open', open);
        }
        tw.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
        row.addEventListener('click', function () {
            if (node.isSeq) selectSeq(node.__seqIndex);
            else toggle();
        });
        row.addEventListener('dblclick', function () {
            if (node.isSeq) importSeq(node.__seqIndex);
        });

        wrap.appendChild(row);
        if (childBox) wrap.appendChild(childBox);
        node.__wrap = wrap; node.__childBox = childBox; node.__tw = tw;
        return wrap;
    }

    function setAllExpanded(open) {
        var boxes = els.tree.querySelectorAll('.children');
        var tws = els.tree.querySelectorAll('.tw:not(.leaf)');
        for (var i = 0; i < boxes.length; i++) boxes[i].classList.toggle('open', open);
        for (var j = 0; j < tws.length; j++) tws[j].classList.toggle('open', open);
    }

    function expandTo(node) {
        var p = node.__wrap ? node.__wrap.parentNode : null;
        while (p && p !== els.tree) {
            if (p.classList && p.classList.contains('children')) {
                p.classList.add('open');
                var prevRow = p.previousSibling;
                if (prevRow) { var tw = prevRow.querySelector('.tw'); if (tw) tw.classList.add('open'); }
            }
            p = p.parentNode;
        }
    }

    // ================= 搜尋過濾 =================
    function applyFilter() {
        var qstr = els.search.value.trim().toLowerCase();
        var nodes = els.tree.querySelectorAll('.node');
        if (!qstr) {
            for (var i = 0; i < nodes.length; i++) nodes[i].style.display = '';
            els.count.textContent = t('seqCount', { n: state.seqList.length });
            return;
        }
        for (var k = 0; k < nodes.length; k++) nodes[k].style.display = 'none';
        var matched = 0;
        for (var s = 0; s < state.seqList.length; s++) {
            var node = state.seqList[s];
            if (node.name.toLowerCase().indexOf(qstr) === -1) continue;
            matched++;
            var el = node.__wrap;
            while (el && el !== els.tree) {
                if (el.classList && el.classList.contains('node')) el.style.display = '';
                el = el.parentNode;
            }
            expandTo(node);
        }
        els.count.textContent = t('seqMatch', { m: matched, n: state.seqList.length });
    }

    // ================= 選取與播放 =================
    function highlight(idx) {
        for (var p in state.rowOf)
            if (state.rowOf.hasOwnProperty(p)) state.rowOf[p].classList.remove('active');
        var node = state.seqList[idx];
        if (node && state.rowOf[node.path]) {
            state.rowOf[node.path].classList.add('active');
            expandTo(node);
            try { state.rowOf[node.path].scrollIntoView({ block: 'nearest' }); } catch (e) {}
        }
    }

    // 重建後依 path 找回目前選取（不打斷播放）
    function relocateCurrent() {
        if (!state.currentPath) return;
        for (var i = 0; i < state.seqList.length; i++) {
            if (state.seqList[i].path === state.currentPath) {
                state.current = i; highlight(i); return;
            }
        }
        state.current = -1;
    }

    function selectSeq(idx) {
        if (idx < 0 || idx >= state.seqList.length) return;
        state.current = idx;
        var node = state.seqList[idx];
        state.currentPath = node.path;
        highlight(idx);
        els.name.textContent = node.name;
        updateSeqButtons(node);
        setStatus(t('loading', { name: node.name }));

        if (node.isGif) {
            onGif(node);
            return;
        }

        if (state.framesCache[node.path]) onFrames(node, state.framesCache[node.path]);
        else call('pngFrames', [node.path], function (ret) {
            if (ret.indexOf('ERR') === 0) { setStatus(errMsg(ret), 'err'); return; }
            var frames; try { frames = JSON.parse(ret); } catch (e) { setStatus(t('parseFail'), 'err'); return; }
            state.framesCache[node.path] = frames;
            onFrames(node, frames);
        });
    }

    function onGif(node) {
        stopPlay();
        state.frames = [];
        state.frameIdx = 0;
        state.imageCache = {};
        els.slider.disabled = true;
        els.play.disabled = true;
        els.prev.disabled = els.next.disabled = true;
        els.frame.src = fileURL(node.first);
        els.frame.style.display = 'block';
        els.empty.style.display = 'none';
        els.info.textContent = formatSeqMeta(node);
        setStatus(t('gifLoaded', { name: node.name }), 'ok');
    }

    function onFrames(node, frames) {
        stopPlay();
        state.frames = frames;
        state.frameIdx = 0;
        state.imageCache = {};
        els.slider.min = 0;
        els.slider.max = Math.max(0, frames.length - 1);
        els.slider.value = 0;
        els.slider.disabled = frames.length <= 1;
        els.play.disabled = frames.length <= 1;
        els.prev.disabled = els.next.disabled = frames.length <= 1;
        renderFrame(0);
        setStatus(t('seqLoaded', { name: node.name, n: frames.length }), 'ok');
        if (els.autoplay.checked && frames.length > 1) startPlay();
    }

    function preloadNear(idx) {
        if (!state.frames.length) return;
        var lo = Math.max(0, idx - PRELOAD_RADIUS);
        var hi = Math.min(state.frames.length - 1, idx + PRELOAD_RADIUS);
        for (var i = lo; i <= hi; i++) {
            var p = state.frames[i];
            if (!state.imageCache[p]) {
                var im = new Image();
                im.src = fileURL(p);
                state.imageCache[p] = im;
            }
        }
    }

    function renderFrame(idx) {
        if (!state.frames.length) return;
        if (idx < 0) idx = 0;
        if (idx >= state.frames.length) idx = state.frames.length - 1;
        state.frameIdx = idx;
        els.frame.src = fileURL(state.frames[idx]);
        els.frame.style.display = 'block';
        els.empty.style.display = 'none';
        els.slider.value = idx;
        els.info.textContent = t('frames', { i: idx + 1, n: state.frames.length });
        preloadNear(idx);
    }

    function tick() {
        var next = state.frameIdx + 1;
        if (next >= state.frames.length) next = 0;
        renderFrame(next);
    }
    function startPlay() {
        if (state.frames.length <= 1) return;
        var fps = parseFloat(els.fps.value) || 12; if (fps < 1) fps = 1;
        state.playing = true;
        Icons.setPlayButton(els.play, true);
        clearInterval(state.timer);
        state.timer = setInterval(tick, 1000 / fps);
    }
    function stopPlay() {
        state.playing = false;
        Icons.setPlayButton(els.play, false);
        clearInterval(state.timer); state.timer = null;
    }
    function togglePlay() { if (state.playing) stopPlay(); else startPlay(); }
    function frameStep(delta) {
        if (!state.frames.length) return;
        stopPlay();
        renderFrame(state.frameIdx + delta);
    }
    function seqStep(delta) {
        if (!state.seqList.length) return;
        var n = state.seqList.length;
        selectSeq(((state.current < 0 ? 0 : state.current) + delta + n) % n);
    }

    // ================= 匯入 =================
    function importSeq(idx) {
        if (idx == null) idx = state.current;
        var node = state.seqList[idx];
        if (!node) { setStatus(t('selectSeqFirst'), 'err'); return; }
        if (node.isGif) { setStatus(t('gifImportHint'), 'err'); return; }
        var fps = parseFloat(els.fps.value) || 0;
        var category = node.__rootName || '';
        var mode = els.importMode ? els.importMode.value : 'timeline';
        if (mode === 'project') {
            setStatus(t('importingProject'));
            call('pngImport', [node.first, node.name, fps, category], function (ret) {
                if (ret.indexOf('OK') === 0) setStatus(t('added', { msg: ret.slice(3) }), 'ok');
                else setStatus(errMsg(ret) || t('addFail'), 'err');
            });
            return;
        }
        var doLoop = els.autoloop && els.autoloop.checked;
        setStatus(t('adding'));
        call('pngAddToTimeline', [node.first, node.name, fps, category, doLoop], function (ret) {
            if (ret.indexOf('OK') === 0) setStatus(t('added', { msg: ret.slice(3) }), 'ok');
            else setStatus(errMsg(ret) || t('addFail'), 'err');
        });
    }

    function applyLoopToSelection() {
        setStatus(t('applyingLoop'));
        call('pngApplyLoop', [], function (ret) {
            if (ret.indexOf('OK') === 0) setStatus(I18n.hostOk(ret), 'ok');
            else setStatus(errMsg(ret) || t('loopFail'), 'err');
        });
    }

    function findRootIndexForPath(anyPath) {
        var np = normPath(anyPath);
        for (var i = 0; i < state.roots.length; i++) {
            if (np.indexOf(normPath(state.roots[i])) === 0) return i;
        }
        return -1;
    }

    function rescanRoot(idx, selectPath) {
        if (idx < 0 || idx >= state.roots.length) return;
        var path = state.roots[idx];
        call('pngTree', [path], function (ret) {
            if (ret.indexOf('ERR') === 0) { setStatus(errMsg(ret), 'err'); return; }
            var tree; try { tree = JSON.parse(ret); } catch (e) { return; }
            state.forest[idx] = tree;
            buildForest();
            if (selectPath) {
                for (var s = 0; s < state.seqList.length; s++) {
                    if (!state.seqList[s].isGif && state.seqList[s].path === selectPath) {
                        selectSeq(s); return;
                    }
                }
            }
        });
    }

    function convertGifToPng() {
        var node = state.seqList[state.current];
        if (!node || !node.isGif) return;
        var fps = parseFloat(els.fps.value) || 12;
        if (fps < 1) fps = 1;
        var rootIdx = findRootIndexForPath(node.path);

        function onSuccess(folderPath, nFrames) {
            delete state.framesCache[folderPath];
            var category = node.__rootName || '';
            var mode = els.importMode ? els.importMode.value : 'timeline';
            var doLoop = els.autoloop && els.autoloop.checked;

            function finishImport(importRet) {
                if (rootIdx >= 0) rescanRoot(rootIdx, folderPath);
                if (importRet && importRet.indexOf('OK') === 0) {
                    setStatus(t('gifConvertedImport', { n: nFrames, name: node.name, msg: importRet.slice(3) }), 'ok');
                } else if (importRet && importRet.indexOf('ERR') === 0) {
                    setStatus(t('gifConvertedNoImport', { n: nFrames, name: node.name, err: errMsg(importRet) }), 'err');
                } else {
                    setStatus(t('gifConverted', { n: nFrames, name: node.name }), 'ok');
                }
            }

            call('pngFrames', [folderPath], function (ret) {
                if (ret.indexOf('ERR') === 0) {
                    finishImport(null);
                    return;
                }
                var frames;
                try { frames = JSON.parse(ret); } catch (e) { finishImport(null); return; }
                if (!frames || !frames.length) { finishImport(null); return; }
                var first = frames[0];
                if (mode === 'project') {
                    call('pngImport', [first, node.name, fps, category], finishImport);
                } else {
                    call('pngAddToTimeline', [first, node.name, fps, category, doLoop], finishImport);
                }
            });
        }

        function parseGifResult(ret) {
            var body = ret.slice(3);
            var colon = body.lastIndexOf(':');
            var folderPath = colon >= 0 ? body.slice(0, colon) : body;
            var nFrames = colon >= 0 ? parseInt(body.slice(colon + 1), 10) : 0;
            onSuccess(folderPath, nFrames);
        }

        function shellFallback() {
            setStatus(t('convertGifViaFfmpeg', { name: node.name }));
            call('pngGifToSequence', [node.first, fps], function (ret) {
                if (ret.indexOf('ERR') === 0) {
                    setStatus(errMsg(ret) || t('gifConvertFail'), 'err');
                    return;
                }
                parseGifResult(ret);
            });
        }

        setStatus(t('convertingGif', { name: node.name }));

        if (typeof PngFfmpegExport !== 'undefined' && PngFfmpegExport.available()) {
            var ext = cs ? cs.getSystemPath(SystemPath.EXTENSION) : '';
            PngFfmpegExport.gifToSequence({
                gifPath: node.first,
                fps: fps,
                extPath: ext
            }, function (err, outDir, count) {
                if (err) {
                    shellFallback();
                    return;
                }
                onSuccess(outDir, count);
            });
        } else {
            shellFallback();
        }
    }

    // ================= 多根管理 =================
    function ensureRoot(path, cb) {
        if (!path) { if (cb) cb(false); return; }
        for (var i = 0; i < state.roots.length; i++) {
            if (normPath(state.roots[i]) === normPath(path)) {
                if (cb) cb(true);
                return;
            }
        }
        addRoot(path, cb, { quiet: true });
    }

    function addRoot(path, cb, opts) {
        opts = opts || {};
        if (!path) { if (cb) cb(false); return; }
        for (var i = 0; i < state.roots.length; i++)
            if (normPath(state.roots[i]) === normPath(path)) {
                if (!opts.quiet) setStatus(t('folderExists'), 'err');
                if (cb) cb(false);
                return;
            }
        if (!opts.quiet) setStatus(t('scanning', { path: path }));
        call('pngTree', [path], function (ret) {
            if (ret.indexOf('ERR') === 0) {
                if (!opts.quiet) setStatus(errMsg(ret), 'err');
                if (cb) cb(false);
                return;
            }
            var tree; try { tree = JSON.parse(ret); } catch (e) {
                if (!opts.quiet) setStatus(t('parseFail'), 'err');
                if (cb) cb(false);
                return;
            }
            state.roots.push(tree.path || path);
            state.forest.push(tree);
            if (opts.persist !== false) saveRoots();
            buildForest();
            if (!opts.quiet) setStatus(t('addedRoot', { name: tree.name, n: state.seqList.length }), 'ok');
            els.clear.disabled = false;
            if (state.current < 0 && state.seqList.length > 0) selectSeq(0);
            if (cb) cb(true);
        });
    }

    function removeRoot(path) {
        var idx = findRootIndex(path);
        if (idx === -1) return;
        var rootPath = state.roots[idx];
        var removedHasCurrent = state.currentPath &&
            (normPath(state.currentPath).indexOf(normPath(rootPath)) === 0);
        state.roots.splice(idx, 1);
        state.forest.splice(idx, 1);
        saveRoots();
        if (removedHasCurrent) { stopPlay(); state.current = -1; state.currentPath = ''; clearPreview(); }
        var rootNorm = normPath(rootPath);
        for (var k in state.selected) {
            if (state.selected.hasOwnProperty(k) && normPath(k).indexOf(rootNorm) === 0) delete state.selected[k];
        }
        buildForest();
        els.clear.disabled = state.roots.length === 0;
        setStatus(state.roots.length ? t('removedOne') : t('cleared'), '');
    }

    function clearAll() {
        stopPlay();
        state.roots = []; state.forest = []; state.seqList = [];
        state.current = -1; state.currentPath = '';
        state.selected = {};
        saveRoots();
        els.tree.innerHTML = '';
        els.count.textContent = t('seqCount', { n: 0 });
        clearPreview();
        updateRootLabel();
        els.clear.disabled = true;
        setStatus(t('clearedAll'));
    }

    function clearPreview() {
        state.frames = [];
        state.frameIdx = 0;
        state.imageCache = {};
        els.frame.style.display = 'none';
        els.empty.style.display = 'block';
        els.name.textContent = '—';
        els.info.textContent = t('frames', { i: 0, n: 0 });
        els.play.disabled = els.importBtn.disabled = els.slider.disabled = true;
        if (els.gifToPng) els.gifToPng.disabled = true;
        els.prev.disabled = els.next.disabled = true;
    }

    // 啟動時依序還原上次的資料夾（還原完成前不覆寫 localStorage，避免部分失敗時遺失路徑）
    function restoreRoots(done) {
        var saved = loadSavedRoots();
        if (!saved.length) {
            els.clear.disabled = true;
            restoreExportDirAsRoot(done);
            return;
        }
        setStatus(t('restoring', { n: saved.length }));
        var i = 0;
        var okCount = 0;
        (function nextOne() {
            if (i >= saved.length) {
                saveRoots(saved);
                updateRootLabel();
                if (state.seqList.length > 0) selectSeq(0);
                else if (okCount > 0) setStatus(t('ready'), '');
                else setStatus(t('restoreFail'), 'err');
                els.clear.disabled = state.roots.length === 0;
                restoreExportDirAsRoot(done);
                return;
            }
            addRoot(saved[i++], function (ok) {
                if (ok) okCount++;
                nextOne();
            }, { persist: false, quiet: true });
        })();
    }

    // 若自訂輸出資料夾（例如 GIF 資料夾）尚未在樹中，自動加入
    function restoreExportDirAsRoot(done) {
        var exportDir = loadExportDir();
        if (!exportDir) {
            if (done) done();
            return;
        }
        ensureRoot(exportDir, function () {
            if (done) done();
        });
    }

    function openFolderPicker(e) {
        if (e && e.shiftKey) { runDiag(); return; }

        // macOS：ExtendScript Folder.selectDialog（原生資料夾視窗，最穩）
        if (!IS_WIN) {
            pickFolderMac(function (path) {
                if (path) { addRoot(path); return; }
                setStatus(t('cancelled'));
            });
            return;
        }

        // Windows：cep.fs 原生對話框（與 BEN CODE 選圖相同 API）
        if (cepFsAvailable()) {
            setStatus(t('openingExplorer'));
            var cepPath = pickFolderCep();
            if (cepPath) { addRoot(cepPath); return; }
            setStatus(t('cancelled'));
            return;
        }

        // Windows 備用：ExtendScript PowerShell / HTML
        pickExplorer(function (path) {
            if (path && path.indexOf('ERR:') !== 0 && path.length > 0) {
                addRoot(path); return;
            }
            if (!path || path.length === 0) {
                setStatus(t('cancelled')); return;
            }
            var err = errMsg(path);
            setStatus(t('explorerErr', { err: err }), 'err');
            pickNativeFallback(function (root, reason) {
                if (root) { addRoot(root); return; }
                setStatus(t('cancelledReason', { reason: reason || 'none' }), 'err');
            });
        });
    }

    // ================= 事件 =================
    if (els.selectAll) {
        els.selectAll.addEventListener('change', function () { toggleSelectAll(els.selectAll.checked); });
    }
    if (els.exportAlpha) els.exportAlpha.addEventListener('click', exportSelectedAlpha);
    if (els.exportOutOpen) els.exportOutOpen.addEventListener('click', openExportFolder);
    if (els.exportOutPick) els.exportOutPick.addEventListener('click', pickExportFolder);
    if (els.exportOutReset) els.exportOutReset.addEventListener('click', resetExportFolder);
    if (els.gifToPng) els.gifToPng.addEventListener('click', convertGifToPng);
    els.pick.addEventListener('click', openFolderPicker);
    els.clear.addEventListener('click', clearAll);
    els.search.addEventListener('input', applyFilter);
    els.expandAll.addEventListener('click', function () { setAllExpanded(true); });
    els.collapseAll.addEventListener('click', function () { setAllExpanded(false); });
    els.play.addEventListener('click', togglePlay);
    els.prev.addEventListener('click', function () { frameStep(-1); });
    els.next.addEventListener('click', function () { frameStep(1); });
    els.slider.addEventListener('input', function () { stopPlay(); renderFrame(parseInt(els.slider.value, 10) || 0); });
    els.fps.addEventListener('change', function () { if (state.playing) { stopPlay(); startPlay(); } });
    if (els.importMode) els.importMode.addEventListener('change', updateImportUI);
    els.importBtn.addEventListener('click', function () { importSeq(state.current); });
    els.loopBtn.addEventListener('click', applyLoopToSelection);
    $('stage').addEventListener('dblclick', function () { if (state.current >= 0) importSeq(state.current); });

    document.addEventListener('keydown', function (e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); seqStep(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); seqStep(-1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); frameStep(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); frameStep(1); }
        else if (e.key === 'Enter') { e.preventDefault(); if (state.current >= 0) importSeq(state.current); }
        else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    });

    // 主題事件
    els.theme.addEventListener('click', function () {
        els.settings.style.display = (els.settings.style.display === 'none') ? 'flex' : 'none';
    });
    els.cAccent.addEventListener('input', onThemeChange);
    els.cAccent2.addEventListener('input', onThemeChange);
    els.cBg.addEventListener('input', onThemeChange);
    els.themeReset.addEventListener('click', function () {
        try { localStorage.removeItem(THEME_CUSTOM_KEY); localStorage.removeItem(THEME_KEY); } catch (e) {}
        applyHostTheme();
    });
    var swatches = els.settings.querySelectorAll('.swatch');
    for (var si = 0; si < swatches.length; si++) {
        swatches[si].addEventListener('click', function () {
            var t = { accent: this.getAttribute('data-a'), accent2: this.getAttribute('data-b'), bg: els.cBg.value };
            applyTheme(t); saveTheme(t);
            try { localStorage.setItem(THEME_CUSTOM_KEY, '1'); } catch (e) {}
        });
    }

    // 初始化
    initIcons();
    initLangSelect();
    if (!applyHostTheme()) applyTheme(DEFAULT_THEME);
    else {
        try {
            if (localStorage.getItem(THEME_CUSTOM_KEY) === '1') {
                var saved = loadTheme();
                if (saved) applyTheme(saved);
            }
        } catch (e) {}
    }
    if (cs && typeof CSInterface !== 'undefined') {
        cs.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, applyHostTheme);
    }
    applyLanguage();
    updateExportOutUI();
    setStatus(t('ready'));
    els.tree.innerHTML = '';
    els.count.textContent = t('seqCount', { n: 0 });
    updateRootLabel();
    initHost(restoreRoots);
})();
