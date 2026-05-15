#!/usr/bin/env bash
set -euo pipefail

# Colors
G='\033[0;32m' Y='\033[1;33m' R='\033[0;31m' B='\033[0;34m' NC='\033[0m'
ok()   { echo -e "${G}✓${NC} $*"; }
info() { echo -e "${B}→${NC} $*"; }
warn() { echo -e "${Y}!${NC} $*"; }
err()  { echo -e "${R}✗${NC} $*" >&2; exit 1; }

echo ""
echo "🎨  委託網站一鍵部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check dependencies
command -v node &>/dev/null || err "找不到 Node.js，請先安裝 Node.js 22+"
command -v npm  &>/dev/null || err "找不到 npm"

# Ensure Node.js >= 22 (wrangler 4.x requirement)
NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
if [[ "$NODE_MAJOR" -lt 22 ]]; then
  warn "Node.js 版本過舊（目前 v$(node -v | tr -d v)），需要 22+，嘗試用 nvm 升級..."
  NVM_SH=""
  for p in "$HOME/.nvm/nvm.sh" "/usr/local/share/nvm/nvm.sh" "${NVM_DIR:-}/nvm.sh"; do
    [ -s "$p" ] && NVM_SH="$p" && break
  done

  if [ -n "$NVM_SH" ]; then
    # shellcheck source=/dev/null
    source "$NVM_SH"
    nvm install 22 --no-progress
    nvm use 22
    ok "已切換到 Node.js $(node -v)"
  else
    # fallback: install via NodeSource
    info "nvm 不可用，改用 NodeSource 安裝 Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - &>/dev/null
    sudo apt-get install -y nodejs &>/dev/null
    ok "已安裝 Node.js $(node -v)"
  fi
fi

# Check / prompt Cloudflare login
info "檢查 Cloudflare 登入狀態..."
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  ok "使用 CLOUDFLARE_API_TOKEN"
elif npx --yes wrangler whoami &>/dev/null 2>&1; then
  ok "已登入 Cloudflare（OAuth）"
else
  echo ""
  warn "找不到 Cloudflare 登入憑證。"
  echo "  在 Codespaces 請使用 API Token："
  echo "  1. 到 https://dash.cloudflare.com/profile/api-tokens 建立 Token（Edit Cloudflare Workers 模板）"
  echo "  2. GitHub Settings → Codespaces → New secret，名稱 CLOUDFLARE_API_TOKEN，貼上 token"
  echo "  3. 重新開啟 Codespace 後再執行此腳本"
  echo ""
  echo "  本機用戶執行：npx wrangler login"
  echo ""
  err "未登入 Cloudflare，請參考以上說明"
fi

echo ""

# ── 使用者輸入 ────────────────────────────────────────
read -rp "專案名稱（小寫英文 + 數字 + 連字號，例如 my-commission）: " PROJECT_NAME
[[ -z "$PROJECT_NAME" ]] && err "專案名稱不能為空"
[[ ! "$PROJECT_NAME" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] && \
  err "專案名稱只能包含小寫英文、數字和連字號，且不能以連字號開頭或結尾"

read -rsp "後台登入密碼: " DASHBOARD_PASSWORD
echo ""
[[ -z "$DASHBOARD_PASSWORD" ]] && err "密碼不能為空"

# Generate session secret (macOS / Linux compatible)
SESSION_SECRET=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 48 || openssl rand -hex 24)

DB_NAME="${PROJECT_NAME}-db"
KV_NAME="${PROJECT_NAME}-kv"
PAGES_URL="https://${PROJECT_NAME}.pages.dev"

echo ""

UUID_RE='[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'

# ── 1. 建立 D1 ────────────────────────────────────────
info "建立 D1 資料庫：${DB_NAME}..."
D1_OUT=$(npx wrangler d1 create "$DB_NAME" 2>&1) || true
DATABASE_ID=$(echo "$D1_OUT" | grep -oE "$UUID_RE" | head -1 || true)

if [[ -z "$DATABASE_ID" ]]; then
  warn "D1 建立失敗（可能已存在），嘗試取得現有 ID..."
  DATABASE_ID=$(npx wrangler d1 list 2>&1 \
    | grep -E "$DB_NAME" \
    | grep -oE "$UUID_RE" \
    | head -1 || true)
fi
[[ -z "$DATABASE_ID" ]] && err "無法取得 D1 database_id，請手動建立後重試"
ok "D1 database_id: ${DATABASE_ID}"

# ── 2. 建立 KV ────────────────────────────────────────
info "建立 KV Namespace：${KV_NAME}..."
KV_OUT=$(npx wrangler kv namespace create "$KV_NAME" 2>&1) || true
KV_ID=$(echo "$KV_OUT" | grep -oE '"id":\s*"[a-f0-9]+"' | grep -oE '"[a-f0-9]+"' | tail -1 | tr -d '"' || true)

if [[ -z "$KV_ID" ]]; then
  warn "KV 建立失敗（可能已存在），嘗試取得現有 ID..."
  KV_ID=$(npx wrangler kv namespace list 2>&1 \
    | grep -A5 "\"$KV_NAME\"" \
    | grep -oE '"id":\s*"[a-f0-9]+"' \
    | grep -oE '"[a-f0-9]+"' \
    | tail -1 \
    | tr -d '"' || true)
fi
[[ -z "$KV_ID" ]] && err "無法取得 KV namespace_id，請手動建立後重試"
ok "KV namespace_id: ${KV_ID}"

# ── 3. 生成 wrangler.toml ────────────────────────────
info "生成 wrangler.toml..."
cat > wrangler.toml << TOMLEOF
name = "${PROJECT_NAME}"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".svelte-kit/cloudflare"

[[d1_databases]]
binding = "DB"
database_name = "${DB_NAME}"
database_id = "${DATABASE_ID}"

[[kv_namespaces]]
binding = "KV"
id = "${KV_ID}"

[vars]
ORIGIN = "${PAGES_URL}"
HUB_URL = "https://commission-hub.pages.dev"
TOMLEOF
ok "wrangler.toml 已寫入"

# ── 4. 建置 ──────────────────────────────────────────
info "安裝依賴並建置（約 1-2 分鐘）..."
npm install --silent
npm run build
ok "建置完成"

# ── 5. 部署 ──────────────────────────────────────────
info "部署到 Cloudflare Pages..."
npx wrangler pages deploy .svelte-kit/cloudflare --project-name "$PROJECT_NAME"
ok "部署完成"

# ── 6. 設定密鑰 ──────────────────────────────────────
info "設定密鑰（DASHBOARD_PASSWORD、SESSION_SECRET）..."
printf '%s' "$DASHBOARD_PASSWORD" | npx wrangler pages secret put DASHBOARD_PASSWORD \
  --project-name "$PROJECT_NAME"
printf '%s' "$SESSION_SECRET" | npx wrangler pages secret put SESSION_SECRET \
  --project-name "$PROJECT_NAME"
ok "密鑰設定完成"

# ── 完成 ─────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
ok "部署完成！"
echo ""
echo "  🌐 委託網站：${PAGES_URL}"
echo "  🔑 後台登入：${PAGES_URL}/dashboard/login"
echo "       密碼：你剛才輸入的密碼"
echo ""
echo "  接下來："
echo "  1. 登入後台，填寫基本資料和委託類型"
echo "  2. 到 commission-hub.pages.dev 登入並取得 Hub Token"
echo "  3. 後台 Dashboard → Settings → 貼上 Hub Token，完成連結"
echo ""
