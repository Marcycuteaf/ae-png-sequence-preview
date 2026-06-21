# PNG Sequence Preview

> After Effects extension panel — browse · preview · add to timeline

[← Home](../../README.md) · [繁體中文](zh-TW.md) · [日本語](ja.md) · [Русский](ru.md)

<p align="center">
  <img src="../ui-main-v104.png" alt="Main UI v1.0.4" width="90%">
</p>

---

## What is this?

Browse nested folders full of PNG sequences inside After Effects, preview them in real time, and add a sequence to the timeline at the current playhead. Supports multiple folders, search, auto project bins, and custom UI colors.

---

## Interface

### Top bar

| Control | Description |
| --- | --- |
| **➕ Add folder** | Pick a root folder; add several packs. On Windows, Explorer opens first. **Shift + click** for debug info |
| **🗑** | Clear all loaded folders and sequences |
| **🎨** | Toggle the color theme panel |
| **Root label** | Summary of loaded folder paths |

### Theme panel (🎨)

| Control | Description |
| --- | --- |
| **Primary / Secondary / Background** | Customize panel colors |
| **Presets** | One-click built-in palettes |
| **Reset** | Restore defaults |

### Left — sequence tree

| Control | Description |
| --- | --- |
| **🔍 Search** | Filter sequences by name |
| **Count badge** | Total PNG sequences found |
| **⊞ / ⊟** | Expand all / collapse all |
| **Tree** | `📁` folders, `🎞` sequences (with frame count). Click to preview |

### Right — preview & controls

| Control | Description |
| --- | --- |
| **Preview stage** | Current frame; hint text when nothing is selected |
| **Name / frame info** | Sequence name and `current / total` frames |
| **Slider** | Scrub frame-by-frame |
| **◀ / ▶** | Previous / next sequence |
| **▶ Play** | Play / pause (`Space`) |
| **FPS** | Preview playback rate |
| **Auto-play** | Start playback when switching sequences |
| **Auto Loop** | Apply `loopOut("cycle")` when adding to timeline |
| **🔁 Loop** | Apply loop to the **selected timeline layer** |
| **⬇ Add to timeline** | Import and add to active comp at **playhead**; auto bin by pack name |

### Status bar (bottom)

Loading progress, import results, errors, and debug messages (including Windows folder-picker reasons).

---

## Install

1. Install [aescripts ZXP Installer](https://aescripts.com/learn/zxp-installer/).
2. Download the `.zxp` for your OS from [Releases](https://github.com/Marcycuteaf/ae-png-sequence-preview/releases/latest).
3. Install via the ZXP installer.
4. Restart AE → **Window ▸ Extensions ▸ PNG 序列預覽**.

**Manual install (macOS)**: Copy to the CEP extensions folder and enable `PlayerDebugMode` for your AE version (2024≈CSXS.11, 2025≈CSXS.12).

---

## Usage

1. Click **➕ Add folder** and pick a root directory (repeat for more packs).
2. Click a sequence in the tree → preview auto-plays on the right.
3. Use `◀ ▶` or `↑ ↓` to switch sequences; `Space` to play/pause.
4. **Double-click a sequence** or press **⬇ Add to timeline** → lands at the playhead with an auto-created project bin.
5. Enable **Auto Loop** when adding, or select a layer and press **🔁 Loop**.

---

## Windows folder picker

- **Explorer dialog** opens first: navigate to the folder and click **Open** (no need to pick individual PNGs).
- If Explorer is cancelled or fails, the CEP native picker is used as fallback.
- **Shift + click “Add folder”**: debug info in the status bar (OS, AE version, `system.callSystem`).
- If it still fails, check `%TEMP%\pngseq_pick_log.txt` and `%TEMP%\pngseq_host_log.txt`.

---

## Requirements

| Item | Requirement |
| --- | --- |
| App | Adobe After Effects 2019 ~ 2025+ |
| OS | macOS · Windows |
| Assets | Folders with numbered `.png` sequences |

---

<p align="center"><sub><a href="../../README.md">← Home</a></sub></p>
