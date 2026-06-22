// =====================================================================
//   PNG 序列預覽 — Host (ExtendScript)
// =====================================================================

var __pngExtRootPath = null;

function pngInit(extPath) {
    __pngExtRootPath = extPath ? String(extPath).replace(/[\\\/]+$/, "") : null;
    var ffmpeg = __pngFindFfmpeg();
    return "OK:ext=" + (__pngExtRootPath || "none") + ";ffmpeg=" + (ffmpeg || "none");
}

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

function __pngGifList(folder) {
    var files = folder.getFiles(function (f) {
        return (f instanceof File) && /\.gif$/i.test(f.name);
    });
    if (!files) files = [];
    files.sort(function (a, b) { return __pngNat(a.name, b.name); });
    return files;
}

// GIF 檔頭讀取寬高
function __pngGifSize(file) {
    try {
        file.encoding = "BINARY";
        file.open("r");
        var bytes = file.read(10);
        file.close();
        if (!bytes || bytes.length < 10) return [0, 0];
        if (bytes.substring(0, 3) !== "GIF") return [0, 0];
        function bv(i) { return bytes.charCodeAt(i) & 0xff; }
        return [bv(6) | (bv(7) << 8), bv(8) | (bv(9) << 8)];
    } catch (e) { return [0, 0]; }
}

function __pngGifLeaf(file) {
    var sz = __pngGifSize(file);
    var nm = file.name.replace(/\.gif$/i, "");
    try { nm = decodeURI(nm); } catch (e1) {}
    return {
        name: nm,
        path: file.fsName,
        isSeq: true,
        isGif: true,
        count: 0,
        w: sz[0], h: sz[1],
        first: file.fsName,
        children: []
    };
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
        '"isGif":' + (n.isGif ? 'true' : 'false') + ',' +
        '"count":' + n.count + ',' +
        '"w":' + n.w + ',' +
        '"h":' + n.h + ',' +
        '"first":' + __pngJstr(n.first) + ',' +
        '"children":[' + kids.join(',') + ']' +
        '}';
}

function __pngHostLog(msg) {
    try {
        var lf = new File(Folder.temp.fsName.replace(/\\/g, "/") + "/pngseq_host_log.txt");
        lf.open("a");
        lf.writeln(msg);
        lf.close();
    } catch (e) {}
}

