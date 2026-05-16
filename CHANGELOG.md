## v2026-05-16.8

### ✨ 新功能
- increment KV image stats on local R2 upload (non-blocking)
- add recalculate-storage endpoint (paginated R2 scan → KV)

### 📝 其他
- update CHANGELOG.md [skip ci]

<!-- changelog-hash: 6922c2f80edfd38373311348f68319b2792b0f8e -->
## v2026-05-16.7

### ✨ 新功能
- add analytics KV helpers (incrementImageStats, incrementEmailCount, last6Months, formatBytes)
- sidebar 新增備份連結
- 新增備份還原頁面
- 新增備份匯入 API
- 新增備份匯出 API
- 新增備份核心工具

### 🐛 修復
- 修復編輯器初始化 effect 無限循環
- use UTC in last6Months to avoid off-by-one in UTC+8 timezone
- 備份匯入加上大小限制與 R2 錯誤回報
- 改善匯入圖片計數方式
- 修正備份錯誤處理

### 📝 其他
- add analytics dashboard implementation plan
- 新增計量儀表板設計文件
- 新增 ZIP 備份用 fflate
- update CHANGELOG.md [skip ci]

<!-- changelog-hash: 37514b95f5d7129b0175a5cc8bea8b09bd3b2f8c -->
## v2026-05-16.6

### ✨ 新功能
- 表情反應計數持久化至資料庫

### 📝 其他
- update CHANGELOG.md [skip ci]

<!-- changelog-hash: ea8148a25504c77e12d8509ca290f15fb0cc94a0 -->
## v2026-05-16.5

### ✨ 新功能
- add new block types (notice, social, faq, terms, pricing, reactions) to card editor and preview

### 📝 其他
- update CHANGELOG.md [skip ci]

<!-- changelog-hash: f7397cd2396011a84d25337f7b4550cb54398c50 -->
## v2026-05-16.4

### ✨ 新功能
- 重設 Discord 嵌入版面
- add Email 通知設定 section to settings page
- load email settings and add saveEmail action with API key validation
- add resend_from column to creators table

### 🐛 修復
- read resend_from from DB instead of hardcoded test address

### 📝 其他
- update CHANGELOG.md [skip ci]

<!-- changelog-hash: 8235f75cd72cd57d1f5e380951e3adc0a8528c82 -->
## v2026-05-16.3

### ✨ 新功能
- 移除表符、改用純文字排版

### 📝 其他
- update CHANGELOG.md [skip ci]

<!-- changelog-hash: 2dab5892e5dba035c1f5dfa4e95e1c27a1bb9b5f -->
## v2026-05-16.2

### ✨ 新功能
- 支援中文備註格式

### 📝 其他
- update CHANGELOG.md [skip ci]

<!-- changelog-hash: 67ae49139394d861778dd32cf2a5c1bdaa9962f6 -->
## v2026-05-16.1

### 🐛 修復
- unify localStorage draft keys, card_draft takes priority on load

### 📝 其他
- update CHANGELOG.md [skip ci]

<!-- changelog-hash: 910b049a3cd56fd3b03590ce0cb50d98db47ad81 -->
## v2026-05-16

### ✨ 新功能
- add GitHub Actions workflow for auto-posting
- add changelog script with full test suite
- show unsaved badge on save button in CardEditor
- block navigation when CardEditor has unsaved changes
- auto-draft to localStorage (2s debounce) in CardEditor
- track dirty state in CardEditor via snapshot comparison
- auto-compress images to WebP on upload
- add ColumnsBlock component
- columns block + 9 new block types
- markdown text, gallery upload, real queue data
- add size and alignment controls for name, text, image blocks
- custom palette picker, fix avatar opacity, add 0px border width
- full GlobalDesign editor in settings page
- GlobalDesignPanel accordion + per-section scroll
- read HUB_URL from env, add setup.sh one-click deploy script
- commission type image management — upload/delete preview images per type
- pre-populate creator data, dynamic commission types, fix GlobalDesignPanel scroll
- global design panel — background, font, theme palette, layout width
- anon box backend, image upload, homepage CardPreview rewrite, editor fixes
- complete card editor UI — faithful Svelte 5 port of card-editor-v3
- route image uploads through hub when HUB_URL is configured
- add sticky public navigation bar with ACS design
- implement R2 delivery system with KV time-limited download tokens
- add /status Email search page
- expand Kanban to 5 columns (pendingPayment, inProgress, revision, completed, delivered)
- add delivered status and delivery fields via migration

### 🐛 修復
- redeploy after setting secrets so DASHBOARD_PASSWORD takes effect
- update deploy script to use wrangler pages deploy, add update script
- setup.sh Node version check, Cloudflare auth, upload CSRF header
- editor loads from DB, public page reads DB only
- avatar opacity controls background only, not the image
- redirect back to originating page after type delete/save
- patch adapter-cloudflare to skip wrangler load on CF Pages
- global design panel closes immediately after opening
- sidebar hidden by editor-bg fixed overlay
- move svelte:head outside {#if} block in GlobalDesignPanel, fix onpatch type
- run ensureMigrated on homepage load to handle uninitialized DB
- strip wrangler.jsonc to fork-friendly config
- nav login link points to /dashboard/login instead of /api/auth
- resolve TypeScript errors for Cloudflare Pages build
- add keyboard accessibility and aria labels to /track/[id]
- remove dead CSS, fix lightbox role, add focus-visible styles in /works
- update apply/done HTML template to match ACS CSS spec
- update HTML class names to match new ACS CSS in commission and apply pages
- remove dead import, use ACS tokens for hardcoded colours, fix InsertionPoint hover

### 📝 其他
- add empty CHANGELOG.md
- redesign 外觀主題 into 3-tab layout (配色/字型/版面)
- reorganize settings pages and fix login serialization error

<!-- changelog-hash: 27979d949e98440c7fd153a05dc63cb10b6f1ef0 -->
