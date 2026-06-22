/* ffmpeg Alpha 輸出 — CEP Node.js */
(function (global) {
    'use strict';

    var path, fs, cp, os;
    var nodeOk = false;
    var nodeErr = '';

    function bootNode() {
        if (nodeOk) return true;
        var req = null;
        try {
            if (typeof cep_node !== 'undefined' && cep_node.require) req = cep_node.require;
            else if (typeof require === 'function') req = require;
        } catch (e0) { nodeErr = String(e0); return false; }
        if (!req) { nodeErr = 'no require'; return false; }
        try {
            path = req('path');
            fs = req('fs');
            cp = req('child_process');
            os = req('os');
            nodeOk = true;
            nodeErr = '';
            return true;
        } catch (e1) {
            nodeErr = String(e1.message || e1);
            return false;
        }
    }

    bootNode();

    function pad4(n) {
        var s = String(n);
        while (s.length < 4) s = '0' + s;
        return s;
    }

    function safeName(s) {
        return String(s).replace(/[\\\/:*?"<>|]/g, '_');
    }

    function mkdirp(dir) {
        try {
            fs.mkdirSync(dir, { recursive: true });
        } catch (e) {
            if (e && e.code === 'EEXIST') return;
            var parent = path.dirname(dir);
            if (parent !== dir) {
                mkdirp(parent);
                fs.mkdirSync(dir);
            }
        }
    }

    function rmDir(dir) {
        try {
            if (fs.rmSync) {
                fs.rmSync(dir, { recursive: true, force: true });
                return;
            }
        } catch (e0) {}
        try {
            if (!fs.existsSync(dir)) return;
            var files = fs.readdirSync(dir);
            for (var i = 0; i < files.length; i++) {
                var p = path.join(dir, files[i]);
                if (fs.statSync(p).isDirectory()) rmDir(p);
                else fs.unlinkSync(p);
            }
            fs.rmdirSync(dir);
        } catch (e1) {}
    }

    function findFfmpeg(extPath) {
        if (!bootNode()) return null;
        var candidates = [];
        if (process.platform === 'darwin') {
            candidates.push('/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg');
        } else if (process.platform === 'win32') {
            candidates.push(
                'C:\\ffmpeg\\bin\\ffmpeg.exe',
                'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
            );
        }
        if (extPath) {
            var rel = process.platform === 'win32' ? path.join('bin', 'win', 'ffmpeg.exe') : path.join('bin', 'macos', 'ffmpeg');
            candidates.push(path.join(extPath, rel));
        }
        for (var i = 0; i < candidates.length; i++) {
            try {
                if (fs.existsSync(candidates[i])) return candidates[i];
            } catch (e) {}
        }
        return null;
    }

    function stageFrames(framePaths, cb) {
        var tmp = path.join(os.tmpdir(), 'pngseq_' + Date.now());
        mkdirp(tmp);
        var i = 0;
        function next() {
            if (i >= framePaths.length) {
                return cb(null, tmp, path.join(tmp, 'f_%04d.png'));
            }
            var dest = path.join(tmp, 'f_' + pad4(i + 1) + '.png');
            fs.copyFile(framePaths[i], dest, function (err) {
                if (err) return cb(err);
                i++;
                next();
            });
        }
        next();
    }

    function runFfmpeg(ffmpeg, inputPattern, outFile, fps, cb) {
        var encoders = [
            ['-c:v', 'qtrle', '-pix_fmt', 'rgba'],
            ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le']
        ];
        var encIdx = 0;
        var lastErr = '';

        function tryEncoder() {
            if (encIdx >= encoders.length) {
                return cb(new Error(lastErr || 'no output'));
            }
            try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (e0) {}
            var args = [
                '-y', '-hide_banner', '-loglevel', 'warning',
                '-framerate', String(fps),
                '-f', 'image2', '-start_number', '1',
                '-i', inputPattern,
                '-r', String(fps)
            ].concat(encoders[encIdx]).concat([outFile]);
            encIdx++;
            cp.execFile(ffmpeg, args, { maxBuffer: 16 * 1024 * 1024 }, function (err, stdout, stderr) {
                lastErr = String(stderr || stdout || err || '').trim();
                try {
                    if (fs.existsSync(outFile) && fs.statSync(outFile).size > 0) {
                        return cb(null, outFile);
                    }
                } catch (e1) {}
                tryEncoder();
            });
        }
        tryEncoder();
    }

    function exportAlpha(opts, cb) {
        if (!bootNode()) return cb(new Error('node_unavailable:' + nodeErr));
        var seqDir = opts.seqDir;
        var seqName = opts.seqName;
        var fps = opts.fps || 24;
        var framePaths = opts.framePaths;
        var extPath = opts.extPath;
        if (!seqDir || !framePaths || !framePaths.length) {
            return cb(new Error('no_frames'));
        }
        var ffmpeg = findFfmpeg(extPath);
        if (!ffmpeg) return cb(new Error('ffmpeg_not_found'));

        var exportDir = opts.exportDir || path.join(seqDir, '_AlphaExport');
        mkdirp(exportDir);
        var outFile = path.join(exportDir, safeName(seqName) + '_alpha.mov');

        stageFrames(framePaths, function (err, tmpDir, pattern) {
            if (err) return cb(err);
            runFfmpeg(ffmpeg, pattern, outFile, fps, function (err2) {
                rmDir(tmpDir);
                if (err2) return cb(err2);
                cb(null, outFile, exportDir);
            });
        });
    }

    function countPngs(dir) {
        try {
            return fs.readdirSync(dir).filter(function (f) { return /\.png$/i.test(f); }).length;
        } catch (e) { return 0; }
    }

    function gifToSequence(opts, cb) {
        if (!bootNode()) return cb(new Error('node_unavailable:' + nodeErr));
        var gifPath = opts.gifPath;
        var fps = opts.fps || 12;
        var extPath = opts.extPath;
        if (!gifPath) return cb(new Error('file_not_found'));
        var ffmpeg = findFfmpeg(extPath);
        if (!ffmpeg) return cb(new Error('ffmpeg_not_found'));

        var baseName = safeName(path.basename(gifPath, path.extname(gifPath)));
        var outDir = opts.outDir || path.join(path.dirname(gifPath), baseName + '_png');
        mkdirp(outDir);
        var pattern = path.join(outDir, 'frame_%04d.png');

        var attempts = [
            ['-y', '-hide_banner', '-loglevel', 'warning', '-i', gifPath, '-filter:v', 'fps=' + String(fps), pattern],
            ['-y', '-hide_banner', '-loglevel', 'warning', '-i', gifPath, pattern]
        ];
        var idx = 0;
        var lastErr = '';

        function tryNext() {
            if (idx >= attempts.length) {
                return cb(new Error(lastErr || 'no png output'));
            }
            try {
                var old = fs.readdirSync(outDir).filter(function (f) { return /\.png$/i.test(f); });
                for (var j = 0; j < old.length; j++) {
                    try { fs.unlinkSync(path.join(outDir, old[j])); } catch (e0) {}
                }
            } catch (e1) {}
            var args = attempts[idx++];
            cp.execFile(ffmpeg, args, { maxBuffer: 16 * 1024 * 1024 }, function (err, stdout, stderr) {
                lastErr = String(stderr || stdout || err || '').trim();
                var n = countPngs(outDir);
                if (n > 0) return cb(null, outDir, n);
                tryNext();
            });
        }
        tryNext();
    }

    global.PngFfmpegExport = {
        available: function () { return bootNode(); },
        nodeError: function () { return nodeErr; },
        findFfmpeg: findFfmpeg,
        exportAlpha: exportAlpha,
        gifToSequence: gifToSequence,
        safeName: safeName
    };
})(typeof window !== 'undefined' ? window : this);
