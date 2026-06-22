/* PNG Seq Lite — 簡約版面板 */
(function () {
    'use strict';

    var STORAGE_KEY = 'pngseq.lite.roots.v1';
    var cs = (typeof CSInterface !== 'undefined') ? new CSInterface() : null;
    var $ = function (id) { return document.getElementById(id); };

    var els = {
        pick: $('pick'), folderInput: $('folderInput'), clear: $('clear'), root: $('root'),
        tree: $('tree'), count: $('count'), search: $('search'),
        frame: $('frame'), empty: $('empty'), name: $('name'), info: $('info'),
        slider: $('slider'), prev: $('prev'), play: $('play'), next: $('next'),
        fps: $('fps'), autoplay: $('autoplay'), autoloop: $('autoloop'), loopBtn: $('loop'),
        importBtn: $('import'), status: $('status')
    };

    var IS_WIN = /Win/i.test(navigator.platform) || /Windows/i.test(navigator.userAgent);

    var state = {
        roots: [], forest: [], seqList: [],
        current: -1, currentPath: '', rowOf: {},
        framesCache: {}, frames: [], frameIdx: 0, playing: false, timer: null
    };

    var ERR = {
        folder_not_found: '資料夾不存在',
        no_png: '找不到 PNG 序列',
        no_comp: '請先開啟合成',
        system_unavailable: '腳本系統不可用'
    };

    function errMsg(ret) {
        if (!ret || ret.indexOf('ERR:') !== 0) return ret || '未知錯誤';
        var code = ret.slice(4).split(':')[0];
        return ERR[code] || ret.slice(4);
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
        if (!cs) { setStatus('請在 After Effects 中使用', 'err'); return; }
        cs.evalScript(fn + '(' + (args || []).map(q).join(',') + ')',
            function (ret) { cb(String(ret == null ? '' : ret)); });
    }
    function normPath(p) {
        return String(p).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
    }
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
    function rootFromFileList(files) {
        if (!files || !files.length) return null;
        var f = files[0];
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
        return null;
    }

    function pickFolderNative(cb) {
        if (!els.folderInput) { cb(null, 'no-input'); return; }
        els.folderInput.value = '';
        var done = false, blurred = false;
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
                finish(null, 'cancel');
            }, 600);
        }
        els.folderInput.onchange = function () {
            finish(rootFromFileList(els.folderInput.files), 'ok');
        };
        window.addEventListener('blur', onBlur);
        window.addEventListener('focus', onWinFocus);
        try { els.folderInput.click(); } catch (e) { finish(null, 'err'); return; }
        var noDialogTimer = setTimeout(function () {
            if (done || blurred) return;
            finish(null, 'no-dialog');
        }, 2000);
    }

    function cepFsAvailable() {
        return !!(window.cep && window.cep.fs && typeof window.cep.fs.showOpenDialog === 'function');
    }

    function pickFolderCep() {
        var title = '選擇 PNG 序列資料夾';
        var fs = window.cep.fs;
        var result;
        try {
            if (typeof fs.showOpenDialogEx === 'function') {
                result = fs.showOpenDialogEx(false, true, title, '', [], '', IS_WIN ? 'Select Folder' : 'Open');
            } else {
                result = fs.showOpenDialog(false, true, title, '', []);
            }
        } catch (e) { return null; }
        if (result && result.data && result.data.length > 0) return result.data[0];
        return null;
    }

    function pickExplorer(cb) {
        setStatus('開啟資料夾…');
        call('pngPickFolder', ['選擇 PNG 序列資料夾', '選擇此資料夾'], cb);
    }

    function saveRoots() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.roots)); } catch (e) {}
    }
    function loadSavedRoots() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) || []) : [];
        } catch (e) { return []; }
    }

    function updateRootLabel() {
        if (state.roots.length === 0) {
            els.root.textContent = '尚未載入';
            els.root.title = '';
        } else {
            els.root.textContent = state.roots.length + ' 個資料夾';
            els.root.title = state.roots.join('\n');
        }
    }

    function buildForest() {
        state.rowOf = {};
        state.seqList = [];
        els.tree.innerHTML = '';
        var frag = document.createDocumentFragment();
        for (var i = 0; i < state.forest.length; i++) {
            frag.appendChild(renderNode(state.forest[i], 0, {
                isRoot: true, rootName: state.forest[i].name
            }));
        }
        els.tree.appendChild(frag);
        els.count.textContent = String(state.seqList.length);
        updateRootLabel();
        relocateCurrent();
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
        row.style.paddingLeft = (4 + depth * 12) + 'px';

        var hasKids = node.children && node.children.length > 0;
        var tw = document.createElement('span');
        tw.className = 'tw' + (hasKids ? '' : ' leaf');
        tw.textContent = '▶';
        row.appendChild(tw);

        var tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = opts.isRoot ? '根' : (node.isSeq ? '序' : '夾');
        row.appendChild(tag);

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

        if (opts.isRoot) {
            var rm = document.createElement('span');
            rm.className = 'rm';
            rm.textContent = '×';
            rm.title = '移除此資料夾';
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
            for (var i = 0; i < node.children.length; i++) {
                childBox.appendChild(renderNode(node.children[i], depth + 1, { rootName: opts.rootName }));
            }
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
        node.__wrap = wrap;
        return wrap;
    }

    function expandTo(node) {
        var p = node.__wrap ? node.__wrap.parentNode : null;
        while (p && p !== els.tree) {
            if (p.classList && p.classList.contains('children')) {
                p.classList.add('open');
                var prevRow = p.previousSibling;
                if (prevRow) {
                    var tw = prevRow.querySelector('.tw');
                    if (tw) tw.classList.add('open');
                }
            }
            p = p.parentNode;
        }
    }

    function applyFilter() {
        var qstr = els.search.value.trim().toLowerCase();
        var nodes = els.tree.querySelectorAll('.node');
        if (!qstr) {
            for (var i = 0; i < nodes.length; i++) nodes[i].style.display = '';
            els.count.textContent = String(state.seqList.length);
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
        els.count.textContent = matched + '/' + state.seqList.length;
    }

    function highlight(idx) {
        for (var p in state.rowOf) {
            if (state.rowOf.hasOwnProperty(p)) state.rowOf[p].classList.remove('active');
        }
        var node = state.seqList[idx];
        if (node && state.rowOf[node.path]) {
            state.rowOf[node.path].classList.add('active');
            expandTo(node);
            try { state.rowOf[node.path].scrollIntoView({ block: 'nearest' }); } catch (e) {}
        }
    }

    function relocateCurrent() {
        if (!state.currentPath) return;
        for (var i = 0; i < state.seqList.length; i++) {
            if (state.seqList[i].path === state.currentPath) {
                state.current = i;
                highlight(i);
                return;
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
        setStatus('載入 ' + node.name + '…');

        if (state.framesCache[node.path]) onFrames(node, state.framesCache[node.path]);
        else call('pngFrames', [node.path], function (ret) {
            if (ret.indexOf('ERR') === 0) { setStatus(errMsg(ret), 'err'); return; }
            var frames;
            try { frames = JSON.parse(ret); } catch (e) { setStatus('解析失敗', 'err'); return; }
            state.framesCache[node.path] = frames;
            onFrames(node, frames);
        });
    }

    function onFrames(node, frames) {
        stopPlay();
        state.frames = frames;
        state.frameIdx = 0;
        for (var f = 0; f < frames.length; f++) { var im = new Image(); im.src = fileURL(frames[f]); }
        els.slider.min = 0;
        els.slider.max = Math.max(0, frames.length - 1);
        els.slider.value = 0;
        els.slider.disabled = frames.length <= 1;
        els.play.disabled = frames.length <= 1;
        renderFrame(0);
        setStatus('已載入 ' + frames.length + ' 張', 'ok');
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
        els.info.textContent = (idx + 1) + ' / ' + state.frames.length;
    }

    function tick() {
        var next = state.frameIdx + 1;
        if (next >= state.frames.length) next = 0;
        renderFrame(next);
    }
    function startPlay() {
        if (state.frames.length <= 1) return;
        var fps = parseFloat(els.fps.value) || 12;
        if (fps < 1) fps = 1;
        state.playing = true;
        els.play.textContent = '暫停';
        clearInterval(state.timer);
        state.timer = setInterval(tick, 1000 / fps);
    }
    function stopPlay() {
        state.playing = false;
        els.play.textContent = '播放';
        clearInterval(state.timer);
        state.timer = null;
    }
    function togglePlay() { if (state.playing) stopPlay(); else startPlay(); }
    function step(delta) {
        if (!state.seqList.length) return;
        var n = state.seqList.length;
        selectSeq(((state.current < 0 ? 0 : state.current) + delta + n) % n);
    }

    function importSeq(idx) {
        if (idx == null) idx = state.current;
        var node = state.seqList[idx];
        if (!node) { setStatus('請先選取序列', 'err'); return; }
        var fps = parseFloat(els.fps.value) || 0;
        var category = node.__rootName || '';
        var doLoop = els.autoloop && els.autoloop.checked;
        setStatus('加入時間軸…');
        call('pngAddToTimeline', [node.first, node.name, fps, category, doLoop], function (ret) {
            if (ret.indexOf('OK') === 0) setStatus('已加入', 'ok');
            else setStatus(errMsg(ret) || '加入失敗', 'err');
        });
    }

    function applyLoopToSelection() {
        setStatus('套用 Loop…');
        call('pngApplyLoop', [], function (ret) {
            if (ret.indexOf('OK') === 0) setStatus('Loop 已套用', 'ok');
            else setStatus(errMsg(ret) || 'Loop 失敗', 'err');
        });
    }

    function addRoot(path, cb) {
        if (!path) { if (cb) cb(false); return; }
        for (var i = 0; i < state.roots.length; i++) {
            if (normPath(state.roots[i]) === normPath(path)) {
                setStatus('資料夾已存在', 'err');
                if (cb) cb(false);
                return;
            }
        }
        setStatus('掃描中…');
        call('pngTree', [path], function (ret) {
            if (ret.indexOf('ERR') === 0) { setStatus(errMsg(ret), 'err'); if (cb) cb(false); return; }
            var tree;
            try { tree = JSON.parse(ret); } catch (e) { setStatus('解析失敗', 'err'); if (cb) cb(false); return; }
            state.roots.push(path);
            state.forest.push(tree);
            saveRoots();
            buildForest();
            setStatus('已加入 ' + tree.name, 'ok');
            els.clear.disabled = false;
            if (state.current < 0 && state.seqList.length > 0) selectSeq(0);
            if (cb) cb(true);
        });
    }

    function removeRoot(path) {
        var idx = -1;
        for (var i = 0; i < state.roots.length; i++) {
            if (state.roots[i] === path) { idx = i; break; }
        }
        if (idx === -1) return;
        var removedHasCurrent = state.currentPath &&
            (normPath(state.currentPath).indexOf(normPath(path)) === 0);
        state.roots.splice(idx, 1);
        state.forest.splice(idx, 1);
        saveRoots();
        if (removedHasCurrent) { stopPlay(); state.current = -1; state.currentPath = ''; clearPreview(); }
        buildForest();
        els.clear.disabled = state.roots.length === 0;
        setStatus(state.roots.length ? '已移除' : '已清空');
    }

    function clearAll() {
        stopPlay();
        state.roots = [];
        state.forest = [];
        state.seqList = [];
        state.current = -1;
        state.currentPath = '';
        saveRoots();
        els.tree.innerHTML = '';
        els.count.textContent = '0';
        clearPreview();
        updateRootLabel();
        els.clear.disabled = true;
        setStatus('已清空全部');
    }

    function clearPreview() {
        els.frame.style.display = 'none';
        els.empty.style.display = 'block';
        els.name.textContent = '—';
        els.info.textContent = '0 / 0';
        els.play.disabled = els.importBtn.disabled = els.slider.disabled = true;
        els.prev.disabled = els.next.disabled = true;
    }

    function restoreRoots() {
        var saved = loadSavedRoots();
        if (!saved.length) { els.clear.disabled = true; return; }
        setStatus('還原 ' + saved.length + ' 個資料夾…');
        var i = 0;
        (function nextOne() {
            if (i >= saved.length) {
                if (state.seqList.length > 0) selectSeq(0);
                else setStatus('還原失敗', 'err');
                return;
            }
            addRoot(saved[i++], function () { nextOne(); });
        })();
    }

    function openFolderPicker() {
        if (cepFsAvailable()) {
            setStatus('開啟資料夾…');
            var path = pickFolderCep();
            if (path) { addRoot(path); return; }
            setStatus('已取消');
            return;
        }

        if (IS_WIN) {
            pickExplorer(function (path) {
                if (path && path.indexOf('ERR:') !== 0 && path.length > 0) {
                    addRoot(path);
                    return;
                }
                if (!path || path.length === 0) {
                    setStatus('已取消');
                    return;
                }
                setStatus(errMsg(path) + ' → 改用備用選取器', 'err');
                pickFolderNative(function (root) {
                    if (root) addRoot(root);
                });
            });
            return;
        }
        pickFolderNative(function (root) {
            if (root) { addRoot(root); return; }
            call('pngPickFolder', ['選擇 PNG 序列資料夾', '選擇此資料夾'], function (path) {
                if (!path) { setStatus('已取消'); return; }
                addRoot(path);
            });
        });
    }

    els.pick.addEventListener('click', openFolderPicker);
    els.clear.addEventListener('click', clearAll);
    els.search.addEventListener('input', applyFilter);
    els.play.addEventListener('click', togglePlay);
    els.prev.addEventListener('click', function () { step(-1); });
    els.next.addEventListener('click', function () { step(1); });
    els.slider.addEventListener('input', function () {
        stopPlay();
        renderFrame(parseInt(els.slider.value, 10) || 0);
    });
    els.fps.addEventListener('change', function () {
        if (state.playing) { stopPlay(); startPlay(); }
    });
    els.importBtn.addEventListener('click', function () { importSeq(state.current); });
    els.loopBtn.addEventListener('click', applyLoopToSelection);
    $('stage').addEventListener('dblclick', function () {
        if (state.current >= 0) importSeq(state.current);
    });

    document.addEventListener('keydown', function (e) {
        if (e.target && e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
        else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    });

    setStatus('就緒');
    restoreRoots();
})();
