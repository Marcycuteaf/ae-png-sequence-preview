# PNG Sequence Preview

After Effects extension — browse PNG sequences, preview GIFs, export Alpha video, add to timeline

[← README](../../README.md) · [TC](zh-TC.md) · [日本語](ja.md) · [Русский](ru.md)

<p align="center">
  <img src="../ui-main-v104.png" alt="Panel UI" width="420">
</p>

---

## Features (v1.0.9)

- Multiple folders, nested tree, search, batch selection
- PNG sequence preview, FPS, Loop
- **GIF preview** and **GIF → PNG sequence** (ffmpeg)
- **Batch Alpha video export** (`.mov`) with optional auto-add to timeline
- Custom output folder, folder persistence, 4 UI languages

---

## Install

1. Download the **`.zxp`** from [Releases](https://github.com/Marcycuteaf/ae-png-sequence-preview/releases/latest)
2. Install with [ZXP Installer](https://aescripts.com/learn/zxp-installer/)
3. **Fully restart** After Effects
4. **Window → Extensions → PNG 序列預覽**

> Use the **Release ZXP**, not a raw Git clone — source code does not include ffmpeg binaries.

---

## Basic usage

1. Click **Add folder** and pick a root directory (repeat for multiple roots)
2. Select a sequence or GIF in the tree → preview on the right
3. Set **FPS**, **Auto Loop** (optional)
4. Choose **Timeline** or **Project only** → **Add to timeline** (not for raw GIF — see below)

---

## Important notes

### 1. Folders & persistence

| Topic | Notes |
| --- | --- |
| **Add folder** | Only paths added this way appear in the left tree. |
| **Output to** | Sets Alpha export destination only. Since v1.0.9, picking a folder also adds it to the tree; saved output folder is restored on panel open. |
| **Persistence** | Loaded folders and output path are saved in the panel. Re-open AE to restore. Re-add if a folder was moved or renamed. |
| **Large packs** | Scanning 100+ sequences takes time — watch the status bar. |
| **Clear** | The trash button clears all loaded folders from memory, not files on disk. |

### 2. PNG sequences

| Topic | Notes |
| --- | --- |
| **Detection** | A folder with `.png` files is treated as one sequence. |
| **Add to timeline** | Open or create an active comp first; layer starts at the **playhead**. |
| **Project bins** | Footage is filed under a bin named after the root folder. |
| **Loop** | Enable **Auto Loop** before import, or select layer(s) in AE and press **Loop**. |
| **Blank preview** | Ensure `.png` files are directly inside the folder. |

### 3. GIF

| Topic | Notes |
| --- | --- |
| **Preview** | `.gif` files appear in the tree with a `GIF` label. |
| **No direct import** | GIF **cannot** be added to the timeline — use **GIF → PNG** first. |
| **Output** | Creates `{name}_png/frame_0001.png …` next to the GIF; FPS from the panel (default 12). |
| **After convert** | Auto-imports to AE per the dropdown (Timeline / Project only) and refreshes the tree. |
| **Disk space** | Conversion writes PNG files — ensure free space. |

### 4. Alpha video export

| Topic | Notes |
| --- | --- |
| **Usage** | Check sequences on the left (not GIF) → **Export Alpha Video**. |
| **Default path** | `{seqFolder}/_AlphaExport/{name}_alpha.mov` |
| **Custom path** | Use **Output to → Select…**; **Default** restores `_AlphaExport` beside the sequence. |
| **FPS** | Uses the panel FPS value. |
| **On success** | Imports to project and optionally adds to the active comp at the playhead. |
| **Encoding** | Node.js + ffmpeg first; falls back to **AE render queue** if needed. |
| **File size** | Alpha `.mov` files can be large. |

### 5. ffmpeg & ZXP size

| Topic | Notes |
| --- | --- |
| **~55 MB ZXP** | Includes macOS + Windows ffmpeg — expected. |
| **macOS** | If export fails, install system ffmpeg (`brew install ffmpeg`) or rely on AE render queue fallback. |
| **Windows** | ZXP includes `ffmpeg.exe`; optional: install ffmpeg and add to PATH. |
| **Warning** | Do not use legacy flags like `-ignore_loop 0` on GIFs manually — can fill your disk with hundreds of thousands of PNGs. |

### 6. Windows-specific

| Topic | Notes |
| --- | --- |
| **Folder picker** | Native Explorer dialog — navigate to the folder and click **Open** (no need to select a PNG). |
| **Debug** | **Shift + Add folder** shows CEP / ffmpeg diagnostics. |
| **Manual install** | Registry `PlayerDebugMode = 1` required (see [manual](../../使用說明書_Manual.md)). |

### 7. macOS-specific

| Topic | Notes |
| --- | --- |
| **Folder picker** | System native folder dialog. |
| **Dev install** | Symlink to source requires `PlayerDebugMode` via `defaults write`. |
| **From source** | Run `./scripts/fetch-ffmpeg-mac.sh` before packaging. |

### 8. Lite variant

- **Full** Bundle ID: `com.marcy.pngseq`
- **Lite** Bundle ID: `com.marcy.pngseq.lite` — can coexist; fewer features

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Panel missing in menu | Restart AE; verify ZXP install; manual install needs PlayerDebugMode |
| Blank panel / errors | Re-open panel; Shift+Add folder (Win) for diagnostics |
| Add to timeline does nothing | Open an active comp first |
| GIF convert fails | Use Release ZXP; macOS: `brew install ffmpeg` |
| Alpha export fails | Wait for AE render queue fallback; check write permissions on output folder |
| Folders not restored | Re-add with **Add folder**; v1.0.9 fixes multi-folder persistence loss |
| Slow preview | Large sequences load frame lists on first select — normal |

---

## Requirements

After Effects **2019–2025+** · macOS / Windows
