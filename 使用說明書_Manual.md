# PNG 序列預覽 · PNG Sequence Preview

> After Effects 擴充面板 — 批次瀏覽、預覽、加入時間軸
> An After Effects extension panel — browse, preview & add PNG sequences to the timeline

---

## 一、這是什麼？ / What is this?

**中文**
一個 After Effects (CEP) 面板，讓你快速瀏覽含有大量 PNG 序列的多層資料夾、即時預覽播放，並一鍵把序列加入時間軸。支援多資料夾、搜尋、自動分類與介面配色。

**English**
An After Effects (CEP) panel that lets you browse nested folders full of PNG sequences, preview them in real time, and add a sequence to the timeline with one action. Supports multiple folders, search, auto-categorization and custom UI colors.

---

## 二、系統需求 / Requirements

| 項目 / Item | 需求 / Requirement |
| --- | --- |
| 軟體 / App | Adobe After Effects 2019 ~ 2025+ |
| 系統 / OS | macOS（Apple Silicon / Intel）|
| 其他 / Other | 無需額外安裝 / No extra dependencies |

---

## 三、安裝 / Installation

### 方法 A：用 ZXP 安裝器（推薦）/ Method A: ZXP Installer (recommended)

**中文**
1. 安裝任一免費 ZXP 安裝器，例如 **aescripts ZXP Installer** 或 **Anastasiy's Extension Manager**。
2. 把 `PNG-Sequence-Preview.zxp` 拖進安裝器，或選擇該檔案安裝。
3. 重新啟動 After Effects。
4. 從選單 **Window ▸ Extensions ▸ PNG 序列預覽** 開啟面板。

**English**
1. Install any free ZXP installer, e.g. **aescripts ZXP Installer** or **Anastasiy's Extension Manager**.
2. Drag `PNG-Sequence-Preview.zxp` into the installer (or pick the file).
3. Restart After Effects.
4. Open it from **Window ▸ Extensions ▸ PNG 序列預覽**.

### 方法 B：手動安裝 / Method B: Manual install

**macOS**
1. 開啟「終端機」，依 AE 版本執行（2024≈CSXS.11、2025≈CSXS.12）：
   ```bash
   defaults write com.adobe.CSXS.12 PlayerDebugMode 1
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   ```
2. 將 ZXP 改副檔名為 `.zip` 解壓，放到：
   `~/Library/Application Support/Adobe/CEP/extensions/`
3. 重新啟動 After Effects。

**Windows**
1. 以系統管理員開啟「登錄編輯程式」或執行 reg 檔，新增字串值 `PlayerDebugMode` = `1`：
   - `HKEY_CURRENT_USER\Software\Adobe\CSXS.12`（AE 2025）
   - `HKEY_CURRENT_USER\Software\Adobe\CSXS.11`（AE 2024）