// Windows：Explorer 大視窗（結果寫暫存檔 + 除錯日誌）
function pngPickFolderWindows(pickTitle, pickHint) {
    pickTitle = pickTitle ? String(pickTitle) : "Select folder containing PNG sequences";
    pickHint = pickHint ? String(pickHint) : "Select this folder";
    // PowerShell 字串跳脫
    pickTitle = pickTitle.replace(/'/g, "''");
    pickHint = pickHint.replace(/'/g, "''");
    var script = null, outFile = null, logFile = null;
    try {
        if (typeof system === "undefined" || !system.callSystem) {
            return "ERR:system_unavailable";
        }
        var tempDir = Folder.temp.fsName.replace(/\\/g, "/");
        outFile = new File(tempDir + "/pngseq_pick_out.txt");
        logFile = new File(tempDir + "/pngseq_pick_log.txt");
        if (outFile.exists) outFile.remove();
        if (logFile.exists) logFile.remove();

        var outPath = outFile.fsName.replace(/\\/g, "\\\\");
        var logPath = logFile.fsName.replace(/\\/g, "\\\\");

        script = new File(tempDir + "/pngseq_pick_folder.ps1");
        script.encoding = "UTF-8";
        script.open("w");
        script.writeln("$outFile = '" + outPath + "'");
        script.writeln("$logFile = '" + logPath + "'");
        script.writeln("function Log([string]$m) { Add-Content -Path $logFile -Value $m -Encoding UTF8 }");
        script.writeln("Log '=== pngseq folder picker start ==='");
        script.writeln("try {");
        script.writeln("  Add-Type -AssemblyName System.Windows.Forms");
        script.writeln("  Add-Type -AssemblyName System.Drawing");
        script.writeln("  Add-Type @'");
        script.writeln("using System;");
        script.writeln("using System.Runtime.InteropServices;");
        script.writeln("public class PngSeqWin {");
        script.writeln("  [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow();");
        script.writeln("}");
        script.writeln("public class Win32Window : System.Windows.Forms.IWin32Window {");
        script.writeln("  IntPtr _h;");
        script.writeln("  public Win32Window(IntPtr h) { _h = h; }");
        script.writeln("  public IntPtr Handle { get { return _h; } }");
        script.writeln("}");
        script.writeln("'@");
        script.writeln("  [System.Windows.Forms.Application]::EnableVisualStyles()");
        script.writeln("  $d = New-Object System.Windows.Forms.OpenFileDialog");
        script.writeln("  $d.Title = '" + pickTitle + "'");
        script.writeln("  $d.Filter = 'Folder|*.none'");
        script.writeln("  $d.ValidateNames = $false");
        script.writeln("  $d.CheckFileExists = $false");
        script.writeln("  $d.CheckPathExists = $true");
        script.writeln("  $d.FileName = '" + pickHint + "'");
        script.writeln("  $d.AutoUpgradeEnabled = $true");
        script.writeln("  if ($env:USERPROFILE) { $d.InitialDirectory = $env:USERPROFILE }");
        script.writeln("  Log 'ShowDialog (owner=foreground)...'");
        script.writeln("  $owner = New-Object Win32Window ([PngSeqWin]::GetForegroundWindow())");
        script.writeln("  $r = $d.ShowDialog($owner)");
        script.writeln("  if ($r -ne [System.Windows.Forms.DialogResult]::OK) {");
        script.writeln("    Log 'Retry ShowDialog without owner...'");
        script.writeln("    $r = $d.ShowDialog()");
        script.writeln("  }");
        script.writeln("  Log ('Dialog result: ' + $r)");
        script.writeln("  if ($r -eq [System.Windows.Forms.DialogResult]::OK) {");
        script.writeln("    $p = [System.IO.Path]::GetDirectoryName($d.FileName)");
        script.writeln("    Log ('Selected: ' + $p)");
        script.writeln("    if ($p) { [IO.File]::WriteAllText($outFile, $p, [Text.Encoding]::UTF8) }");
        script.writeln("  } else { Log 'User cancelled' }");
        script.writeln("} catch {");
        script.writeln("  Log ('ERROR: ' + $_.Exception.Message)");
        script.writeln("}");
        script.writeln("Log '=== end ==='");
        script.close();

        var ps1 = script.fsName.replace(/\//g, "\\");
        var cmd = 'powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + ps1 + '"';
        __pngHostLog("cmd: " + cmd);
        system.callSystem(cmd);

        var logText = "";
        if (logFile.exists) {
            logFile.open("r");
            logText = logFile.read();
            logFile.close();
        }
        if (outFile.exists) {
            outFile.open("r");
            var result = outFile.read().replace(/^\s+|\s+$/g, "").replace(/^\uFEFF/, "");
            outFile.close();
            if (result && result.length > 0) {
                var folder = new Folder(result);
                if (folder.exists) return folder.fsName;
                return "ERR:folder_not_found:" + result;
            }
        }
        if (logText.indexOf("ERROR:") >= 0) {
            return "ERR:" + logText.split("\n").join(" | ").substring(0, 200);
        }
        return "";
    } catch (e) {
        return "ERR:" + e.toString();
    } finally {
        if (script) { try { script.remove(); } catch (e2) {} }
    }
}

// 除錯：回傳環境資訊 + 最近一次選資料夾日誌
function pngDiag() {
    var hasSys = (typeof system !== "undefined" && system.callSystem);
    var pickLog = "";
    try {
        var lf = new File(Folder.temp.fsName.replace(/\\/g, "/") + "/pngseq_pick_log.txt");
        if (lf.exists) {
            lf.open("r");
            pickLog = lf.read();
            lf.close();
            if (pickLog.length > 400) pickLog = pickLog.substring(pickLog.length - 400);
            pickLog = pickLog.replace(/\r?\n/g, " | ");
        }
    } catch (e) {}
    return "OK:os=" + $.os +
        ";ae=" + app.name + " " + app.version +
        ";system=" + hasSys +
        ";ext=" + (__pngExtRootPath || (__pngExtRoot() ? __pngExtRoot().fsName : "none")) +
        ";ffmpeg=" + (__pngFindFfmpeg() || "none") +
        ";temp=" + (Folder.temp ? Folder.temp.fsName : "none") +
        ";pickLog=" + (pickLog || "none");
}

function pngFfmpegTest() {
    var ffmpeg = __pngFindFfmpeg();
    if (!ffmpeg) return "ERR:ffmpeg_not_found";
    var verFile = new File(Folder.temp.fsName + "/pngseq_ffver.txt");
    if (verFile.exists) try { verFile.remove(); } catch (e0) {}
    var cmd = __pngShellQuote(ffmpeg) + " -version > " + __pngShellQuote(verFile.fsName) + " 2>&1";
    var log = __pngExecShell(cmd);
    var ver = "";
    if (verFile.exists) {
        verFile.open("r");
        ver = verFile.read();
        verFile.close();
    }
    if (!ver) {
        return "ERR:ffmpeg_test_failed:" + String(log || "no version output").replace(/\r?\n/g, " ").substring(0, 300);
    }
    return "OK:ffmpeg=" + ffmpeg + ";ver=" + String(ver.split(/\r?\n/)[0]).substring(0, 120);
}

// 在 Finder / Explorer 中開啟資料夾（不存在則建立）
function pngRevealFolder(folderPath) {
    try {
        if (typeof system === "undefined" || !system.callSystem) return "ERR:system_unavailable";
        var folder = new Folder(String(folderPath));
        if (!folder.exists) {
            if (!folder.create()) return "ERR:folder_not_found:" + folderPath;
        }
        var p = folder.fsName;
        if ($.os.indexOf("Windows") >= 0) {
            system.callSystem('explorer "' + String(p).replace(/"/g, '""') + '"');
        } else {
            system.callSystem("open " + __pngShellQuote(p));
        }
        return "OK:" + p;
    } catch (err) {
        return "ERR:" + err.toString();
    }
}

// 選擇資料夾，回傳 fsName 或空字串
function pngPickFolder(pickTitle, pickHint) {
    try {
        if ($.os.indexOf("Windows") >= 0) {
            return pngPickFolderWindows(pickTitle, pickHint);
        }
        var title = pickTitle ? String(pickTitle) : "Select folder containing PNG sequences";
        var f = Folder.selectDialog(title);
        return f ? f.fsName : "";
    } catch (e) { return ""; }
}

// 掃描資料夾，回傳「巢狀樹」JSON（不含每格路徑，保持輕量）
function pngTree(rootPath) {
    try {
        var root = new Folder(rootPath);
        if (!root.exists) return "ERR:folder_not_found";

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
            var gifs = __pngGifList(folder);
            for (var g = 0; g < gifs.length; g++) kids.push(__pngGifLeaf(gifs[g]));
            return {
                name: decodeURI(folder.name),
                path: folder.fsName,
                isSeq: isSeq,
                isGif: false,
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
        if (!folder.exists) return "ERR:folder_not_found";
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
        if (!(comp && comp instanceof CompItem)) return "ERR:no_active_comp";
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0) return "ERR:select_layer_first";
        app.beginUndoGroup("Loop");
        for (var i = 0; i < sel.length; i++) __pngApplyLoop(sel[i]);
        app.endUndoGroup();
        return "OK:loop:" + sel.length;
    } catch (err) {
        try { app.endUndoGroup(); } catch (e) {}
        return "ERR:" + err.toString();
    }
}

// 將素材加到目前合成時間軸的 current time
function __pngPlaceOnTimeline(item, applyLoop) {
    var note = " → 專案（無作用中合成）";
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        var layer = comp.layers.add(item);
        try { layer.startTime = comp.time; } catch (e) {}
        if (applyLoop === true || applyLoop === "true") {
            try {
                __pngApplyLoop(layer);
                note = " → 時間軸 @ " + comp.time.toFixed(2) + "s + Loop";
            } catch (eLoop) {
                note = " → 時間軸 @ " + comp.time.toFixed(2) + "s";
            }
        } else {
            note = " → 時間軸 @ " + comp.time.toFixed(2) + "s";
        }
    }
    return note;
}

// 匯入序列 → 歸入分類資料夾 → 加到目前合成的 current time（可選 Loop）
function pngAddToTimeline(firstFrame, name, fps, category, applyLoop) {
    try {
        var f = new File(firstFrame);
        if (!f.exists) return "ERR:file_not_found:" + firstFrame;
        if (!app || !app.project) return "ERR:no_project";

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
        var note = __pngPlaceOnTimeline(item, applyLoop);

        app.endUndoGroup();
        return "OK:" + item.name + note;
    } catch (err) {
        try { app.endUndoGroup(); } catch (e4) {}
        return "ERR:" + err.toString();
    }
}

// 導入指定首幀為 PNG 序列（僅匯入專案）
function pngImport(firstFrame, name, fps, category) {
    try {
        var f = new File(firstFrame);
        if (!f.exists) return "ERR:file_not_found:" + firstFrame;
        if (!app || !app.project) return "ERR:no_project";

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
        if (category) {
            var folder = __pngFindFolder(category);
            if (!folder) folder = app.project.items.addFolder(String(category));
            item.parentFolder = folder;
        }
        app.endUndoGroup();
        return "OK:" + item.name + " → 專案";
    } catch (err) {
        try { app.endUndoGroup(); } catch (e3) {}
        return "ERR:" + err.toString();
    }
}

// 擴充功能根目錄（host/host.jsx 的上層）
function __pngExtRoot() {
    if (__pngExtRootPath) return new Folder(__pngExtRootPath);
    try {
        var here = File($.fileName);
        if (here && here.exists) return here.parent.parent;
    } catch (e) { return null; }
    return null;
}

// 尋找 ffmpeg：系統 PATH 優先（AE 下較穩），其次擴充功能內建 bin/
function __pngFindFfmpeg() {
    if (typeof system === "undefined" || !system.callSystem) return null;
    var isWin = $.os.indexOf("Windows") >= 0;
    var paths = isWin ? [] : [
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg"
    ];
    var i, f, out;
    for (i = 0; i < paths.length; i++) {
        f = new File(paths[i]);
        if (f.exists) return f.fsName;
    }
    try {
        out = system.callSystem(isWin ? "where ffmpeg 2>nul" : "command -v ffmpeg 2>/dev/null");
        if (out) {
            out = String(out).replace(/^\s+|\s+$/g, "").split(/\r?\n/)[0];
            if (out.length > 0) return out;
        }
    } catch (e) {}
    var root = __pngExtRoot();
    if (root) {
        var rel = isWin ? "/bin/win/ffmpeg.exe" : "/bin/macos/ffmpeg";
        var bundled = new File(root.fsName + rel);
        if (bundled.exists) {
            if (!isWin) {
                try {
                    system.callSystem("xattr -cr " + __pngShellQuote(bundled.fsName) + " 2>/dev/null");
                    system.callSystem("chmod +x " + __pngShellQuote(bundled.fsName));
                } catch (e0) {}
            }
            return bundled.fsName;
        }
    }
    return null;
}

function __pngShellQuote(p) {
    p = String(p);
    if ($.os.indexOf("Windows") >= 0) return '"' + p.replace(/"/g, '""') + '"';
    return "'" + p.replace(/'/g, "'\\''") + "'";
}

function __pngConcatEsc(p) {
    return String(p).replace(/\\/g, "/").replace(/'/g, "'\\''");
}

// 依自然排序建立 ffconcat 清單（每格 duration = 1/fps）
function __pngWriteConcatList(folder, fps) {
    var pngs = __pngList(folder);
    if (!pngs.length) return null;
    var dur = 1.0 / fps;
    var listFile = new File(Folder.temp.fsName + "/pngseq_concat_" + (new Date().getTime()) + ".ffconcat");
    listFile.encoding = "UTF-8";
    listFile.open("w");
    listFile.writeln("ffconcat version 1.0");
    var i;
    for (i = 0; i < pngs.length; i++) {
        listFile.writeln("file '" + __pngConcatEsc(pngs[i].fsName) + "'");
        listFile.writeln("duration " + dur);
    }
    // 最後一格需重複一次，concat demuxer 才會正確顯示最終幀
    listFile.writeln("file '" + __pngConcatEsc(pngs[pngs.length - 1].fsName) + "'");
    listFile.close();
    return listFile;
}

function __pngShellPreamble() {
    var lines = "export LANG=en_US.UTF-8\nexport LC_ALL=en_US.UTF-8\n";
    if ($.os.indexOf("Windows") >= 0) return lines;
    var root = __pngExtRoot();
    if (!root) return lines;
    var bundled = new File(root.fsName + "/bin/macos/ffmpeg");
    if (bundled.exists) {
        var libDir = new Folder(root.fsName + "/bin/macos/lib");
        if (libDir.exists) {
            lines += "export DYLD_LIBRARY_PATH=" + __pngShellQuote(libDir.fsName) + ":$DYLD_LIBRARY_PATH\n";
        }
    }
    return lines;
}

// 執行 shell 指令（macOS 用 UTF-8 bash，避免 Unicode 路徑問題）
function __pngExecShell(cmdLine) {
    var logFile = new File(Folder.temp.fsName + "/pngseq_ffmpeg_log.txt");
    if (logFile.exists) try { logFile.remove(); } catch (e0) {}
    var isWin = $.os.indexOf("Windows") >= 0;
    var fullCmd = cmdLine + " 2>" + __pngShellQuote(logFile.fsName);
    if (isWin) {
        __pngHostLog("exec: " + fullCmd);
        system.callSystem(fullCmd);
    } else {
        var shFile = new File(Folder.temp.fsName + "/pngseq_run_" + (new Date().getTime()) + ".sh");
        shFile.encoding = "UTF-8";
        shFile.open("w");
        shFile.writeln("#!/bin/bash");
        shFile.writeln(__pngShellPreamble());
        shFile.writeln(fullCmd);
        shFile.close();
        system.callSystem("chmod +x " + __pngShellQuote(shFile.fsName));
        __pngHostLog("exec sh: " + shFile.fsName);
        system.callSystem("/bin/bash " + __pngShellQuote(shFile.fsName));
        try { shFile.remove(); } catch (eSh) {}
    }
    var log = "";
    if (logFile.exists) {
        logFile.encoding = "UTF-8";
        logFile.open("r");
        log = logFile.read();
        logFile.close();
    }
    return log;
}

// 用 bash cp 複製到 ASCII 暫存目錄（Unicode 路徑更可靠）
function __pngStageSequenceShell(folder) {
    var pngs = __pngList(folder);
    if (!pngs.length) return null;
    var staging = new Folder(Folder.temp.fsName + "/pngseq_in_" + (new Date().getTime()));
    var shFile = new File(Folder.temp.fsName + "/pngseq_stage_" + (new Date().getTime()) + ".sh");
    shFile.encoding = "UTF-8";
    shFile.open("w");
    shFile.writeln("#!/bin/bash");
    shFile.writeln(__pngShellPreamble());
    shFile.writeln("mkdir -p " + __pngShellQuote(staging.fsName));
    var i, num;
    for (i = 0; i < pngs.length; i++) {
        num = ("0000" + (i + 1)).slice(-4);
        shFile.writeln("cp " + __pngShellQuote(pngs[i].fsName) + " " +
            __pngShellQuote(staging.fsName + "/f_" + num + ".png"));
    }
    shFile.close();
    system.callSystem("chmod +x " + __pngShellQuote(shFile.fsName));
    system.callSystem("/bin/bash " + __pngShellQuote(shFile.fsName));
    try { shFile.remove(); } catch (eSh) {}
    var check = new File(staging.fsName + "/f_0001.png");
    if (!check.exists) return null;
    return {
        folder: staging,
        pattern: staging.fsName + "/f_%04d.png",
        count: pngs.length
    };
}

// 將 PNG 序列複製到 ASCII 暫存目錄（ExtendScript copy 備用）
function __pngStageSequence(folder) {
    var pngs = __pngList(folder);
    if (!pngs.length) return null;
    var staging = new Folder(Folder.temp.fsName + "/pngseq_in_" + (new Date().getTime()));
    if (!staging.exists) staging.create();
    var i, num, dest, copied;
    for (i = 0; i < pngs.length; i++) {
        num = ("0000" + (i + 1)).slice(-4);
        dest = new File(staging.fsName + "/f_" + num + ".png");
        if (dest.exists) try { dest.remove(); } catch (e0) {}
        copied = pngs[i].copy(dest);
        if (!copied || !dest.exists) return null;
    }
    return {
        folder: staging,
        pattern: staging.fsName + "/f_%04d.png",
        count: pngs.length
    };
}

function __pngCleanupFolder(folder) {
    if (!folder || !folder.exists) return;
    try {
        var files = folder.getFiles();
        if (files) {
            for (var i = 0; i < files.length; i++) {
                try { files[i].remove(); } catch (e1) {}
            }
        }
        folder.remove();
    } catch (e2) {}
}

function __pngClearFolder(folder) {
    if (!folder || !folder.exists) return;
    try {
        var files = folder.getFiles();
        if (files) {
            for (var i = 0; i < files.length; i++) {
                try { files[i].remove(); } catch (e) {}
            }
        }
    } catch (e2) {}
}

function __pngCopyPngsFromFolder(srcFolder, destFolder) {
    if (!destFolder.exists) destFolder.create();
    var pngs = __pngList(srcFolder);
    var i, destFile, copied = 0;
    for (i = 0; i < pngs.length; i++) {
        destFile = new File(destFolder.fsName + "/" + pngs[i].name);
        if (destFile.exists) try { destFile.remove(); } catch (e0) {}
        if (pngs[i].copy(destFile) && destFile.exists) copied++;
    }
    return copied;
}

function __pngEstimateGifFrames(footage, fr) {
    var n = 0, src;
    try {
        src = footage.mainSource;
        if (src && src.duration > 0) {
            if (src.frameRate > 0) n = Math.round(src.duration * src.frameRate);
            else n = Math.round(src.duration * fr);
        }
    } catch (e) {}
    if (n < 1 && footage.duration > 0) n = Math.max(1, Math.round(footage.duration * fr));
    if (n < 1) n = 1;
    return n;
}

function __pngShellWorkDir() {
    if ($.os.indexOf("Windows") >= 0) return Folder.temp.fsName;
    return "/tmp";
}

function __pngExportGifViaShell(gifFile, outFolder, fr) {
    if (typeof system === "undefined" || !system.callSystem) return 0;
    var ffmpeg = __pngFindFfmpeg();
    if (!ffmpeg) return 0;
    var isWin = $.os.indexOf("Windows") >= 0;
    var outPattern = isWin
        ? (outFolder.fsName + "\\frame_%04d.png")
        : (outFolder.fsName + "/frame_%04d.png");

    if (isWin) {
        __pngExecShell(
            __pngShellQuote(ffmpeg) + " -y -hide_banner -loglevel warning -i " +
            __pngShellQuote(gifFile.fsName) + " -filter:v fps=" + fr + " " +
            __pngShellQuote(outPattern)
        );
        var nWin = __pngList(outFolder).length;
        if (nWin === 0) {
            __pngExecShell(
                __pngShellQuote(ffmpeg) + " -y -hide_banner -loglevel warning -i " +
                __pngShellQuote(gifFile.fsName) + " " + __pngShellQuote(outPattern)
            );
            nWin = __pngList(outFolder).length;
        }
        return nWin;
    }

    var jobId = new Date().getTime();
    var workDir = __pngShellWorkDir();
    var shFile = new File(workDir + "/pngseq_gif_" + jobId + ".sh");
    var logFile = new File(workDir + "/pngseq_gif_" + jobId + ".log");
    if (logFile.exists) try { logFile.remove(); } catch (e0) {}
    shFile.encoding = "UTF-8";
    shFile.open("w");
    shFile.writeln("#!/bin/bash");
    shFile.writeln(__pngShellPreamble());
    shFile.writeln("OUT=" + __pngShellQuote(outFolder.fsName));
    shFile.writeln("LOG=" + __pngShellQuote(logFile.fsName));
    shFile.writeln("mkdir -p \"$OUT\"");
    shFile.writeln("F=" + __pngShellQuote(ffmpeg));
    shFile.writeln("run() { \"$F\" -y -hide_banner -loglevel warning \"$@\" 2>>\"$LOG\"; }");
    shFile.writeln("run -i " + __pngShellQuote(gifFile.fsName) + " -filter:v fps=" + fr + " \"$OUT/frame_%04d.png\" || \\");
    shFile.writeln("run -i " + __pngShellQuote(gifFile.fsName) + " \"$OUT/frame_%04d.png\" || true");
    shFile.close();
    system.callSystem("chmod +x " + __pngShellQuote(shFile.fsName));
    system.callSystem("/bin/bash " + __pngShellQuote(shFile.fsName));
    try { shFile.remove(); } catch (eSh) {}
    var n = __pngList(outFolder).length;
    if (n === 0 && logFile.exists) {
        __pngHostLog("gif ffmpeg: " + logFile.fsName);
    }
    try { logFile.remove(); } catch (eL) {}
    return n;
}

// ffmpeg → 含 Alpha 的 .mov（輸入：已 staging 的 ASCII pattern 或 concat 列表）
function __pngRunFfmpegAlpha(ffmpeg, inputSpec, outFile, fps) {
    var encoders = [
        "-c:v qtrle -pix_fmt rgba",
        "-c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le"
    ];
    var i, j, cmdLine, log, lastLog = "";
    for (i = 0; i < encoders.length; i++) {
        if (outFile.exists) try { outFile.remove(); } catch (eRm) {}
        if (inputSpec.type === "pattern") {
            cmdLine = __pngShellQuote(ffmpeg) +
                " -y -hide_banner -loglevel warning" +
                " -framerate " + fps +
                " -f image2 -start_number 1 -i " + __pngShellQuote(inputSpec.pattern) +
                " -r " + fps + " " + encoders[i] +
                " " + __pngShellQuote(outFile.fsName);
        } else {
            cmdLine = __pngShellQuote(ffmpeg) +
                " -y -hide_banner -loglevel warning" +
                " -f concat -safe 0 -i " + __pngShellQuote(inputSpec.path) +
                " -r " + fps + " " + encoders[i] +
                " " + __pngShellQuote(outFile.fsName);
        }
        log = __pngExecShell(cmdLine);
        if (log) lastLog = log;
        if (outFile.exists) return "OK";
    }
    return "ERR:ffmpeg_failed:" + String(lastLog || "no output").replace(/\r?\n/g, " ").substring(0, 400);
}

// GIF → PNG 序列（ffmpeg shell，Unicode 路徑安全）
function pngGifToSequence(gifPath, fps) {
    try {
        if (typeof system === "undefined" || !system.callSystem) return "ERR:system_unavailable";
        var gif = new File(gifPath);
        if (!gif.exists) return "ERR:file_not_found:" + gifPath;

        var fr = parseFloat(fps);
        if (isNaN(fr) || fr <= 0) fr = 12;
        var baseName = __pngSafeName(decodeURI(gif.name.replace(/\.gif$/i, "")));
        var outFolder = new Folder(gif.parent.fsName + "/" + baseName + "_png");
        if (!outFolder.exists) outFolder.create();
        __pngClearFolder(outFolder);

        var n = __pngExportGifViaShell(gif, outFolder, fr);
        if (n === 0) return "ERR:ffmpeg_failed:no png output";
        return "OK:" + outFolder.fsName + ":" + n;
    } catch (err) {
        return "ERR:" + err.toString();
    }
}

// 選擇 PNG 序列輸出模組範本
function __pngApplyPngSequenceOutputModule(om) {
    var templates = om.templates;
    if (!templates || !templates.length) return false;
    var prefer = [], i, t, low;
    for (i = 0; i < templates.length; i++) {
        t = String(templates[i]);
        low = t.toLowerCase();
        if (low.indexOf("png") >= 0 && low.indexOf("sequence") >= 0) prefer.push(t);
    }
    if (!prefer.length) {
        for (i = 0; i < templates.length; i++) {
            t = String(templates[i]);
            if (String(t).toLowerCase().indexOf("png") >= 0) prefer.push(t);
        }
    }
    if (!prefer.length) prefer = templates;
    for (i = 0; i < prefer.length; i++) {
        try {
            om.applyTemplate(prefer[i]);
            return true;
        } catch (e) {}
    }
    return false;
}

// 僅在可排隊狀態下修改 render 旗標（避免 DONE/RENDERING 時拋錯）
function __pngCanSetRenderFlag(rq) {
    try {
        var st = rq.status;
        return st === RQItemStatus.QUEUED ||
               st === RQItemStatus.UNQUEUED ||
               st === RQItemStatus.NEEDS_OUTPUT;
    } catch (e) { return false; }
}

function __pngSetRenderFlag(rq, val) {
    try {
        if (__pngCanSetRenderFlag(rq)) rq.render = val;
    } catch (e) {}
}

function __pngRenderOnlyQueueItem(rqItem) {
    var prevStates = [];
    var ri, rq;
    for (ri = 1; ri <= app.project.renderQueue.numItems; ri++) {
        rq = app.project.renderQueue.item(ri);
        if (rq === rqItem) {
            __pngSetRenderFlag(rq, true);
        } else if (__pngCanSetRenderFlag(rq)) {
            prevStates.push({ item: rq, render: rq.render });
            __pngSetRenderFlag(rq, false);
        }
    }
    try {
        app.project.renderQueue.render();
    } catch (eRender) {
        for (ri = 0; ri < prevStates.length; ri++) {
            __pngSetRenderFlag(prevStates[ri].item, prevStates[ri].render);
        }
        throw eRender;
    }
    for (ri = 0; ri < prevStates.length; ri++) {
        __pngSetRenderFlag(prevStates[ri].item, prevStates[ri].render);
    }
}

// GIF → PNG（ffmpeg shell，與 pngGifToSequence 相同）
function pngGifToSequenceAe(gifPath, fps) {
    return pngGifToSequence(gifPath, fps);
}

function __pngSafeName(s) {
    return String(s).replace(/[\\\/:\*\?"<>\|]/g, "_");
}

// 解析輸出資料夾：自訂路徑優先，否則序列旁 _AlphaExport
function __pngExportFolder(seqFolder, outDir) {
    var folder;
    outDir = outDir ? String(outDir).replace(/[\\\/]+$/, "") : "";
    if (outDir.length > 0) {
        folder = new Folder(outDir);
    } else {
        folder = new Folder(String(seqFolder).replace(/[\\\/]+$/, "") + "/_AlphaExport");
    }
    if (!folder.exists) folder.create();
    return folder;
}

// 選擇含 Alpha 的輸出模組範本（支援各語系 AE）
function __pngApplyAlphaOutputModule(om) {
    var templates = om.templates;
    if (!templates || !templates.length) return false;
    var prefer = [], i, t, low;
    for (i = 0; i < templates.length; i++) {
        t = String(templates[i]);
        low = t.toLowerCase();
        if (low.indexOf("alpha") >= 0 || low.indexOf("4444") >= 0 ||
            low.indexOf("lossless") >= 0 || t.indexOf("アルファ") >= 0 ||
            t.indexOf("可逆") >= 0) {
            prefer.push(t);
        }
    }
    if (!prefer.length) {
        for (i = 0; i < templates.length; i++) {
            t = String(templates[i]);
            low = t.toLowerCase();
            if (low.indexOf("animation") >= 0 || low.indexOf("qtrle") >= 0) prefer.push(t);
        }
    }
    if (!prefer.length) prefer = templates;
    for (i = 0; i < prefer.length; i++) {
        try {
            om.applyTemplate(prefer[i]);
            return true;
        } catch (e) {}
    }
    return false;
}

// AE 渲染佇列 → 指定或預設 _AlphaExport/
function pngRenderAlphaVideo(firstFrame, seqName, fps, category, outDir, addToTimeline, applyLoop) {
    var renderComp = null;
    var footage = null;
    var rqItem = null;
    try {
        if (!app || !app.project) return "ERR:no_project";
        var f = new File(firstFrame);
        if (!f.exists) return "ERR:file_not_found:" + firstFrame;
        var pngs = __pngList(f.parent);
        if (!pngs.length) return "ERR:folder_not_found";

        var fr = parseFloat(fps);
        if (isNaN(fr) || fr <= 0) fr = 24;
        seqName = String(seqName || "sequence");
        category = category ? String(category) : "";
        var safeName = __pngSafeName(seqName);
        var exportFolder = __pngExportFolder(f.parent.fsName, outDir);
        var outFile = new File(exportFolder.fsName + "/" + safeName + "_alpha.mov");
        if (outFile.exists) try { outFile.remove(); } catch (eRm) {}

        app.beginUndoGroup("PNG Seq Alpha Render");

        var io = new ImportOptions(f);
        if (io.canImportAs(ImportAsType.FOOTAGE)) io.importAs = ImportAsType.FOOTAGE;
        io.sequence = true;
        io.forceAlphabetical = true;
        footage = app.project.importFile(io);
        footage.name = safeName + "_src";
        try { footage.mainSource.conformFrameRate = fr; } catch (eFr) {}

        var w = footage.width, h = footage.height;
        if (!w || !h) {
            var sz = __pngSize(pngs[0]);
            w = sz[0]; h = sz[1];
        }
        var duration = Math.max(pngs.length / fr, 1 / fr);
        renderComp = app.project.items.addComp(safeName + "_alpha_render", w, h, 1, duration, fr);
        renderComp.layers.add(footage);

        rqItem = app.project.renderQueue.items.add(renderComp);
        var om = rqItem.outputModule(1);
        if (!__pngApplyAlphaOutputModule(om)) {
            app.endUndoGroup();
            return "ERR:render_template_failed";
        }
        om.file = outFile;

        __pngRenderOnlyQueueItem(rqItem);

        try { rqItem.remove(); } catch (eRq) {}
        try { renderComp.remove(); } catch (eRc) {}
        try { footage.remove(); } catch (eFt) {}

        if (!outFile.exists) return "ERR:render_failed:no output file";

        var vio = new ImportOptions(outFile);
        var finalItem = app.project.importFile(vio);
        finalItem.name = safeName + " (Alpha)";
        if (category) {
            var folder = __pngFindFolder(category);
            if (!folder) folder = app.project.items.addFolder(category);
            finalItem.parentFolder = folder;
        }

        var note = "";
        if (addToTimeline === true || addToTimeline === "true") {
            note = __pngPlaceOnTimeline(finalItem, applyLoop);
        }

        app.endUndoGroup();
        return "OK:" + finalItem.name + note + " @ " + fr + "fps → " + outFile.fsName;
    } catch (err) {
        try { if (rqItem) rqItem.remove(); } catch (e1) {}
        try { if (renderComp) renderComp.remove(); } catch (e2) {}
        try { if (footage) footage.remove(); } catch (e3) {}
        try { app.endUndoGroup(); } catch (e4) {}
        return "ERR:" + err.toString();
    }
}

// 匯入已輸出的 Alpha 影片到 AE 專案（可選加入時間軸）
function pngImportVideo(videoPath, name, category, addToTimeline, applyLoop) {
    try {
        if (!app || !app.project) return "ERR:no_project";
        var f = new File(videoPath);
        if (!f.exists) return "ERR:file_not_found:" + videoPath;
        app.beginUndoGroup("Import Alpha Video");
        var item = app.project.importFile(new ImportOptions(f));
        item.name = String(name || f.name);
        if (category) {
            var folder = __pngFindFolder(category);
            if (!folder) folder = app.project.items.addFolder(category);
            item.parentFolder = folder;
        }
        var note = "";
        if (addToTimeline === true || addToTimeline === "true") {
            note = __pngPlaceOnTimeline(item, applyLoop);
        }
        app.endUndoGroup();
        return "OK:" + item.name + note + " → " + f.fsName;
    } catch (err) {
        try { app.endUndoGroup(); } catch (e) {}
        return "ERR:" + err.toString();
    }
}

// 單一 bash 腳本：staging + ffmpeg → _AlphaExport/（ExtendScript 備用）
function __pngRunExportJob(ffmpeg, exportFolder, outFile, fps, pngs) {
    var jobId = new Date().getTime();
    var workDir = Folder.temp.fsName + "/pngseq_work_" + jobId;
    var resultFile = Folder.temp.fsName + "/pngseq_result_" + jobId + ".txt";
    var logFile = Folder.temp.fsName + "/pngseq_log_" + jobId + ".txt";
    var shFile = new File(Folder.temp.fsName + "/pngseq_export_" + jobId + ".sh");
    var i, num;

    if (!exportFolder.exists) exportFolder.create();
    shFile.encoding = "UTF-8";
    shFile.open("w");
    shFile.writeln("#!/bin/bash");
    shFile.writeln(__pngShellPreamble());
    shFile.writeln("WORKDIR=" + __pngShellQuote(workDir));
    shFile.writeln("EXPORTDIR=" + __pngShellQuote(exportFolder.fsName));
    shFile.writeln("OUTFILE=" + __pngShellQuote(outFile.fsName));
    shFile.writeln("RESULT=" + __pngShellQuote(resultFile));
    shFile.writeln("LOG=" + __pngShellQuote(logFile));
    shFile.writeln("mkdir -p \"$WORKDIR/input\" \"$EXPORTDIR\"");
    for (i = 0; i < pngs.length; i++) {
        num = ("0000" + (i + 1)).slice(-4);
        shFile.writeln("cp " + __pngShellQuote(pngs[i].fsName) +
            " \"$WORKDIR/input/f_" + num + ".png\"");
    }
    shFile.writeln("F=" + __pngShellQuote(ffmpeg));
    shFile.writeln("FPS=" + fps);
    shFile.writeln("run_enc() {");
    shFile.writeln("  \"$F\" -y -hide_banner -loglevel warning -framerate $FPS -f image2 -start_number 1 \\");
    shFile.writeln("    -i \"$WORKDIR/input/f_%04d.png\" -r $FPS \"$@\" \"$OUTFILE\" >> \"$LOG\" 2>&1");
    shFile.writeln("}");
    shFile.writeln("rm -f \"$OUTFILE\"");
    shFile.writeln("run_enc -c:v qtrle -pix_fmt rgba || true");
    shFile.writeln("if [ ! -s \"$OUTFILE\" ]; then rm -f \"$OUTFILE\"; run_enc -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le || true; fi");
    shFile.writeln("if [ -s \"$OUTFILE\" ]; then echo OK > \"$RESULT\"; else echo ERR: >> \"$RESULT\"; cat \"$LOG\" >> \"$RESULT\"; fi");
    shFile.writeln("rm -rf \"$WORKDIR\"");
    shFile.close();

    system.callSystem("chmod +x " + __pngShellQuote(shFile.fsName));
    system.callSystem("/bin/bash " + __pngShellQuote(shFile.fsName));

    var result = "";
    var rf = new File(resultFile);
    if (rf.exists) {
        rf.open("r");
        result = rf.read();
        rf.close();
        try { rf.remove(); } catch (eR) {}
    }
    try { shFile.remove(); } catch (eSh) {}
    if (String(result).indexOf("OK") === 0) return "OK";
    return "ERR:ffmpeg_failed:" + String(result || "no output").replace(/\r?\n/g, " ").substring(0, 400);
}

// ffmpeg 將 PNG 序列輸出為含 Alpha 的 .mov，再匯入 AE
function pngExportAlphaVideo(firstFrame, seqName, fps, category, outDir, addToTimeline, applyLoop) {
    try {
        if (!app || !app.project) return "ERR:no_project";
        if (typeof system === "undefined" || !system.callSystem) return "ERR:system_unavailable";

        var ffmpeg = __pngFindFfmpeg();
        if (!ffmpeg) return "ERR:ffmpeg_not_found";

        var f = new File(firstFrame);
        if (!f.exists) return "ERR:file_not_found:" + firstFrame;

        var fr = parseFloat(fps);
        if (isNaN(fr) || fr <= 0) fr = 24;
        seqName = String(seqName || "sequence");
        category = category ? String(category) : "";
        var safeName = __pngSafeName(seqName);
        var exportFolder = __pngExportFolder(f.parent.fsName, outDir);
        var outFile = new File(exportFolder.fsName + "/" + safeName + "_alpha.mov");
        var pngs = __pngList(f.parent);
        if (!pngs.length) return "ERR:folder_not_found";

        var run = __pngRunExportJob(ffmpeg, exportFolder, outFile, fr, pngs);
        if (run.indexOf("ERR:") === 0) return run;
        if (!outFile.exists) return "ERR:ffmpeg_failed:no output file";

        app.beginUndoGroup("PNG Seq Alpha Video (ffmpeg)");
        var vio = new ImportOptions(outFile);
        var finalItem = app.project.importFile(vio);
        var displayName = safeName + " (Alpha)";
        finalItem.name = displayName;

        if (category) {
            var folder = __pngFindFolder(category);
            if (!folder) folder = app.project.items.addFolder(category);
            finalItem.parentFolder = folder;
        }

        var note = "";
        if (addToTimeline === true || addToTimeline === "true") {
            note = __pngPlaceOnTimeline(finalItem, applyLoop);
        }

        app.endUndoGroup();
        return "OK:" + displayName + note + " @ " + fr + "fps → " + outFile.fsName;
    } catch (err) {
        try { app.endUndoGroup(); } catch (e3) {}
        return "ERR:" + err.toString();
    }
}
