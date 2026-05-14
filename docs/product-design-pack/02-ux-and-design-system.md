# 02. UX 與視覺規範 (UX & Design System)

## 1. 品牌世界觀
*   **核心概念**：每位創作者都有自己的「工作室 (Atelier)」，平台是將這些工作室串連起來的入口。
*   **品牌情緒**：安心感、創作感、專業、溫柔、自由。

## 2. 視覺系統 (Design System)
*   **風格方向**：Minimal Creative SaaS / Soft UI。
*   **配色方案 (Palette)**：
    *   `Ink Black` (#1A1A1A) - 穩定感、專業。
    *   `Warm White` (#FBFBFA) - 紙張感、舒適。
    *   `Brand Gold` (#C89B7B) - 溫潤、高級感。
*   **字型規範**：
    *   標題：Playfair Display (Serif) / Geist (Sans)。
    *   內文：Inter / Noto Sans TC。
*   **圓角規範**：16px ~ 24px (Large Rounded)。

## 3. 佈局邏輯：Bento Grid
*   **網格系統**：採用 3 欄式設計。
*   **區塊寬度**：支援 1 欄 (Small), 2 欄 (Medium), 3 欄 (Full Width) 動態調整。
*   **Notion 風格標頭**：大型封面圖 + 圓角方框頭像 + 資訊標籤 (Badges)。

## 4. 雙語支援 (Bilingual UX)
*   **語系切換**：右上方固定式 Switcher (繁中/EN)。
*   **資料結構**：欄位支援 `{ zh: string, en: string }` 格式。
*   **編輯體驗**：開啟雙語模式後，編輯欄位自動拆分為對稱的雙語輸入框。

## 5. 核心 UX 互動
*   **手勢底板 (Bottom Sheet)**：支援下滑關閉、阻力回饋，優化行動端體驗。
*   **動態插入點**：區塊間 `(+)` 提示線，實現所見即所得的編輯感。
*   **草稿標記系統**：點擊圖片建立 Pin 留言。
