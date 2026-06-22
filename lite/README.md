# PNG Seq Lite

After Effects 簡約版 PNG 序列預覽面板 — 核心功能、固定介面、TC。

**版本線：Lite 1.0.x**（與完整版 1.0.x 分開）

## 與完整版差異

| | **Lite** | **完整版** |
|---|----------|------------|
| 版本號 | Lite 1.0.0 | 1.0.6 |
| Bundle ID | `com.marcy.pngseq.lite` | `com.marcy.pngseq` |
| 選單名稱 | PNG Seq Lite | PNG Sequence Preview |
| 語言 | TC 固定 | TC / SC / EN / 日本語 |
| 介面配色 | 跟隨 AE 面板（appSkinInfo） | 可自訂主題 |
| 同時安裝 | 可與完整版並存 | 可與 Lite 並存 |

## 功能

- 加入資料夾、樹狀瀏覽、搜尋
- 預覽播放、加入時間軸
- Loop、自動 Loop
- Windows Explorer 大視窗選資料夾

## 安裝

1. 用 [ZXP Installer](https://aescripts.com/learn/zxp-installer/) 安裝 `.zxp`
2. 重啟 After Effects
3. **Window → Extensions → PNG Seq Lite**

## 打包

```bash
./package-lite.sh
# → dist/lite/PNG-Seq-Lite-v1.0.0-*.zxp
```
