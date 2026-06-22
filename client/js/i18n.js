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
            pick: '加入資料夾',
            pickTitle: 'Shift+點擊=除錯',
            clearTitle: '清空全部',
            themeTitle: '介面顏色',
            langTitle: '語言',
            noFolders: '尚未載入資料夾…',
            foldersLoaded: '已載入 {n} 個資料夾',
            colorPrimary: '主色',
            colorSecondary: '副色',
            colorBg: '背景',
            reset: '重設',
            searchPh: '搜尋序列名稱…',
            seqCount: '{n} 序列',
            seqMatch: '{m} / {n} 序列',
            expandAll: '全部展開',
            collapseAll: '全部收合',
            emptyPreview: '選擇左側序列或 GIF 預覽<br>↑↓ 切序列 · ←→ 切格 · GIF 可轉 PNG 序列',
            frames: '{i} / {n} 格',
            play: '播放',
            pause: '暫停',
            playTitle: '播放 / 暫停',
            prevTitle: '上一格',
            nextTitle: '下一格',
            autoplay: '自動播放',
            autoplayTitle: '切換序列時自動播放',
            autoloop: '自動 Loop',
            autoloopTitle: '加入時間軸時自動套用 loopOut 循環',
            loop: 'Loop',
            loopTitle: '對時間軸選取圖層套用 loopOut(cycle)',
            import: '加入時間軸',
            importProject: '匯入專案',
            importTitle: '匯入序列',
            importModeTitle: '匯入方式',
            importModeTimeline: '時間軸',
            importModeProject: '僅專案',
            importingProject: '匯入專案中…',
            selectAll: '全選',
            selectedCount: '{n} 已選',
            exportAlpha: '輸出 Alpha 影片',
            exportAlphaTitle: '輸出 Alpha 影片並匯入 AE（可指定輸出資料夾）',
            exportingAlpha: '輸出中 ({i}/{n})：{name}',
            exportViaAe: 'AE 渲染輸出：{name}',
            exportOutLabel: '輸出至',
            exportOutBesideSeq: '各序列/_AlphaExport/',
            exportOutBesideSeqHint: '預設：每個序列資料夾內建立 _AlphaExport 子資料夾',
            exportOutPick: '選擇…',
            exportOutPickTitle: '指定所有 Alpha 影片的輸出資料夾',
            exportOutOpen: '開啟',
            exportOutOpenTitle: '在 Finder 中開啟輸出資料夾（目前序列的 _AlphaExport 或自訂路徑）',
            exportOutOpened: '已開啟：{path}',
            exportOutOpenNeedSeq: '請先選取一個序列，或指定自訂輸出資料夾',
            exportOutReset: '預設',
            exportOutResetTitle: '改回各序列旁的 _AlphaExport 資料夾',
            exportOutSet: '輸出資料夾：{path}',
            exportOutResetDone: '已改回預設（各序列/_AlphaExport/）',
            exportAlphaDone: '已完成 {n} 個 Alpha 影片',
            exportAlphaSaved: '已儲存：{path}',
            exportAlphaFail: 'Alpha 輸出失敗',
            'err.render_failed': 'AE 渲染失敗',
            'err.render_template_failed': '找不到含 Alpha 的輸出範本',
            'err.export_failed': '輸出失敗',
            'err.ffmpeg_not_found': '找不到 ffmpeg，請安裝並加入 PATH（macOS: brew install ffmpeg）',
            'err.ffmpeg_failed': 'ffmpeg 輸出失敗',
            'err.node_unavailable': 'Node.js 未啟用，請重啟 AE 後再試',
            'err.no_frames': '找不到 PNG 幀',
            gifToPng: 'GIF → PNG',
            gifToPngTitle: '以 ffmpeg 將 GIF 拆解為 PNG 序列（使用上方 FPS）',
            gifLoaded: 'GIF：{name}',
            convertingGif: 'GIF 轉換中：{name}',
            convertGifViaAe: 'AE 渲染 GIF：{name}',
            convertGifViaFfmpeg: 'ffmpeg 轉換 GIF：{name}',
            gifConverted: '已轉換 {n} 格：{name}',
            gifConvertedImport: '已轉換 {n} 格並匯入：{name}{msg}',
            gifConvertedNoImport: '已轉換 {n} 格，但匯入失敗：{err}',
            gifConvertFail: 'GIF 轉換失敗',
            gifImportHint: '請先將 GIF 轉為 PNG 序列再匯入',
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
            pick: '添加文件夹',
            pickTitle: 'Shift+点击=调试',
            clearTitle: '清空全部',
            themeTitle: '界面颜色',
            langTitle: '语言',
            noFolders: '尚未加载文件夹…',
            foldersLoaded: '已加载 {n} 个文件夹',
            colorPrimary: '主色',
            colorSecondary: '副色',
            colorBg: '背景',
            reset: '重置',
            searchPh: '搜索序列名称…',
            seqCount: '{n} 序列',
            seqMatch: '{m} / {n} 序列',
            expandAll: '全部展开',
            collapseAll: '全部收起',
            emptyPreview: '选择左侧序列或 GIF 预览<br>↑↓ 切序列 · ←→ 切帧 · GIF 可转 PNG 序列',
            frames: '{i} / {n} 帧',
            play: '播放',
            pause: '暂停',
            playTitle: '播放 / 暂停',
            prevTitle: '上一帧',
            nextTitle: '下一帧',
            autoplay: '自动播放',
            autoplayTitle: '切换序列时自动播放',
            autoloop: '自动 Loop',
            autoloopTitle: '加入时间轴时自动套用 loopOut 循环',
            loop: 'Loop',
            loopTitle: '对时间轴选中图层套用 loopOut(cycle)',
            import: '加入时间轴',
            importProject: '导入项目',
            importTitle: '导入序列',
            importModeTitle: '导入方式',
            importModeTimeline: '时间轴',
            importModeProject: '仅项目',
            importingProject: '导入项目中…',
            selectAll: '全选',
            selectedCount: '已选 {n}',
            exportAlpha: '输出 Alpha 视频',
            exportAlphaTitle: '输出 Alpha 视频并导入 AE（可指定输出文件夹）',
            exportingAlpha: '输出中 ({i}/{n})：{name}',
            exportViaAe: 'AE 渲染输出：{name}',
            exportOutLabel: '输出至',
            exportOutBesideSeq: '各序列/_AlphaExport/',
            exportOutBesideSeqHint: '默认：在每个序列文件夹内创建 _AlphaExport 子文件夹',
            exportOutPick: '选择…',
            exportOutPickTitle: '指定所有 Alpha 视频的输出文件夹',
            exportOutOpen: '打开',
            exportOutOpenTitle: '在 Finder 中打开输出文件夹（当前序列的 _AlphaExport 或自定义路径）',
            exportOutOpened: '已打开：{path}',
            exportOutOpenNeedSeq: '请先选取一个序列，或指定自定义输出文件夹',
            exportOutReset: '默认',
            exportOutResetTitle: '改回各序列旁的 _AlphaExport 文件夹',
            exportOutSet: '输出文件夹：{path}',
            exportOutResetDone: '已改回默认（各序列/_AlphaExport/）',
            exportAlphaDone: '已完成 {n} 个 Alpha 视频',
            exportAlphaSaved: '已保存：{path}',
            exportAlphaFail: 'Alpha 输出失败',
            'err.render_failed': 'AE 渲染失败',
            'err.render_template_failed': '找不到含 Alpha 的输出模板',
            'err.export_failed': '输出失败',
            'err.ffmpeg_not_found': '找不到 ffmpeg，请安装并加入 PATH',
            'err.ffmpeg_failed': 'ffmpeg 输出失败',
            'err.node_unavailable': 'Node.js 未启用，请重启 AE 后再试',
            'err.no_frames': '找不到 PNG 帧',
            gifToPng: 'GIF → PNG',
            gifToPngTitle: '用 ffmpeg 将 GIF 拆解为 PNG 序列（使用上方 FPS）',
            gifLoaded: 'GIF：{name}',
            convertingGif: 'GIF 转换中：{name}',
            convertGifViaAe: 'AE 渲染 GIF：{name}',
            convertGifViaFfmpeg: 'ffmpeg 轉換 GIF：{name}',
            gifConverted: '已转换 {n} 帧：{name}',
            gifConvertedImport: '已转换 {n} 帧并导入：{name}{msg}',
            gifConvertedNoImport: '已转换 {n} 帧，但导入失败：{err}',
            gifConvertFail: 'GIF 转换失败',
            gifImportHint: '请先将 GIF 转为 PNG 序列再导入',
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
            pick: 'Add folder',
            pickTitle: 'Shift+click = debug',
            clearTitle: 'Clear all',
            themeTitle: 'Theme colors',
            langTitle: 'Language',
            noFolders: 'No folders loaded…',
            foldersLoaded: '{n} folder(s) loaded',
            colorPrimary: 'Primary',
            colorSecondary: 'Secondary',
            colorBg: 'Background',
            reset: 'Reset',
            searchPh: 'Search sequences…',
            seqCount: '{n} sequences',
            seqMatch: '{m} / {n} sequences',
            expandAll: 'Expand all',
            collapseAll: 'Collapse all',
            emptyPreview: 'Select a sequence or GIF to preview<br>↑↓ switch seq · ←→ step frame · convert GIF to PNG',
            frames: '{i} / {n} frames',
            play: 'Play',
            pause: 'Pause',
            playTitle: 'Play / Pause',
            prevTitle: 'Previous frame',
            nextTitle: 'Next frame',
            autoplay: 'Auto-play',
            autoplayTitle: 'Auto-play when switching sequences',
            autoloop: 'Auto Loop',
            autoloopTitle: 'Apply loopOut when adding to timeline',
            loop: 'Loop',
            loopTitle: 'Apply loopOut(cycle) to selected timeline layer(s)',
            import: 'Add to timeline',
            importProject: 'Import to project',
            importTitle: 'Import sequence',
            importModeTitle: 'Import mode',
            importModeTimeline: 'Timeline',
            importModeProject: 'Project only',
            importingProject: 'Importing to project…',
            selectAll: 'Select all',
            selectedCount: '{n} selected',
            exportAlpha: 'Export Alpha video',
            exportAlphaTitle: 'Export alpha video and import to AE (custom output folder)',
            exportingAlpha: 'Exporting ({i}/{n}): {name}',
            exportViaAe: 'AE render: {name}',
            exportOutLabel: 'Output',
            exportOutBesideSeq: 'Each seq/_AlphaExport/',
            exportOutBesideSeqHint: 'Default: _AlphaExport subfolder beside each sequence',
            exportOutPick: 'Choose…',
            exportOutPickTitle: 'Choose output folder for all alpha videos',
            exportOutOpen: 'Open',
            exportOutOpenTitle: 'Reveal output folder in Finder (_AlphaExport or custom path)',
            exportOutOpened: 'Opened: {path}',
            exportOutOpenNeedSeq: 'Select a sequence first, or set a custom output folder',
            exportOutReset: 'Default',
            exportOutResetTitle: 'Use _AlphaExport beside each sequence',
            exportOutSet: 'Output folder: {path}',
            exportOutResetDone: 'Reset to default (each seq/_AlphaExport/)',
            exportAlphaDone: 'Exported {n} alpha video(s)',
            exportAlphaSaved: 'Saved: {path}',
            exportAlphaFail: 'Alpha export failed',
            'err.render_failed': 'AE render failed',
            'err.render_template_failed': 'No alpha output template found',
            'err.export_failed': 'Export failed',
            'err.ffmpeg_not_found': 'ffmpeg not found — install and add to PATH',
            'err.ffmpeg_failed': 'ffmpeg export failed',
            'err.node_unavailable': 'Node.js not enabled — restart AE',
            'err.no_frames': 'No PNG frames found',
            gifToPng: 'GIF → PNG',
            gifToPngTitle: 'Split GIF to PNG sequence via ffmpeg (uses FPS above)',
            gifLoaded: 'GIF: {name}',
            convertingGif: 'Converting GIF: {name}',
            convertGifViaAe: 'AE render GIF: {name}',
            convertGifViaFfmpeg: 'ffmpeg GIF: {name}',
            gifConverted: 'Converted {n} frames: {name}',
            gifConvertedImport: 'Converted {n} frames and imported: {name}{msg}',
            gifConvertedNoImport: 'Converted {n} frames but import failed: {err}',
            gifConvertFail: 'GIF conversion failed',
            gifImportHint: 'Convert GIF to PNG sequence before import',
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
            pick: 'フォルダー追加',
            pickTitle: 'Shift+クリック=デバッグ',
            clearTitle: 'すべてクリア',
            themeTitle: 'UI 配色',
            langTitle: '言語',
            noFolders: 'フォルダー未読み込み…',
            foldersLoaded: '{n} フォルダー読み込み済み',
            colorPrimary: 'メイン',
            colorSecondary: 'サブ',
            colorBg: '背景',
            reset: 'リセット',
            searchPh: 'シーケンス名を検索…',
            seqCount: '{n} シーケンス',
            seqMatch: '{m} / {n} シーケンス',
            expandAll: 'すべて展開',
            collapseAll: 'すべて折りたたみ',
            emptyPreview: '左のシーケンスまたは GIF を選択<br>↑↓ 切替 · ←→ コマ · GIF→PNG 変換',
            frames: '{i} / {n} コマ',
            play: '再生',
            pause: '一時停止',
            playTitle: '再生 / 一時停止',
            prevTitle: '前のコマ',
            nextTitle: '次のコマ',
            autoplay: '自動再生',
            autoplayTitle: 'シーケンス切替時に自動再生',
            autoloop: '自動 Loop',
            autoloopTitle: 'タイムライン追加時に loopOut を適用',
            loop: 'Loop',
            loopTitle: '選択レイヤーに loopOut(cycle) を適用',
            import: 'タイムラインへ',
            importProject: 'プロジェクトへ',
            importTitle: 'シーケンス取込',
            importModeTitle: '取込モード',
            importModeTimeline: 'タイムライン',
            importModeProject: 'プロジェクトのみ',
            importingProject: 'プロジェクトへ取込中…',
            selectAll: 'すべて選択',
            selectedCount: '{n} 選択中',
            exportAlpha: 'Alpha 動画出力',
            exportAlphaTitle: 'Alpha 動画を出力し AE に取込（出力フォルダー指定可）',
            exportingAlpha: '出力中 ({i}/{n})：{name}',
            exportViaAe: 'AE レンダー：{name}',
            exportOutLabel: '出力先',
            exportOutBesideSeq: '各シーケンス/_AlphaExport/',
            exportOutBesideSeqHint: '既定：各シーケンスフォルダー内に _AlphaExport を作成',
            exportOutPick: '選択…',
            exportOutPickTitle: 'Alpha 動画の出力フォルダーを指定',
            exportOutOpen: '開く',
            exportOutOpenTitle: '出力フォルダーを Finder で開く（_AlphaExport または指定パス）',
            exportOutOpened: '開きました：{path}',
            exportOutOpenNeedSeq: 'シーケンスを選択するか、出力フォルダーを指定してください',
            exportOutReset: '既定',
            exportOutResetTitle: '各シーケンス横の _AlphaExport に戻す',
            exportOutSet: '出力フォルダー：{path}',
            exportOutResetDone: '既定に戻しました（各シーケンス/_AlphaExport/）',
            exportAlphaDone: '{n} 件の Alpha 動画を出力しました',
            exportAlphaSaved: '保存：{path}',
            exportAlphaFail: 'Alpha 出力失敗',
            'err.render_failed': 'AE レンダー失敗',
            'err.render_template_failed': 'Alpha 出力テンプレートが見つかりません',
            'err.export_failed': '出力失敗',
            'err.ffmpeg_not_found': 'ffmpeg が見つかりません — インストールして PATH に追加してください',
            'err.ffmpeg_failed': 'ffmpeg 出力失敗',
            'err.node_unavailable': 'Node.js 無効 — AE を再起動してください',
            'err.no_frames': 'PNG フレームがありません',
            gifToPng: 'GIF → PNG',
            gifToPngTitle: 'ffmpeg で GIF を PNG シーケンスに分解（上の FPS を使用）',
            gifLoaded: 'GIF：{name}',
            convertingGif: 'GIF 変換中：{name}',
            convertGifViaAe: 'AE レンダー GIF：{name}',
            convertGifViaFfmpeg: 'ffmpeg GIF：{name}',
            gifConverted: '{n} コマに変換：{name}',
            gifConvertedImport: '{n} コマに変換して取込：{name}{msg}',
            gifConvertedNoImport: '{n} コマに変換しましたが取込失敗：{err}',
            gifConvertFail: 'GIF 変換失敗',
            gifImportHint: '取込前に GIF を PNG シーケンスに変換してください',
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
