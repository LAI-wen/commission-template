# 04. 技術藍圖與架構 (Technical Blueprint)

## 1. 系統架構：去中心化思維
*   **核心架構**：聚合平台 (Frontend/API) + 創作者個人網站 (Dynamic Rendering)。
*   **基礎設施**：Cloudflare 生態系。
    *   **Computing**: Cloudflare Workers (Fast & Edge).
    *   **Database**: D1 (SQL) - 創作者資料隔離儲存。
    *   **Storage**: R2 (S3 compatible) - 作品與草稿儲存。
    *   **Caching**: KV - 設定與 Session 緩存。

## 2. 資料模型 (ERD 核心)
*   `User`：基本帳號資訊。
*   `CreatorProfile`：`page_config` (JSON 儲存 Bento 配置), `theme` (JSON).
*   `CommissionType`：名稱、基礎價格、選項、範例圖片。
*   `Work`：圖片路徑、標籤、關聯項目。
*   `Order`：狀態 (ENUM), 關聯 Client, 價格紀錄。
*   `Draft`：版本號、圖片 R2 路徑。
*   `Feedback`：x/y 坐標、內容、時間戳。

## 3. 開發 Roadmap
*   **M1: Foundation**：Auth 系統、D1 連動、基礎名片渲染、雙語底層。
*   **M2: Commission Flow**：智慧表單、Email 通知連動、Dashboard Inbox。
*   **M3: Work Management**：R2 上傳、Masonry 作品集、作品管理 UI。
*   **M4: Polish & Beta**：聚合探索頁、排單拖曳 UI、Alpha 封測。

## 4. 安全與權限
*   **資料保護**：創作者 API Token 隔離。
*   **圖片安全**：草稿圖片可設定浮水印或過期連結。
*   **登入驗證**：支援 Google / Discord 社交登入。