2. 將 ZXP 改副檔名為 `.zip` 解壓，放到：
   `C:\Users\<你的使用者>\AppData\Roaming\Adobe\CEP\extensions\`
3. 重新啟動 After Effects。

**English (manual install)**
- **macOS**: Enable PlayerDebugMode via `defaults write` (see above), unzip ZXP to `~/Library/Application Support/Adobe/CEP/extensions/`, restart AE.
- **Windows**: Set `PlayerDebugMode` = `1` in Registry under `HKCU\Software\Adobe\CSXS.12` (or `.11`), unzip ZXP to `%AppData%\Adobe\CEP\extensions\`, restart AE.

---

## 四、操作說明 / How to use

### 1. 載入資料夾 / Load folders
- **中文**：點 **➕ 加入資料夾**，選擇含有 PNG 序列的「根目錄」。可重複加入多個資料夾，會各自成為一個頂層分組（🗂）。滑鼠移到分組上、點右側 **✕** 可移除單個；**🗑** 清空全部。
- **Windows v1.0.2+**：會開啟**完整 Explorer 大視窗**（左側快速存取、路徑列、縮圖預覽）。請導覽到目標資料夾後按 **「開啟 / Open」** 即可（不需選取個別 PNG 檔）。
- **English**: Click **➕ Add Folder** and pick a root folder. Add as many as you like — each becomes a top-level group (🗂). Hover a group and click **✕** to remove it; **🗑** clears all.
- **Windows v1.0.2+**: Opens the **full Explorer-style dialog** (Quick access, address bar, thumbnails). Navigate to the target folder and click **Open** — you don't need to select individual PNG files.

### 2. 瀏覽與搜尋 / Browse & search
- **中文**：左側為可展開的樹狀清單。`📁` 是資料夾、`🎞` 是序列（括號顯示張數）。上方 **🔍 搜尋框** 即時過濾；**⊞ / ⊟** 一鍵全展開／收合。
- **English**: The left side is a collapsible tree. `📁` = folder, `🎞` = sequence (frame count in brackets). The **🔍 search box** filters instantly; **⊞ / ⊟** expand / collapse all.

### 3. 預覽播放 / Preview
- **中文**：點任一序列即在右側預覽並**自動播放**（可用「自動播放」勾選框關閉）。`▶/⏸` 播放暫停、`◀ ▶` 切上一個／下一個序列、拖曳滑桿逐格、`FPS` 調整速度。鍵盤：`↑ ↓` 切序列、`空白鍵` 播放暫停。
- **English**: Click a sequence to preview it and **auto-play** (toggle off via the "自動播放" checkbox). `▶/⏸` play/pause, `◀ ▶` previous/next sequence, drag the slider to scrub, `FPS` sets speed. Keys: `↑ ↓` switch sequence, `Space` play/pause.

### 4. 加入時間軸 / Add to timeline
- **中文**：**雙擊**序列（或按 **⬇ 加入時間軸**）即把該序列匯入並加到「目前作用中合成」的圖層，圖層起點對齊**播放頭 (current time)**。同時會依序列所屬的資料夾名稱，在專案面板**自動建立分類資料夾**並歸入。若當下沒有作用中合成，則只匯入到專案。
- **English**: **Double-click** a sequence (or press **⬇ 加入時間軸**) to import it and add it as a layer to the **active comp**, with the layer starting at the **current playhead time**. A project bin named after the source folder is **auto-created** and the footage is filed into it. With no active comp, it only imports to the project.

### 5. 介面配色 / UI colors
- **中文**：點 **🎨** 開啟配色面板，可調 **主色 / 副色 / 背景**，或點預設色塊一鍵套用、**重設** 還原預設。設定會自動記住。
- **English**: Click **🎨** to open color settings — adjust **primary / secondary / background**, use preset swatches, or **重設** to restore defaults. Your choice is remembered.

### 6. Loop 循環 / Loop
- **中文**：勾選 **自動 Loop** 後，加入時間軸時自動啟用 Time Remap 並套用 `loopOut("cycle")`。也可在 AE 中選中圖層後按 **🔁 Loop**。
- **English**: Enable **自動 Loop** to apply `loopOut("cycle")` when adding to timeline. Or select layer(s) in AE and press **🔁 Loop**.

> 🪟 **Windows v1.0.1+**：資料夾選擇改用系統原生大視窗；PNG 預覽路徑已修正。

### 7. 記憶功能 / Persistence
- **中文**：已載入的資料夾清單與配色都會儲存，**下次開啟 AE 會自動還原**（若資料夾被移走會自動略過）。
- **English**: Loaded folders and color theme are saved and **automatically restored next time you open AE** (missing folders are skipped).

---

## 五、疑難排解 / Troubleshooting

**中文**
- **選單沒有面板**：確認已重啟 AE；手動安裝者請確認已設定 PlayerDebugMode 並放對位置。
- **預覽空白**：確認該資料夾內直接含有 `.png` 檔；序列需為同一資料夾的連續編號圖檔。
- **加入時間軸沒反應**：請先在 AE 開啟或新建一個合成並選為作用中視窗。

**English**
- **Panel missing in menu**: Restart AE; for manual installs verify PlayerDebugMode and the install path.
- **Blank preview**: Make sure the folder directly contains `.png` files (a numbered image sequence).
- **Nothing added to timeline**: Open/create a comp and make it the active viewer first.

---

## 七、版本 / Version

- **v1.0.6** — Windows 資料夾選取器修復（Explorer 大視窗更穩定、取消後不再跳小視窗）
- **v1.0.1** — Windows 預覽修復、原生資料夾選擇器、Loop 表達式；macOS & Windows 通用
- v1.0.0 — 初版
- Bundle ID: `com.marcy.pngseq`
- 支援格式 / Format: PNG 序列 / PNG sequences
- 平台 / Platform: **macOS · Windows**（After Effects 2019–2025+）
