<div align="center">

<img src="https://raw.githubusercontent.com/Marcycuteaf/Marcycuteaf/main/assets/banner-snow-v3.gif" width="100%" alt="Banner with snow" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4a0000,50:dc143c,100:ff4757&height=110&section=header&text=PNG%20Sequence%20Preview&fontSize=36&fontColor=ffffff" width="100%" />

### Browse, preview, and import PNG sequences into the After Effects timeline

[![Download](https://img.shields.io/github/v/release/Marcycuteaf/ae-png-sequence-preview?style=for-the-badge&color=dc143c&labelColor=4a0000&label=Download)](https://github.com/Marcycuteaf/ae-png-sequence-preview/releases/tag/v1.0.10)
[![Languages](https://img.shields.io/badge/Languages-4-ff4757?style=for-the-badge&labelColor=8b0000)](docs/readme/en.md)

After Effects 2019–2025+ · macOS / Windows · TC / SC / EN / 日本語

<p align="center">
  <img src="docs/ui-main-v104.png" alt="Panel UI" width="420">
</p>

</div>

---

## Download

| Platform | File |
| --- | --- |
| macOS | [`PNG-Sequence-Preview-v1.0.10-macOS.zxp`](https://github.com/Marcycuteaf/ae-png-sequence-preview/releases/download/v1.0.10/PNG-Sequence-Preview-v1.0.10-macOS.zxp) |
| Windows | [`PNG-Sequence-Preview-v1.0.10-Windows.zxp`](https://github.com/Marcycuteaf/ae-png-sequence-preview/releases/download/v1.0.10/PNG-Sequence-Preview-v1.0.10-Windows.zxp) |

1. Install with [ZXP Installer](https://aescripts.com/learn/zxp-installer/)
2. Restart After Effects
3. Open **Window → Extensions → PNG 序列預覽**

---

## ⚠️ Important notes / 使用前必讀

> Full details: **[TC 注意事項](docs/readme/zh-TC.md#注意事項)** · **[English notes](docs/readme/en.md#important-notes)**

| Topic | What to know |
| --- | --- |
| **Install** | Use the **Release `.zxp`**, not the GitHub source zip — only the ZXP includes bundled ffmpeg. Restart AE after install. |
| **Load folders** | Click **Add folder** to browse sequences. The panel remembers folders next time; large packs may take a minute to scan. |
| **GIF** | GIF can be **previewed** but **cannot go to timeline directly** — use **GIF → PNG** first, then import. |
| **Alpha export** | Check sequences on the left, set FPS, click **Export Alpha Video**. Default output: `_AlphaExport/` beside the sequence, or pick a custom folder. |
| **Output folder ≠ browse folder** | Setting **Output to** saves the export path only. v1.0.9 also adds that folder to the tree automatically; otherwise use **Add folder**. |
| **Import mode** | Dropdown: **Timeline** (add at playhead) or **Project only**. Applies to PNG import and post-GIF conversion. |
| **ffmpeg** | ZXP ships ffmpeg (~55 MB). If Alpha/GIF export fails on macOS, install system ffmpeg: `brew install ffmpeg`. AE render queue is used as fallback for Alpha. |
| **Windows** | Folder picker uses the native Explorer dialog. **Shift + Add folder** shows debug info. |
| **macOS** | Add folder uses the system folder dialog. Dev symlink installs need `PlayerDebugMode` (see manual). |
| **Disk space** | GIF → PNG writes frames next to the source GIF. Batch Alpha export can produce large `.mov` files. |

---

## Documentation

- [TC](docs/readme/zh-TC.md)
- [English](docs/readme/en.md)
- [日本語](docs/readme/ja.md)
- [Русский](docs/readme/ru.md)

---

## Changelog

| Version | Notes |
| --- | --- |
| **1.0.10** | Windows fix — remove folder (×) button works with normalized paths |
| **1.0.9** | GIF preview & convert · Alpha batch export · custom output folder · auto-import to timeline · folder persistence · SVG icons · bundled ffmpeg (macOS + Windows) |
| **1.0.8** | macOS folder picker — ExtendScript Folder.selectDialog + cep.fs fallback |
| **1.0.7** | Windows folder picker — use `cep.fs.showOpenDialog` (same as BEN CODE) |
| **1.0.6** | Windows folder picker fix — reliable Explorer dialog, no small fallback on cancel |
| **1.0.5** | In-panel language switch (TC · SC · en · ja) |
| 1.0.4 | Windows folder picker fix · Shift+click debug |
| 1.0.3 | Windows picker temp-file output |
| 1.0.2 | Explorer-style folder dialog |
| 1.0.1 | Windows preview fix · Loop button |

---

## PNG Seq Lite（簡約版）

獨立版本線 **Lite 1.0.x**，Bundle ID `com.marcy.pngseq.lite`，可與完整版同時安裝。

| | 完整版 | Lite |
|---|--------|------|
| 版本 | [1.0.10](https://github.com/Marcycuteaf/ae-png-sequence-preview/releases/tag/v1.0.10) | [Lite 1.0.3](https://github.com/Marcycuteaf/ae-png-sequence-preview/releases/tag/lite-v1.0.3) |
| 語言 | TC / SC / EN / 日本語 | TC 固定 |
| 主題 | 可自訂 | 跟隨 AE 面板 |

打包：`./package-lite.sh` → `dist/lite/`

---

<sub>Bundle ID `com.marcy.pngseq`</sub>

---

<div align="center">

**Page Views**

<img src="https://mayu.due.moe/get/@Marcycuteaf.ae-png-sequence-preview?theme=asoul" alt="Page views" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4a0000,50:dc143c,100:ff4757&height=60&section=footer" width="100%" />

</div>
