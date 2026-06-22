# PNG 序列預覽

After Effects 擴充面板 — 瀏覽 PNG 序列、GIF 預覽、Alpha 輸出、加入時間軸

[← README](../../README.md) · [English](en.md) · [日本語](ja.md) · [Русский](ru.md)

<p align="center">
  <img src="../ui-main-v104.png" alt="主介面" width="420">
</p>

---

## 功能（v1.0.9）

- 多資料夾、巢狀樹狀瀏覽、搜尋、批次勾選
- PNG 序列即時預覽、FPS 調整、Loop
- **GIF 預覽**與 **GIF → PNG 序列**（ffmpeg）
- **批次輸出 Alpha 影片**（`.mov`）並可自動加入時間軸
- 自訂輸出資料夾、資料夾記憶、四語系介面

---

## 安裝

1. 從 [Releases](https://github.com/Marcycuteaf/ae-png-sequence-preview/releases/latest) 下載對應平台的 **`.zxp`**
2. 用 [ZXP Installer](https://aescripts.com/learn/zxp-installer/) 安裝
3. **完全重啟 After Effects**
4. **Window → Extensions → PNG 序列預覽**

**[瀏覽器互動 Demo](../demo/index.html)** — 無需 AE 即可體驗面板 UI（匯入/匯出為模擬）

> 請下載 **Release 的 ZXP**，不要只 clone GitHub 原始碼——原始碼不含 ffmpeg 二進位，無法直接當安裝包使用。

---

## 基本操作

1. 點 **加入資料夾**，選素材根目錄（可重複加入多個）
2. 左側點序列或 GIF → 右側預覽
3. 設定 **FPS**、**自動 Loop**（選用）
4. 選 **時間軸** 或 **僅專案** → 按 **加入時間軸**（GIF 除外，見下方）

---

## 注意事項

### 一、資料夾與記憶

| 項目 | 說明 |
| --- | --- |
| **加入資料夾** | 左側樹狀列表只會顯示用此按鈕加入的路徑。 |
| **輸出至** | 只設定 Alpha 影片的輸出位置。v1.0.9 起：用「選擇…」設定時會**一併加入**左側樹；重開面板也會自動載入已設定的輸出資料夾。 |
| **記憶** | 已加入的資料夾與輸出路徑會保存在面板內；重開 AE 後自動還原。若資料夾被移走或重新命名，請重新加入。 |
| **大型素材包** | 含上百個序列的資料夾掃描需要時間，請看底部狀態列，完成後序列數才會更新。 |
| **清空** | 頂部垃圾桶會清除**全部**已載入資料夾（含記憶），不會刪除磁碟上的檔案。 |

### 二、PNG 序列

| 項目 | 說明 |
| --- | --- |
| **序列判定** | 同一資料夾內有 `.png` 即視為一個序列。 |
| **加入時間軸** | 需先開啟或建立一個合成並設為作用中視窗；圖層起點對齊**播放頭**。 |
| **專案分類** | 匯入時會依序列所屬根資料夾名稱，在專案面板建立對應資料夾。 |
| **Loop** | 勾選「自動 Loop」後加入時間軸會套用 `loopOut("cycle")`；也可在 AE 選圖層後按 **Loop**。 |
| **預覽空白** | 確認該資料夾內直接含有 `.png`；路徑含日文/中文一般可正常運作。 |

### 三、GIF

| 項目 | 說明 |
| --- | --- |
| **預覽** | 資料夾內的 `.gif` 會顯示在樹中（標示 `GIF`），點選即可預覽動畫。 |
| **不能直接匯入** | GIF **無法**直接「加入時間軸」，需先按 **GIF → PNG**。 |
| **轉換輸出** | 在 GIF 同層建立 `{檔名}_png/frame_0001.png …`，FPS 依面板上方設定（預設 12）。 |
| **轉換後匯入** | 轉完會依下拉選單（時間軸 / 僅專案）**自動匯入 AE**，並刷新左側樹。 |
| **磁碟空間** | 轉換會在硬碟寫入 PNG 檔，請確認目標磁碟空間足夠。 |

### 四、Alpha 影片輸出

| 項目 | 說明 |
| --- | --- |
| **用法** | 左側勾選序列（GIF 不可勾）→ 按 **輸出 Alpha 影片**。 |
| **預設路徑** | `{序列資料夾}/_AlphaExport/{名稱}_alpha.mov` |
| **自訂路徑** | 左側「輸出至」→ **選擇…**；**預設** 可還原為序列旁 `_AlphaExport`。 |
| **FPS** | 使用面板上方 FPS 數值。 |
| **完成後** | 成功時會匯入專案，並依設定加入目前合成時間軸（對齊播放頭）。 |
| **編碼方式** | 優先 Node.js + ffmpeg；失敗時改用 **AE 渲染佇列**（較慢但較穩）。 |
| **檔案大小** | 含 Alpha 的 `.mov` 可能很大，請預留空間。 |

### 五、ffmpeg 與 ZXP 大小

| 項目 | 說明 |
| --- | --- |
| **ZXP 約 55 MB** | 內含 macOS + Windows 版 ffmpeg，屬正常大小。 |
| **macOS** | 若 GIF / Alpha 輸出失敗，可安裝系統 ffmpeg：`brew install ffmpeg`，或改用 AE 渲染佇列 fallback。 |
| **Windows** | ZXP 內含 `ffmpeg.exe`；若仍失敗，可另安裝 [ffmpeg](https://www.gyan.dev/ffmpeg/builds/) 並加入 PATH。 |
| **請勿** | 不要用 `-ignore_loop 0` 等舊參數手動轉 GIF——可能產生數十萬張 PNG 塞滿硬碟。 |

### 六、Windows 專用

| 項目 | 說明 |
| --- | --- |
| **資料夾選擇** | 「加入資料夾」使用 Explorer 大視窗；導覽到目標資料夾後按 **開啟** 即可（不必選個別 PNG）。 |
| **除錯** | **Shift + 點「加入資料夾」** 可顯示 CEP / ffmpeg 診斷資訊。 |
| **手動安裝** | 需設定登錄 `PlayerDebugMode = 1`（見 [使用說明書](../../使用說明書_Manual.md)）。 |

### 七、macOS 專用

| 項目 | 說明 |
| --- | --- |
| **資料夾選擇** | 「加入資料夾」使用系統原生資料夾視窗。 |
| **開發者安裝** | symlink 到原始碼時需 `defaults write com.adobe.CSXS.12 PlayerDebugMode 1` 並重啟 AE。 |
| **本地開發** | 原始碼不含 ffmpeg，打包前執行 `./scripts/fetch-ffmpeg-mac.sh`。 |

### 八、與 Lite 版並存

- **完整版** Bundle ID：`com.marcy.pngseq`
- **Lite 版** Bundle ID：`com.marcy.pngseq.lite`（可同時安裝，功能較精簡）

---

## 疑難排解

| 現象 | 處理方式 |
| --- | --- |
| 選單沒有面板 | 重啟 AE；確認 ZXP 已安裝；手動安裝需 PlayerDebugMode |
| 面板空白 / 報錯 | 重開面板；Shift+加入資料夾（Win）看診斷 |
| 加入時間軸沒反應 | 先開啟一個合成 |
| GIF 轉換失敗 | 確認 ZXP 版已安裝；macOS 可 `brew install ffmpeg` |
| Alpha 輸出失敗 | 等待 AE 渲染佇列 fallback；或檢查輸出資料夾寫入權限 |
| 重開後資料夾不見 | 用「加入資料夾」重新加入；v1.0.9 已修復多資料夾記憶遺失 |
| 預覽很慢 | 超大序列首次載入需讀取幀列表，屬正常現象 |

---

## 需求

After Effects **2019–2025+** · macOS / Windows · TC / SC / English / 日本語
