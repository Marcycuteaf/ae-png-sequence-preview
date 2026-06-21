/* PNG 序列預覽 — 面板主程式 (CEP / CEF JavaScript) */
(function () {
    'use strict';

    var STORAGE_KEY = 'pngseq.roots.v1';
    var THEME_KEY = 'pngseq.theme.v1';
    var DEFAULT_THEME = { accent: '#5b9dff', accent2: '#9a6cff', bg: '#232323' };
    var cs = (typeof CSInterface !== 'undefined') ? new CSInterface() : null;
    var $ = function (id) { return document.getElementById(id); };

    var els = {
        langSelect: $('langSelect'),
        pick: $('pick'), folderInput: $('folderInput'), clear: $('clear'), root: $('root'), tree: $('tree'), count: $('count'),
        search: $('search'), expandAll: $('expandAll'), collapseAll: $('collapseAll'),
        frame: $('frame'), empty: $('empty'), name: $('name'), info: $('info'),
        slider: $('slider'), prev: $('prev'), play: $('play'), next: $('next'),
        fps: $('fps'), autoplay: $('autoplay'), autoloop: $('autoloop'), loopBtn: $('loop'),
        importBtn: $('import'), status: $('status'),
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
        frames: [], frameIdx: 0, playing: false, timer: null
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
        if (els.search.value.trim()) applyFilter();
        else els.count.textContent = t('seqCount', { n: state.seqList.length });
        els.play.textContent = state.playing ? t('pause') : t('play');
        if (state.frames.length) {
            els.info.textContent = t('frames', { i: state.frameIdx + 1, n: state.frames.length });
        } else {
            els.info.textContent = t('frames', { i: 0, n: 0 });
        }
        var rms = els.tree.querySelectorAll('.rm');
        for (var r = 0; r < rms.length; r++) rms[r].title = t('removeRoot');
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

    function runDiag() {
        call('pngDiag', [], function (ret) {
            setStatus(ret.indexOf('OK:') === 0 ? t('diag', { info: ret.slice(3) }) : errMsg(ret), ret.indexOf('OK:') === 0 ? 'ok' : 'err');
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
        s.setProperty('--panel2', shade(t.bg, -8));
        s.setProperty('--line', shade(t.bg, 24));
        if (els.cAccent) els.cAccent.value = t.accent;
        if (els.cAccent2) els.cAccent2.value = t.accent2;
        if (els.cBg) els.cBg.value = t.bg;
    }
    function loadTheme() {
        try { var r = localStorage.getItem(THEME_KEY); return r ? JSON.parse(r) : null; }
        catch (e) { return null; }
    }
    function saveTheme(t) { try { localStorage.setItem(THEME_KEY, JSON.stringify(t)); } catch (e) {} }
    function currentTheme() {
        return { accent: els.cAccent.value, accent2: els.cAccent2.value, bg: els.cBg.value };
    }
    function onThemeChange() { var t = currentTheme(); applyTheme(t); saveTheme(t); }

    function updateRootLabel() {
        if (state.roots.length === 0) { els.root.textContent = t('noFolders'); els.root.title = ''; }
        else {
            els.root.textContent = t('foldersLoaded', { n: state.roots.length });
            els.root.title = state.roots.join('\n');
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
    }

    function renderNode(node, depth, opts) {
        opts = opts || {};
        var wrap = document.createElement('div');
        wrap.className = 'node';

        var row = document.createElement('div');
        row.className = 'row' + (opts.isRoot ? ' root-row' : '');
        row.style.paddingLeft = (6 + depth * 14) + 'px';

        var hasKids = node.children && node.children.length > 0;
        var tw = document.createElement('span');
        tw.className = 'tw' + (hasKids ? '' : ' leaf');
        tw.textContent = '▶';
        row.appendChild(tw);

        var ico = document.createElement('span');
        ico.className = 'ico';
        ico.textContent = opts.isRoot ? '🗂' : (node.isSeq ? '🎞' : '📁');
        row.appendChild(ico);

        var label = document.createElement('span');
        label.className = 'label';
        label.textContent = node.name;
        row.appendChild(label);

        if (node.isSeq) {
            var sub = document.createElement('span');
            sub.className = 'sub';
            sub.textContent = '(' + node.count + ')';
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
            rm.textContent = '✕';
            rm.title = t('removeRoot');
            rm.addEventListener('click', function (e) {
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
        els.importBtn.disabled = false;
        els.prev.disabled = els.next.disabled = state.seqList.length <= 1;
        setStatus(t('loading', { name: node.name }));

        if (state.framesCache[node.path]) onFrames(node, state.framesCache[node.path]);
        else call('pngFrames', [node.path], function (ret) {
            if (ret.indexOf('ERR') === 0) { setStatus(errMsg(ret), 'err'); return; }
            var frames; try { frames = JSON.parse(ret); } catch (e) { setStatus(t('parseFail'), 'err'); return; }
            state.framesCache[node.path] = frames;
            onFrames(node, frames);
        });
    }

    function onFrames(node, frames) {
        stopPlay();
        state.frames = frames; state.frameIdx = 0;
        for (var f = 0; f < frames.length; f++) { var im = new Image(); im.src = fileURL(frames[f]); }
        els.slider.min = 0;
        els.slider.max = Math.max(0, frames.length - 1);
        els.slider.value = 0;
        els.slider.disabled = frames.length <= 1;
        els.play.disabled = frames.length <= 1;
        renderFrame(0);
        setStatus(t('seqLoaded', { name: node.name, n: frames.length }), 'ok');
        if (els.autoplay.checked && frames.length > 1) startPlay();
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
    }

    function tick() {
        var next = state.frameIdx + 1;
        if (next >= state.frames.length) next = 0;
        renderFrame(next);
    }
    function startPlay() {
        if (state.frames.length <= 1) return;
        var fps = parseFloat(els.fps.value) || 12; if (fps < 1) fps = 1;
        state.playing = true; els.play.textContent = t('pause');
        clearInterval(state.timer);
        state.timer = setInterval(tick, 1000 / fps);
    }
    function stopPlay() {
        state.playing = false; els.play.textContent = t('play');
        clearInterval(state.timer); state.timer = null;
    }
    function togglePlay() { if (state.playing) stopPlay(); else startPlay(); }
    function step(delta) {
        if (!state.seqList.length) return;
        var n = state.seqList.length;
        selectSeq(((state.current < 0 ? 0 : state.current) + delta + n) % n);
    }

    // ================= 加入時間軸 =================
    function importSeq(idx) {
        if (idx == null) idx = state.current;
        var node = state.seqList[idx];
        if (!node) { setStatus(t('selectSeqFirst'), 'err'); return; }
        var fps = parseFloat(els.fps.value) || 0;
        var category = node.__rootName || '';
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

    // ================= 多根管理 =================
    function addRoot(path, cb) {
        if (!path) { if (cb) cb(false); return; }
        for (var i = 0; i < state.roots.length; i++)
            if (normPath(state.roots[i]) === normPath(path)) {
                setStatus(t('folderExists'), 'err'); if (cb) cb(false); return;
            }
        setStatus(t('scanning', { path: path }));
        call('pngTree', [path], function (ret) {
            if (ret.indexOf('ERR') === 0) { setStatus(errMsg(ret), 'err'); if (cb) cb(false); return; }
            var tree; try { tree = JSON.parse(ret); } catch (e) { setStatus(t('parseFail'), 'err'); if (cb) cb(false); return; }
            state.roots.push(path);
            state.forest.push(tree);
            saveRoots();
            buildForest();
            setStatus(t('addedRoot', { name: tree.name, n: state.seqList.length }), 'ok');
            els.clear.disabled = false;
            if (state.current < 0 && state.seqList.length > 0) selectSeq(0);
            if (cb) cb(true);
        });
    }

    function removeRoot(path) {
        var idx = -1;
        for (var i = 0; i < state.roots.length; i++) if (state.roots[i] === path) { idx = i; break; }
        if (idx === -1) return;
        var removedHasCurrent = state.currentPath &&
            (normPath(state.currentPath).indexOf(normPath(path)) === 0);
        state.roots.splice(idx, 1);
        state.forest.splice(idx, 1);
        saveRoots();
        if (removedHasCurrent) { stopPlay(); state.current = -1; state.currentPath = ''; clearPreview(); }
        buildForest();
        els.clear.disabled = state.roots.length === 0;
        setStatus(state.roots.length ? t('removedOne') : t('cleared'), '');
    }

    function clearAll() {
        stopPlay();
        state.roots = []; state.forest = []; state.seqList = [];
        state.current = -1; state.currentPath = '';
        saveRoots();
        els.tree.innerHTML = '';
        els.count.textContent = t('seqCount', { n: 0 });
        clearPreview();
        updateRootLabel();
        els.clear.disabled = true;
        setStatus(t('clearedAll'));
    }

    function clearPreview() {
        els.frame.style.display = 'none';
        els.empty.style.display = 'block';
        els.name.textContent = '—';
        els.info.textContent = t('frames', { i: 0, n: 0 });
        els.play.disabled = els.importBtn.disabled = els.slider.disabled = true;
        els.prev.disabled = els.next.disabled = true;
    }

    // 啟動時依序還原上次的資料夾
    function restoreRoots() {
        var saved = loadSavedRoots();
        if (!saved.length) { els.clear.disabled = true; return; }
        setStatus(t('restoring', { n: saved.length }));
        var i = 0;
        (function nextOne() {
            if (i >= saved.length) {
                if (state.seqList.length > 0) selectSeq(0);
                else setStatus(t('restoreFail'), 'err');
                return;
            }
            addRoot(saved[i++], function () { nextOne(); });
        })();
    }

    function openFolderPicker(e) {
        if (e && e.shiftKey) { runDiag(); return; }

        if (IS_WIN) {
            // Windows：優先 Explorer 大視窗
            pickExplorer(function (path) {
                if (path && path.indexOf('ERR:') !== 0 && path.length > 0) {
                    addRoot(path); return;
                }
                var err = (path && path.indexOf('ERR:') === 0) ? errMsg(path) : '';
                if (err) setStatus(t('explorerErr', { err: err }), 'err');
                else setStatus(t('explorerFallback'));
                pickNativeFallback(function (root, reason) {
                    if (root) { addRoot(root); return; }
                    setStatus(t('cancelledReason', { reason: reason || 'none' }), 'err');
                });
            });
            return;
        }
        // macOS
        pickNativeFallback(function (root) {
            if (root) { addRoot(root); return; }
            call('pngPickFolder', pickDialogArgs(), function (path) {
                if (!path) { setStatus(t('cancelled')); return; }
                addRoot(path);
            });
        });
    }

    // ================= 事件 =================
    els.pick.addEventListener('click', openFolderPicker);
    els.clear.addEventListener('click', clearAll);
    els.search.addEventListener('input', applyFilter);
    els.expandAll.addEventListener('click', function () { setAllExpanded(true); });
    els.collapseAll.addEventListener('click', function () { setAllExpanded(false); });
    els.play.addEventListener('click', togglePlay);
    els.prev.addEventListener('click', function () { step(-1); });
    els.next.addEventListener('click', function () { step(1); });
    els.slider.addEventListener('input', function () { stopPlay(); renderFrame(parseInt(els.slider.value, 10) || 0); });
    els.fps.addEventListener('change', function () { if (state.playing) { stopPlay(); startPlay(); } });
    els.importBtn.addEventListener('click', function () { importSeq(state.current); });
    els.loopBtn.addEventListener('click', applyLoopToSelection);
    $('stage').addEventListener('dblclick', function () { if (state.current >= 0) importSeq(state.current); });

    document.addEventListener('keydown', function (e) {
        if (e.target && e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
        else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    });

    // 主題事件
    els.theme.addEventListener('click', function () {
        els.settings.style.display = (els.settings.style.display === 'none') ? 'flex' : 'none';
    });
    els.cAccent.addEventListener('input', onThemeChange);
    els.cAccent2.addEventListener('input', onThemeChange);
    els.cBg.addEventListener('input', onThemeChange);
    els.themeReset.addEventListener('click', function () { applyTheme(DEFAULT_THEME); saveTheme(DEFAULT_THEME); });
    var swatches = els.settings.querySelectorAll('.swatch');
    for (var si = 0; si < swatches.length; si++) {
        swatches[si].addEventListener('click', function () {
            var t = { accent: this.getAttribute('data-a'), accent2: this.getAttribute('data-b'), bg: els.cBg.value };
            applyTheme(t); saveTheme(t);
        });
    }

    // 初始化
    initLangSelect();
    applyLanguage();
    applyTheme(loadTheme() || DEFAULT_THEME);
    setStatus(t('ready'));
    restoreRoots();
})();
