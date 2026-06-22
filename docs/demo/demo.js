/* PNG Sequence Preview — Browser interactive demo (no AE required) */
(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };

    var els = {
        langSelect: $('langSelect'),
        pick: $('pick'), folderInput: $('folderInput'), clear: $('clear'), root: $('root'), tree: $('tree'), count: $('count'),
        search: $('search'), expandAll: $('expandAll'), collapseAll: $('collapseAll'),
        frame: $('frame'), empty: $('empty'), name: $('name'), info: $('info'),
        slider: $('slider'), prev: $('prev'), play: $('play'), next: $('next'),
        fps: $('fps'), autoplay: $('autoplay'), autoloop: $('autoloop'), loopBtn: $('loop'),
        importMode: $('importMode'), importBtn: $('import'), gifToPng: $('gifToPng'), status: $('status'),
        selectAll: $('selectAll'), selectedCount: $('selectedCount'), exportAlpha: $('exportAlpha'),
        exportOutPath: $('exportOutPath'), exportOutReset: $('exportOutReset'),
        theme: $('theme'), settings: $('settings'),
        toast: $('demoToast')
    };

    var state = {
        roots: [],
        forest: [],
        seqList: [],
        current: -1,
        rowOf: {},
        playing: false,
        timer: null,
        selected: {},
        filter: '',
        objectUrls: []
    };

    function t(key, vars) { return I18n.t(key, vars); }

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

    function naturalCmp(a, b) {
        return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
    }

    function toast(msg, type) {
        if (!els.toast) return;
        els.toast.textContent = msg;
        els.toast.className = 'demo-toast show' + (type === 'err' ? ' err' : '');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () {
            els.toast.classList.remove('show');
        }, 3200);
    }

    function setStatus(msg, type) {
        els.status.textContent = msg;
        els.status.className = 'status' + (type ? ' ' + type : '');
    }

    function trackUrl(url) {
        if (url && url.indexOf('blob:') === 0) state.objectUrls.push(url);
    }

    function revokeObjectUrls() {
        state.objectUrls.forEach(function (u) {
            try { URL.revokeObjectURL(u); } catch (e) {}
        });
        state.objectUrls = [];
    }

    function makeFrameCanvas(w, h, hue, idx, total, label) {
        w = w || 400;
        h = h || 300;
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        var i, x, y;
        for (y = 0; y < h; y += 16) {
            for (x = 0; x < w; x += 16) {
                ctx.fillStyle = ((x + y) / 16 % 2) ? '#2a2a2a' : '#222';
                ctx.fillRect(x, y, 16, 16);
            }
        }
        var t = total > 1 ? idx / (total - 1) : 0;
        var cx = w * (0.25 + t * 0.5);
        var cy = h * 0.5;
        var r = Math.min(w, h) * (0.12 + 0.04 * Math.sin(idx * 0.8));
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(' + hue + ', 72%, 58%)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '600 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label + '  ' + (idx + 1) + '/' + total, w / 2, h - 18);
        return c.toDataURL('image/png');
    }

    function seqNode(name, path, frames, opts) {
        opts = opts || {};
        return {
            name: name,
            path: path,
            isSeq: true,
            isGif: !!opts.isGif,
            count: frames.length,
            w: opts.w || 400,
            h: opts.h || 300,
            first: frames[0],
            frames: frames,
            children: []
        };
    }

    function folderNode(name, path, children) {
        return {
            name: name,
            path: path,
            isSeq: false,
            isGif: false,
            count: 0,
            w: 0,
            h: 0,
            first: '',
            children: children || []
        };
    }

    function buildSampleForest() {
        var frames1 = [];
        var frames2 = [];
        var gifFrames = [];
        var i;
        for (i = 0; i < 10; i++) frames1.push(makeFrameCanvas(400, 300, 210, i, 10, 'light_003'));
        for (i = 0; i < 8; i++) frames2.push(makeFrameCanvas(400, 300, 28, i, 8, 'spark_fx'));
        for (i = 0; i < 6; i++) gifFrames.push(makeFrameCanvas(500, 281, 330, i, 6, 'demo_gif'));

        var root1 = folderNode('Demo_2dfxPack', 'demo://Demo_2dfxPack', [
            folderNode('effects', 'demo://Demo_2dfxPack/effects', [
                seqNode('light_003', 'demo://Demo_2dfxPack/effects/light_003', frames1),
                seqNode('spark_fx', 'demo://Demo_2dfxPack/effects/spark_fx', frames2)
            ])
        ]);

        var root2 = folderNode('Demo_GIF', 'demo://Demo_GIF', [
            seqNode('character_loop', 'demo://Demo_GIF/character_loop.gif', gifFrames, { isGif: true, w: 500, h: 281 })
        ]);

        return [
            { path: root1.path, tree: root1 },
            { path: root2.path, tree: root2 }
        ];
    }

    function parseUploadedFiles(fileList) {
        var map = {};
        var i, f, rel, parts, dir, name, lower;
        for (i = 0; i < fileList.length; i++) {
            f = fileList[i];
            rel = f.webkitRelativePath || f.name;
            lower = rel.toLowerCase();
            if (!(/\.png$/i.test(lower) || /\.gif$/i.test(lower))) continue;
            parts = rel.split('/');
            if (parts.length < 2) continue;
            dir = parts.slice(0, -1).join('/');
            name = parts[parts.length - 1];
            if (!map[dir]) map[dir] = [];
            map[dir].push({ file: f, name: name });
        }
        return map;
    }

    function buildTreeFromUpload(rootName, fileMap) {
        var seqDirs = Object.keys(fileMap).sort(naturalCmp);
        var seqChildren = [];
        var d, files, pngs, gifs, frames, url, node, isGif;

        for (d = 0; d < seqDirs.length; d++) {
            files = fileMap[seqDirs[d]].sort(function (a, b) { return naturalCmp(a.name, b.name); });
            pngs = files.filter(function (x) { return /\.png$/i.test(x.name); });
            gifs = files.filter(function (x) { return /\.gif$/i.test(x.name); });

            if (pngs.length) {
                frames = pngs.map(function (x) {
                    url = URL.createObjectURL(x.file);
                    trackUrl(url);
                    return url;
                });
                node = seqNode(
                    seqDirs[d].split('/').pop() || seqDirs[d],
                    'upload://' + rootName + '/' + seqDirs[d],
                    frames
                );
                seqChildren.push(node);
            }
            gifs.forEach(function (g) {
                url = URL.createObjectURL(g.file);
                trackUrl(url);
                node = seqNode(g.name.replace(/\.gif$/i, ''), 'upload://' + rootName + '/' + seqDirs[d] + '/' + g.name, [url], { isGif: true });
                seqChildren.push(node);
            });
        }

        if (!seqChildren.length) return null;

        var nested = {};
        seqChildren.forEach(function (s) {
            var rel = s.path.replace('upload://' + rootName + '/', '');
            var segs = rel.split('/');
            segs.pop();
            var folderPath = segs.join('/');
            if (!nested[folderPath]) nested[folderPath] = [];
            nested[folderPath].push(s);
        });

        function buildLevel(prefix) {
            var keys = Object.keys(nested).filter(function (k) {
                if (prefix) return k.indexOf(prefix + '/') === 0 && k.slice(prefix.length + 1).indexOf('/') === -1;
                return k.indexOf('/') === -1;
            }).sort(naturalCmp);
            var kids = [];
            keys.forEach(function (k) {
                var sub = buildLevel(k);
                var direct = nested[k] || [];
                kids.push(folderNode(k.split('/').pop(), 'upload://' + rootName + '/' + k, sub.concat(direct)));
            });
            if (!prefix) {
                Object.keys(nested).forEach(function (k) {
                    if (k.indexOf('/') === -1 && keys.indexOf(k) === -1) {
                        kids = kids.concat(nested[k]);
                    }
                });
            }
            return kids;
        }

        var flatRoot = seqChildren.filter(function (s) {
            return s.path.split('/').length <= 3;
        });
        var tree = folderNode(rootName, 'upload://' + rootName, buildLevel('').length ? buildLevel('') : seqChildren);
        if (!tree.children.length) tree.children = seqChildren;
        return tree;
    }

    function addRootFromTree(path, tree) {
        for (var i = 0; i < state.roots.length; i++) {
            if (normPath(state.roots[i]) === normPath(path)) {
                setStatus(t('folderExists'), 'err');
                return false;
            }
        }
        state.roots.push(path);
        state.forest.push(tree);
        buildForest();
        setStatus(t('addedRoot', { name: tree.name, n: state.seqList.length }), 'ok');
        els.clear.disabled = false;
        if (state.current < 0 && state.seqList.length) selectSeq(0);
        return true;
    }

    function loadSamples() {
        revokeObjectUrls();
        state.roots = [];
        state.forest = [];
        var samples = buildSampleForest();
        samples.forEach(function (s) {
            state.roots.push(s.path);
            state.forest.push(s.tree);
        });
        buildForest();
        updateRootLabel();
        els.clear.disabled = false;
        if (state.seqList.length) selectSeq(0);
        setStatus(t('ready'), 'ok');
    }

    function updateRootLabel() {
        var n = state.roots.length;
        var sq = state.seqList.length;
        if (!n && !sq) {
            els.root.textContent = t('noFolders');
            return;
        }
        var suffix = sq ? ' · ' + t('seqCount', { n: sq }) : '';
        if (n === 1 && state.forest[0]) {
            els.root.textContent = state.forest[0].name + suffix;
        } else {
            els.root.textContent = t('foldersLoaded', { n: n }) + suffix;
        }
    }

    function formatSeqMeta(node) {
        if (node.isGif) {
            var g = [];
            if (node.w && node.h) g.push(node.w + '×' + node.h);
            g.push('GIF');
            return '(' + g.join(' · ') + ')';
        }
        return '(' + node.count + ')';
    }

    function buildForest() {
        state.rowOf = {};
        state.seqList = [];
        els.tree.innerHTML = '';
        var frag = document.createDocumentFragment();
        for (var i = 0; i < state.forest.length; i++) {
            frag.appendChild(renderNode(state.forest[i], 0, {
                isRoot: true,
                rootName: state.forest[i].name
            }));
        }
        els.tree.appendChild(frag);
        els.count.textContent = t('seqCount', { n: state.seqList.length });
        updateRootLabel();
        applyFilter();
        updateSelectedUI();
        updatePreviewControls();
    }

    function renderNode(node, depth, opts) {
        opts = opts || {};
        var wrap = document.createElement('div');
        wrap.className = 'node';

        var hasKids = node.children && node.children.length > 0;
        var row = document.createElement('div');
        row.className = 'row' + (opts.isRoot ? ' root-row' : '');
        row.style.paddingLeft = (4 + depth * 12) + 'px';

        if (node.isSeq) {
            var chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.className = 'seq-chk';
            chk.checked = !!state.selected[node.path];
            chk.disabled = node.isGif;
            chk.addEventListener('click', function (e) { e.stopPropagation(); });
            chk.addEventListener('change', function () {
                if (chk.checked) state.selected[node.path] = true;
                else delete state.selected[node.path];
                updateSelectedUI();
            });
            row.appendChild(chk);
        } else {
            var sp = document.createElement('span');
            sp.className = 'seq-chk';
            sp.style.visibility = 'hidden';
            row.appendChild(sp);
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
            childBox.className = 'children open';
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

        wrap.appendChild(row);
        if (childBox) wrap.appendChild(childBox);
        return wrap;
    }

    function applyFilter() {
        state.filter = els.search.value.trim().toLowerCase();
        var wraps = els.tree.querySelectorAll('.node');
        var w, row, label, show;
        if (!state.filter) {
            for (w = 0; w < wraps.length; w++) wraps[w].style.display = '';
            els.count.textContent = t('seqCount', { n: state.seqList.length });
            return;
        }
        var shown = 0;
        state.seqList.forEach(function (s) {
            var match = s.name.toLowerCase().indexOf(state.filter) >= 0;
            if (match) shown++;
            row = state.rowOf[s.path];
            if (!row) return;
            var wrap = row.closest ? row.closest('.node') : row.parentElement;
            if (wrap) wrap.style.display = match ? '' : 'none';
        });
        for (w = 0; w < wraps.length; w++) {
            if (wraps[w].querySelector('.row.active, .row .sub')) continue;
            if (!wraps[w].querySelector('.seq-chk:not([style*="hidden"])')) {
                var lbl = wraps[w].querySelector('.label');
                if (lbl && lbl.textContent.toLowerCase().indexOf(state.filter) >= 0) {
                    wraps[w].style.display = '';
                }
            }
        }
        els.count.textContent = t('seqMatch', { m: shown, n: state.seqList.length });
    }

    function selectSeq(idx) {
        if (idx < 0 || idx >= state.seqList.length) return;
        stopPlay();
        state.current = idx;
        var node = state.seqList[idx];
        Object.keys(state.rowOf).forEach(function (p) {
            state.rowOf[p].classList.toggle('active', state.rowOf[p] === state.rowOf[node.path]);
        });
        els.name.textContent = node.name;
        if (node.isGif) {
            els.frame.src = node.frames[0];
            els.frame.style.display = 'block';
            els.empty.style.display = 'none';
            els.info.textContent = node.w + '×' + node.h + ' GIF';
            els.slider.disabled = true;
            els.slider.max = 0;
            els.slider.value = 0;
            setStatus(t('gifLoaded', { name: node.name }), 'ok');
        } else {
            els.slider.disabled = false;
            els.slider.max = Math.max(0, node.frames.length - 1);
            renderFrame(0, node);
            setStatus(node.name + ' — ' + t('frames', { i: 1, n: node.frames.length }), 'ok');
            if (els.autoplay.checked) startPlay();
        }
        updatePreviewControls();
    }

    function renderFrame(idx, node) {
        node = node || state.seqList[state.current];
        if (!node || node.isGif) return;
        idx = Math.max(0, Math.min(idx, node.frames.length - 1));
        node.__frameIdx = idx;
        els.frame.src = node.frames[idx];
        els.frame.style.display = 'block';
        els.empty.style.display = 'none';
        els.slider.value = idx;
        els.info.textContent = t('frames', { i: idx + 1, n: node.frames.length });
    }

    function startPlay() {
        var node = state.seqList[state.current];
        if (!node || node.isGif) return;
        stopPlay();
        state.playing = true;
        Icons.setPlayButton(els.play, true);
        var ms = 1000 / (parseFloat(els.fps.value) || 12);
        state.timer = setInterval(function () {
            var n = state.seqList[state.current];
            if (!n || n.isGif) return;
            var next = (n.__frameIdx || 0) + 1;
            if (next >= n.frames.length) next = 0;
            renderFrame(next, n);
        }, ms);
    }

    function stopPlay() {
        state.playing = false;
        if (state.timer) clearInterval(state.timer);
        state.timer = null;
        Icons.setPlayButton(els.play, false);
    }

    function togglePlay() {
        if (state.playing) stopPlay();
        else startPlay();
    }

    function frameStep(dir) {
        var node = state.seqList[state.current];
        if (!node || node.isGif) return;
        stopPlay();
        var idx = (node.__frameIdx || 0) + dir;
        if (idx < 0) idx = node.frames.length - 1;
        if (idx >= node.frames.length) idx = 0;
        renderFrame(idx, node);
    }

    function seqStep(dir) {
        if (!state.seqList.length) return;
        var n = state.current + dir;
        if (n < 0) n = state.seqList.length - 1;
        if (n >= state.seqList.length) n = 0;
        selectSeq(n);
    }

    function updatePreviewControls() {
        var node = state.current >= 0 ? state.seqList[state.current] : null;
        var on = !!node;
        els.play.disabled = !on || (node && node.isGif);
        els.prev.disabled = els.next.disabled = !on || (node && node.isGif);
        els.slider.disabled = !on || (node && node.isGif);
        els.importBtn.disabled = !on;
        if (els.gifToPng) els.gifToPng.disabled = !node || !node.isGif;
    }

    function updateSelectedUI() {
        var n = 0;
        state.seqList.forEach(function (s) {
            if (state.selected[s.path] && !s.isGif) n++;
        });
        if (els.selectedCount) els.selectedCount.textContent = String(n);
        if (els.exportAlpha) els.exportAlpha.disabled = n === 0;
        if (els.selectAll) {
            var total = state.seqList.filter(function (s) { return !s.isGif; }).length;
            els.selectAll.checked = total > 0 && n === total;
            els.selectAll.indeterminate = n > 0 && n < total;
        }
    }

    function removeRoot(path) {
        var idx = findRootIndex(path);
        if (idx === -1) return;
        if (state.current >= 0) {
            var cur = state.seqList[state.current];
            if (cur && normPath(cur.path).indexOf(normPath(state.roots[idx])) === 0) {
                stopPlay();
                state.current = -1;
                clearPreview();
            }
        }
        state.roots.splice(idx, 1);
        state.forest.splice(idx, 1);
        buildForest();
        els.clear.disabled = state.roots.length === 0;
        setStatus(state.roots.length ? t('removedOne') : t('cleared'), 'ok');
    }

    function clearAll() {
        stopPlay();
        revokeObjectUrls();
        state.roots = [];
        state.forest = [];
        state.seqList = [];
        state.current = -1;
        state.selected = {};
        els.tree.innerHTML = '';
        els.count.textContent = t('seqCount', { n: 0 });
        clearPreview();
        updateRootLabel();
        els.clear.disabled = true;
        setStatus(t('clearedAll'));
    }

    function clearPreview() {
        els.frame.style.display = 'none';
        els.frame.removeAttribute('src');
        els.empty.style.display = 'block';
        els.name.textContent = '—';
        els.info.textContent = t('frames', { i: 0, n: 0 });
        updatePreviewControls();
    }

    function simulateImport() {
        var node = state.seqList[state.current];
        if (!node) return;
        if (node.isGif) {
            toast(t('gifImportHint'), 'err');
            return;
        }
        var mode = els.importMode.value;
        var msg = mode === 'project' ? t('importProject') : t('import');
        toast('Demo · ' + msg + '：' + node.name + (els.autoloop.checked ? ' + Loop' : ''), 'ok');
        setStatus(t('ready'), 'ok');
    }

    function simulateGifConvert() {
        var node = state.seqList[state.current];
        if (!node || !node.isGif) return;
        var fps = parseFloat(els.fps.value) || 12;
        toast(t('convertingGif', { name: node.name }), 'ok');
        setTimeout(function () {
            var frames = [];
            var i;
            for (i = 0; i < 6; i++) frames.push(makeFrameCanvas(500, 281, 330, i, 6, node.name + '_png'));
            var converted = seqNode(node.name + '_png', node.path + '_png', frames);
            converted.__rootName = node.__rootName;
            var rootIdx = findRootIndex('demo://Demo_GIF') >= 0 ? findRootIndex('demo://Demo_GIF') : 0;
            if (state.forest[rootIdx]) state.forest[rootIdx].children.push(converted);
            buildForest();
            for (i = 0; i < state.seqList.length; i++) {
                if (state.seqList[i].path === converted.path) { selectSeq(i); break; }
            }
            var mode = els.importMode.value;
            setStatus(t('gifConvertedImport', {
                n: 6,
                name: node.name,
                msg: mode === 'timeline' ? ' → Demo timeline @ 0.00s' : ' → Demo project'
            }), 'ok');
            toast('Demo · GIF → PNG complete', 'ok');
        }, 700);
    }

    function simulateExportAlpha() {
        var nodes = state.seqList.filter(function (s) { return state.selected[s.path] && !s.isGif; });
        if (!nodes.length) return;
        toast(t('exportingAlpha', { i: 1, n: nodes.length, name: nodes[0].name }), 'ok');
        setTimeout(function () {
            setStatus(t('exportAlphaDone', { n: nodes.length }), 'ok');
            toast('Demo · ' + t('exportAlphaSaved', { path: nodes[0].name + '_alpha.mov' }), 'ok');
        }, 900);
    }

    function initLangSelect() {
        els.langSelect.innerHTML = '';
        I18n.LANGS.forEach(function (code) {
            var opt = document.createElement('option');
            opt.value = code;
            opt.textContent = I18n.LABELS[code];
            els.langSelect.appendChild(opt);
        });
        els.langSelect.value = I18n.getLang();
        els.langSelect.addEventListener('change', function () {
            I18n.setLang(els.langSelect.value);
            applyLanguage();
        });
    }

    function applyLanguage() {
        I18n.applyDOM();
        els.langSelect.value = I18n.getLang();
        updateRootLabel();
        updateSelectedUI();
        if (els.exportOutPath) {
            els.exportOutPath.textContent = t('exportOutBesideSeq');
            els.exportOutPath.title = t('exportOutBesideSeqHint');
        }
        var rms = els.tree.querySelectorAll('.rm');
        for (var r = 0; r < rms.length; r++) rms[r].title = t('removeRoot');
        Icons.setPlayButton(els.play, state.playing);
    }

    function initIcons() {
        function prep(btn, name) {
            if (!btn || btn.querySelector('.ico-svg')) return;
            var label = btn.querySelector('.btn-label');
            btn.insertBefore(Icons.create(name), label || btn.firstChild);
        }
        prep(els.pick, 'folder-plus');
        Icons.into(els.clear, 'trash');
        Icons.into(els.theme, 'palette');
        Icons.into(els.expandAll, 'expand');
        Icons.into(els.collapseAll, 'collapse');
        var sw = document.querySelector('.search-wrap');
        if (sw && !sw.querySelector('.ico-svg')) sw.insertBefore(Icons.create('search'), sw.firstChild);
        prep(els.exportAlpha, 'export');
        prep(els.gifToPng, 'gif');
        Icons.into(els.prev, 'chevron-left');
        Icons.into(els.next, 'chevron-right');
        Icons.setPlayButton(els.play, false);
        prep(els.loopBtn, 'loop');
        prep(els.importBtn, 'download');
    }

    function setAllExpanded(open) {
        els.tree.querySelectorAll('.children').forEach(function (c) {
            c.classList.toggle('open', open);
        });
        els.tree.querySelectorAll('.tw:not(.leaf)').forEach(function (t) {
            t.classList.toggle('open', open);
        });
    }

    function initEvents() {
        els.pick.addEventListener('click', function () {
            els.folderInput.value = '';
            els.folderInput.click();
        });
        els.folderInput.addEventListener('change', function () {
            var files = els.folderInput.files;
            if (!files || !files.length) return;
            var rootName = files[0].webkitRelativePath.split('/')[0] || 'Uploaded';
            var map = parseUploadedFiles(files);
            var tree = buildTreeFromUpload(rootName, map);
            if (!tree) {
                setStatus(t('parseFail'), 'err');
                return;
            }
            addRootFromTree('upload://' + rootName, tree);
        });
        els.clear.addEventListener('click', clearAll);
        els.search.addEventListener('input', applyFilter);
        els.expandAll.addEventListener('click', function () { setAllExpanded(true); });
        els.collapseAll.addEventListener('click', function () { setAllExpanded(false); });
        els.play.addEventListener('click', togglePlay);
        els.prev.addEventListener('click', function () { frameStep(-1); });
        els.next.addEventListener('click', function () { frameStep(1); });
        els.slider.addEventListener('input', function () {
            stopPlay();
            renderFrame(parseInt(els.slider.value, 10) || 0);
        });
        els.fps.addEventListener('change', function () {
            if (state.playing) { stopPlay(); startPlay(); }
        });
        els.importBtn.addEventListener('click', simulateImport);
        if (els.gifToPng) els.gifToPng.addEventListener('click', simulateGifConvert);
        if (els.exportAlpha) els.exportAlpha.addEventListener('click', simulateExportAlpha);
        if (els.selectAll) {
            els.selectAll.addEventListener('change', function () {
                var on = els.selectAll.checked;
                state.seqList.forEach(function (s) {
                    if (!s.isGif) {
                        if (on) state.selected[s.path] = true;
                        else delete state.selected[s.path];
                        if (s.__chk) s.__chk.checked = on;
                    }
                });
                updateSelectedUI();
            });
        }
        if (els.exportOutReset) {
            els.exportOutReset.addEventListener('click', function () {
                if (els.exportOutPath) {
                    els.exportOutPath.textContent = t('exportOutBesideSeq');
                    els.exportOutPath.title = t('exportOutBesideSeqHint');
                }
                toast('Demo · ' + t('exportOutResetDone'), 'ok');
            });
        }
        els.theme.addEventListener('click', function () {
            els.settings.style.display = els.settings.style.display === 'none' ? 'flex' : 'none';
        });
        document.addEventListener('keydown', function (e) {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); seqStep(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); seqStep(-1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); frameStep(-1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); frameStep(1); }
            else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
        });
    }

    function init() {
        initIcons();
        initLangSelect();
        applyLanguage();
        initEvents();
        loadSamples();
        toast('Demo mode — AE import / export are simulated', 'ok');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
