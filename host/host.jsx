// =====================================================================
//   PNG 序列預覽 — Host (ExtendScript)
//   負責：選擇資料夾、遞迴掃描 PNG 序列、導入 AE
//   回傳慣例：成功 "OK:..."，失敗 "ERR:..."
// =====================================================================

// ---- JSON 字串工具（ExtendScript 無內建 JSON）----
function __pngJstr(s) {
    s = String(s);
    var out = '"';
    for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (c === '"') out += '\\"';
        else if (c === '\\') out += '\\\\';
        else if (c === '\n') out += '\\n';
        else if (c === '\r') out += '\\r';
        else if (c === '\t') out += '\\t';
        else out += c;
    }
    return out + '"';
}

// 自然排序：img2 在 img10 之前
function __pngNat(a, b) {
    var re = /(\d+)|(\D+)/g, ax = [], bx = [], m;
    while ((m = re.exec(a)) !== null) ax.push(m[1] ? parseFloat(m[1]) : m[2]);
    re.lastIndex = 0;
    while ((m = re.exec(b)) !== null) bx.push(m[1] ? parseFloat(m[1]) : m[2]);
    var n = Math.min(ax.length, bx.length);
    for (var i = 0; i < n; i++) {
        var x = ax[i], y = bx[i];
        if (typeof x === 'number' && typeof y === 'number') { if (x !== y) return x - y; }
        else { var xs = String(x), ys = String(y); if (xs !== ys) return xs < ys ? -1 : 1; }
    }
    return ax.length - bx.length;
}

function __pngList(folder) {
    var files = folder.getFiles(function (f) {
        return (f instanceof File) && /\.png$/i.test(f.name);
    });
    if (!files) files = [];
    files.sort(function (a, b) { return __pngNat(a.name, b.name); });
    return files;
}

// 讀取 PNG 檔頭寬高（IHDR）
function __pngSize(file) {
    try {
        file.encoding = "BINARY";
        file.open("r");
        var bytes = file.read(24);
        file.close();
        if (!bytes || bytes.length < 24) return [0, 0];
        function bv(i) { return bytes.charCodeAt(i) & 0xff; }
        return [
            (bv(16) << 24) | (bv(17) << 16) | (bv(18) << 8) | bv(19),
            (bv(20) << 24) | (bv(21) << 16) | (bv(22) << 8) | bv(23)
        ];
    } catch (e) { return [0, 0]; }
}

// 遞迴序列化樹節點
function __pngNodeJSON(n) {
    var kids = [];
    for (var i = 0; i < n.children.length; i++) kids.push(__pngNodeJSON(n.children[i]));
    return '{' +
        '"name":' + __pngJstr(n.name) + ',' +
        '"path":' + __pngJstr(n.path) + ',' +
        '"isSeq":' + (n.isSeq ? 'true' : 'false') + ',' +
        '"count":' + n.count + ',' +
        '"w":' + n.w + ',' +
        '"h":' + n.h + ',' +
        '"first":' + __pngJstr(n.first) + ',' +
        '"children":[' + kids.join(',') + ']' +
        '}';
}

// 選擇資料夾，回傳 fsName 或空字串
function pngPickFolder() {
    try {
        var f = Folder.selectDialog("選擇含有 PNG 序列的資料夾");
        return f ? f.fsName : "";
    } catch (e) { return ""; }
}

// 掃描資料夾，回傳「巢狀樹」JSON（不含每格路徑，保持輕量）
function pngTree(rootPath) {
    try {
        var root = new Folder(rootPath);
        if (!root.exists) return "ERR:資料夾不存在";

        function node(folder) {
            var pngs = __pngList(folder);
            var isSeq = pngs.length > 0;
            var w = 0, h = 0, first = "";
            if (isSeq) { var sz = __pngSize(pngs[0]); w = sz[0]; h = sz[1]; first = pngs[0].fsName; }
            var subs = folder.getFiles(function (f) { return f instanceof Folder; });
            if (!subs) subs = [];
            subs.sort(function (a, b) { return __pngNat(a.name, b.name); });
            var kids = [];
            for (var i = 0; i < subs.length; i++) kids.push(node(subs[i]));
            return {
                name: decodeURI(folder.name),
                path: folder.fsName,
                isSeq: isSeq,
                count: pngs.length,
                w: w, h: h, first: first,
                children: kids
            };
        }

        return __pngNodeJSON(node(root));
    } catch (e) {
        return "ERR:" + e.toString();
    }
}

