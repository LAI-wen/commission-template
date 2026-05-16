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