// 懶載入：回傳單一資料夾內排序後的 PNG 路徑陣列
function pngFrames(dir) {
    try {
        var folder = new Folder(dir);
        if (!folder.exists) return "ERR:資料夾不存在";
        var pngs = __pngList(folder);
        var arr = [];
        for (var i = 0; i < pngs.length; i++) arr.push(__pngJstr(pngs[i].fsName));
        return "[" + arr.join(",") + "]";
    } catch (e) {
        return "ERR:" + e.toString();
    }
}

// 依名稱在專案中尋找資料夾（FolderItem）
function __pngFindFolder(nm) {
    nm = String(nm);
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof FolderItem && it.name === nm) return it;
    }
    return null;
}

// 套用 loopOut 循環表達式到圖層
function __pngApplyLoop(layer) {
    layer.timeRemapEnabled = true;
    var tr = layer.property("ADBE Time Remapping");
    if (tr) tr.expression = 'loopOut("cycle")';
}

// 對目前合成中選取的圖層套用 Loop
function pngApplyLoop() {
    try {
        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) return "ERR:無作用中合成";
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0) return "ERR:請先選擇圖層";
        app.beginUndoGroup("Loop 表達式");
        for (var i = 0; i < sel.length; i++) __pngApplyLoop(sel[i]);
        app.endUndoGroup();
        return "OK:已套用 loopOut(cycle) × " + sel.length;
    } catch (err) {
        try { app.endUndoGroup(); } catch (e) {}
        return "ERR:" + err.toString();
    }
}

// 匯入序列 → 歸入分類資料夾 → 加到目前合成的 current time（可選 Loop）
function pngAddToTimeline(firstFrame, name, fps, category, applyLoop) {
    try {
        var f = new File(firstFrame);
        if (!f.exists) return "ERR:檔案不存在：" + firstFrame;
        if (!app || !app.project) return "ERR:找不到 AE 專案";

        app.beginUndoGroup("新增 PNG 序列到時間軸");

        // 匯入為序列
        var io = new ImportOptions(f);
        if (io.canImportAs(ImportAsType.FOOTAGE)) io.importAs = ImportAsType.FOOTAGE;
        io.sequence = true;
        io.forceAlphabetical = true;
        var item = app.project.importFile(io);
        if (name) item.name = String(name);
        var fr = parseFloat(fps);
        if (!isNaN(fr) && fr > 0) { try { item.mainSource.conformFrameRate = fr; } catch (e2) {} }

        // 分類資料夾（自動建立）
        if (category) {
            var folder = __pngFindFolder(category);
            if (!folder) folder = app.project.items.addFolder(String(category));
            item.parentFolder = folder;
        }

        // 加到目前合成的 current time
        var note = " → 專案（無作用中合成）";
        var comp = app.project.activeItem;
        var layer = null;
        if (comp && comp instanceof CompItem) {
            layer = comp.layers.add(item);
            try { layer.startTime = comp.time; } catch (e3) {}
            if (applyLoop === true || applyLoop === "true") {
                try { __pngApplyLoop(layer); note = " → 時間軸 @ " + comp.time.toFixed(2) + "s + Loop"; }
                catch (eLoop) { note = " → 時間軸 @ " + comp.time.toFixed(2) + "s"; }
            } else {
                note = " → 時間軸 @ " + comp.time.toFixed(2) + "s";
            }
        }

        app.endUndoGroup();
        return "OK:" + item.name + note;
    } catch (err) {
        try { app.endUndoGroup(); } catch (e4) {}
        return "ERR:" + err.toString();
    }
}

// 導入指定首幀為 PNG 序列（僅匯入專案）
function pngImport(firstFrame, name, fps) {
    try {
        var f = new File(firstFrame);
        if (!f.exists) return "ERR:檔案不存在：" + firstFrame;
        if (!app || !app.project) return "ERR:找不到 AE 專案";

        app.beginUndoGroup("導入 PNG 序列");
        var io = new ImportOptions(f);
        if (io.canImportAs(ImportAsType.FOOTAGE)) io.importAs = ImportAsType.FOOTAGE;
        io.sequence = true;
        io.forceAlphabetical = true;
        var item = app.project.importFile(io);
        if (name) item.name = String(name);
        var fr = parseFloat(fps);
        if (!isNaN(fr) && fr > 0) {
            try { item.mainSource.conformFrameRate = fr; } catch (e2) {}
        }
        app.endUndoGroup();
        return "OK:" + item.name;
    } catch (err) {
        try { app.endUndoGroup(); } catch (e3) {}
        return "ERR:" + err.toString();
    }
}
