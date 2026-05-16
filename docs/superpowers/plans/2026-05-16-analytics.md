# Analytics 計量儀表板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/dashboard/stats` 新增圖片儲存量、Email 寄件數、訪客流量三類計量，透過 KV 寫入時計數 + R2 重算端點實現。

**Architecture:** 建立 `src/lib/analytics.ts` 集中所有 KV 讀寫邏輯；upload handler 和 email dispatch 在成功後各自呼叫 KV 寫入（非阻塞）；stats 頁 server load 以分組 Promise.all 一次讀完所有 KV key；前端新增兩張卡片、一個 Email 趨勢圖和一個 Cloudflare 連結區塊。

**Tech Stack:** SvelteKit 5 (Svelte 5 runes), Cloudflare Workers KV, Cloudflare R2, `$app/navigation` invalidateAll

---

## File Map

| 狀態 | 路徑 | 說明 |
|------|------|------|
| 建立 | `src/lib/analytics.ts` | KV 讀寫工具：incrementImageStats, incrementEmailCount, last6Months, formatBytes |
| 建立 | `src/routes/api/admin/recalculate-storage/+server.ts` | R2 全掃描重算並寫入 KV |
| 修改 | `src/routes/api/upload/+server.ts` | 本地 R2 put 後非同步更新 KV |
| 修改 | `src/lib/email.ts` | dispatch() 發送後更新當月 Email KV |
| 修改 | `src/routes/dashboard/stats/+page.server.ts` | 加入 KV 讀取，回傳 imageCount/imageSizeBytes/emailMonthly |
| 修改 | `src/routes/dashboard/stats/+page.svelte` | 新增儲存卡片、Email 卡片、Email 趨勢圖、Cloudflare 連結 |
| 建立 | `scripts/analytics.test.mjs` | 純函式單元測試（last6Months, formatBytes） |

---

### Task 1: 建立 `src/lib/analytics.ts`

**Files:**
- Create: `src/lib/analytics.ts`

- [ ] **Step 1: 建立檔案**

```typescript
export function last6Months(): string[] {
  const months: string[] = []
  const d = new Date()
  for (let i = 5; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1)
    months.push(t.toISOString().slice(0, 7))
  }
  return months
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export async function incrementImageStats(kv: KVNamespace, sizeBytes: number): Promise<void> {
  const [countStr, sizeStr] = await Promise.all([
    kv.get('image_count'),
    kv.get('image_size_bytes'),
  ])
  await Promise.all([
    kv.put('image_count', String(parseInt(countStr ?? '0') + 1)),
    kv.put('image_size_bytes', String(parseInt(sizeStr ?? '0') + sizeBytes)),
  ])
}

export async function incrementEmailCount(kv: KVNamespace): Promise<void> {
  const month = new Date().toISOString().slice(0, 7)
  const key = `email_count:${month}`
  const prev = await kv.get(key)
  await kv.put(key, String(parseInt(prev ?? '0') + 1))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/analytics.ts
git commit -m "feat: add analytics KV helpers (incrementImageStats, incrementEmailCount, last6Months, formatBytes)"
```

---

### Task 2: 撰寫並執行純函式測試

**Files:**
- Create: `scripts/analytics.test.mjs`

- [ ] **Step 1: 撰寫測試（先寫，此時預期失敗因為還沒有可 import 的 JS）**

注意：`src/lib/analytics.ts` 是 TypeScript，測試直接複製純函式邏輯來驗證行為。

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'

// 複製純函式以脫離 TS 環境測試（KV 函式有 Workers runtime 依賴，不在此測）
function last6Months() {
  const months = []
  const d = new Date()
  for (let i = 5; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1)
    months.push(t.toISOString().slice(0, 7))
  }
  return months
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

test('last6Months returns 6 entries', () => {
  const months = last6Months()
  assert.equal(months.length, 6)
})

test('last6Months ends with current month', () => {
  const months = last6Months()
  const now = new Date().toISOString().slice(0, 7)
  assert.equal(months[5], now)
})

test('last6Months entries are in ascending order', () => {
  const months = last6Months()
  for (let i = 1; i < months.length; i++) {
    assert.ok(months[i] > months[i - 1], `${months[i]} should be after ${months[i - 1]}`)
  }
})

test('formatBytes: bytes', () => {
  assert.equal(formatBytes(512), '512 B')
})

test('formatBytes: KB', () => {
  assert.equal(formatBytes(2048), '2.0 KB')
})

test('formatBytes: MB', () => {
  assert.equal(formatBytes(18432000), '17.6 MB')
})

test('formatBytes: GB', () => {
  assert.equal(formatBytes(2 * 1024 * 1024 * 1024), '2.00 GB')
})
```

- [ ] **Step 2: 更新 package.json test script 加入此測試檔**

開啟 `package.json`，找到 test script，加入 `scripts/analytics.test.mjs`（與 backup.test.mjs 並列）：

```json
"test": "node --test scripts/backup.test.mjs scripts/analytics.test.mjs"
```

- [ ] **Step 3: 執行測試確認全部通過**

```bash
cd /Users/wen/Documents/Development/COMMISSION-WEB/commission-template
npm test
```

預期：所有測試（backup + analytics）全部通過，analytics 測試 7 個 PASS。

- [ ] **Step 4: Commit**

```bash
git add scripts/analytics.test.mjs package.json
git commit -m "test: add analytics pure function tests (last6Months, formatBytes)"
```

---

### Task 3: 建立重算端點 `src/routes/api/admin/recalculate-storage/+server.ts`

**Files:**
- Create: `src/routes/api/admin/recalculate-storage/+server.ts`

- [ ] **Step 1: 建立端點**

```typescript
import { validateArtistSession } from "$lib/auth"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env

  const isArtist = await validateArtistSession(request, env)
  if (!isArtist) return new Response("Unauthorized", { status: 401 })

  if (!env.R2) return Response.json({ ok: false, error: 'R2 not configured' })

  let count = 0
  let bytes = 0
  let cursor: string | undefined

  do {
    const listed = await env.R2.list({ cursor, limit: 1000 })
    for (const obj of listed.objects) {
      count++
      bytes += obj.size
    }
    cursor = listed.truncated ? listed.cursor : undefined
  } while (cursor)

  await Promise.all([
    env.KV.put('image_count', String(count)),
    env.KV.put('image_size_bytes', String(bytes)),
  ])

  return Response.json({ ok: true, count, bytes })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/api/admin/recalculate-storage/+server.ts
git commit -m "feat: add recalculate-storage endpoint (paginated R2 scan → KV)"
```

---

### Task 4: 修改上傳端點，寫入時更新 KV

**Files:**
- Modify: `src/routes/api/upload/+server.ts:1-60`

- [ ] **Step 1: 加入 import 和 waitUntil 呼叫**

在 `src/routes/api/upload/+server.ts` 頂部加入 import：

```typescript
import { incrementImageStats } from "$lib/analytics"
```

（加在現有 import 之後）

在 `await env.R2.put(...)` 之後、`const url = ...` 之前加入：

```typescript
  if (env.KV) {
    platform!.context.waitUntil(incrementImageStats(env.KV, file.size))
  }
```

修改後整段本地 R2 區塊（第 48 行起）如下：

```typescript
  // Fall back to local R2
  if (!env.R2) return new Response("No storage configured", { status: 503 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const key = `${nanoid()}.${ext}`

  await env.R2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  })

  if (env.KV) {
    platform!.context.waitUntil(incrementImageStats(env.KV, file.size))
  }

  const url = `${env.ORIGIN}/api/assets/${key}`
  return Response.json({ url, key })
```

- [ ] **Step 2: 確認 TypeScript 不報錯**

```bash
cd /Users/wen/Documents/Development/COMMISSION-WEB/commission-template
npx tsc --noEmit
```

預期：無錯誤（或只有既有的非新增錯誤）。

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/upload/+server.ts
git commit -m "feat: increment KV image stats on local R2 upload (non-blocking)"
```

---

### Task 5: 修改 email dispatch 寫入月份 Email 計數

**Files:**
- Modify: `src/lib/email.ts:118-144`

- [ ] **Step 1: 加入 import**

在 `src/lib/email.ts` 第一行 import 之後加入：

```typescript
import { incrementEmailCount } from "./analytics"
```

- [ ] **Step 2: 重構 dispatch() 使用 sent flag**

將現有 `dispatch()` 函式（第 118–144 行）改為：

```typescript
async function dispatch(
  env: Env,
  creator: Record<string, unknown>,
  payload: EmailPayload
) {
  const mode = creator.email_mode as string
  let sent = false

  if (mode === "resend" && creator.resend_api_key) {
    await sendViaResend(
      creator.resend_api_key as string,
      (creator.resend_from as string | null) || "onboarding@resend.dev",
      payload
    )
    sent = true
  } else if (mode === "hub" && env.HUB_URL && creator.hub_token) {
    await fetch(`${env.HUB_URL}/api/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-token": creator.hub_token as string,
      },
      body: JSON.stringify(payload),
    }).catch(e => console.error("Hub relay error:", e))
    sent = true
  }

  if (sent && env.KV) {
    await incrementEmailCount(env.KV)
  }
}
```

- [ ] **Step 3: 確認 TypeScript 不報錯**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: increment monthly email KV counter after each dispatch"
```

---

### Task 6: 修改 stats page server load

**Files:**
- Modify: `src/routes/dashboard/stats/+page.server.ts`

- [ ] **Step 1: 完整替換 `+page.server.ts`**

```typescript
import { getMonthlyStats, getOverallStats, getTopCommissionTypes } from "$lib/db"
import { last6Months } from "$lib/analytics"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const kv = platform!.env.KV
  const months = last6Months()

  const [[monthly, overall, topTypesResult], [imageCountStr, imageSizeBytesStr], emailCounts] =
    await Promise.all([
      Promise.all([getMonthlyStats(db, 6), getOverallStats(db), getTopCommissionTypes(db)]),
      Promise.all([kv.get('image_count'), kv.get('image_size_bytes')]),
      Promise.all(months.map(m => kv.get(`email_count:${m}`))),
    ])

  const emailMonthly = months.map((month, i) => ({
    month,
    count: parseInt(emailCounts[i] ?? '0'),
  }))

  return {
    monthly,
    overall,
    topTypes: topTypesResult.results,
    imageCount: parseInt(imageCountStr ?? '0'),
    imageSizeBytes: parseInt(imageSizeBytesStr ?? '0'),
    emailMonthly,
  }
}
```

- [ ] **Step 2: 確認 TypeScript 不報錯**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/dashboard/stats/+page.server.ts
git commit -m "feat: load image storage and email monthly stats from KV in stats page"
```

---

### Task 7: 修改 stats page 前端，新增計量區塊

**Files:**
- Modify: `src/routes/dashboard/stats/+page.svelte`

- [ ] **Step 1: 更新 `<script>` 區塊**

將現有 `<script lang="ts">` 區塊替換為以下（新增 import 和衍生值）：

```typescript
<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import { formatBytes } from "$lib/analytics"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  const monthly = $derived(data.monthly)
  const overall = $derived(data.overall)
  const topTypes = $derived(data.topTypes)
  const emailMonthly = $derived(data.emailMonthly)
  const imageCount = $derived(data.imageCount)
  const imageSizeBytes = $derived(data.imageSizeBytes)

  function formatMonth(ym: string) {
    const [, m] = ym.split("-")
    return `${m}月`
  }

  const maxTotal = $derived(Math.max(...monthly.map(m => m.total), 1))
  const maxRevenue = $derived(Math.max(...monthly.map(m => m.revenue), 1))
  const maxEmail = $derived(Math.max(...emailMonthly.map(m => m.count), 1))

  const currentYear = new Date().getFullYear()
  const yearRevenue = $derived(
    monthly
      .filter(m => m.month.startsWith(String(currentYear)))
      .reduce((sum, m) => sum + m.revenue, 0)
  )

  const currentMonthEmail = $derived(
    emailMonthly.length > 0 ? emailMonthly[emailMonthly.length - 1].count : 0
  )

  let recalcLoading = $state(false)
  let recalcDone = $state(false)

  async function recalculate() {
    recalcLoading = true
    recalcDone = false
    try {
      const res = await fetch('/api/admin/recalculate-storage', { method: 'POST' })
      if (res.ok) {
        recalcDone = true
        await invalidateAll()
        setTimeout(() => { recalcDone = false }, 2000)
      }
    } finally {
      recalcLoading = false
    }
  }
</script>
```

- [ ] **Step 2: 在 `.overview-grid` 內加入兩張新卡片**

在現有的 4 張 `.stat-card`（總委託數、接受率、已完成、累計收入）**之後**加入：

```html
    <div class="stat-card">
      <span class="stat-label">
        圖片儲存
        <button
          class="recalc-btn"
          onclick={recalculate}
          disabled={recalcLoading}
          title="重新計算"
        >
          {#if recalcDone}✓{:else if recalcLoading}…{:else}↺{/if}
        </button>
      </span>
      <span class="stat-value small">{imageCount} 張</span>
      <span class="stat-sub">{formatBytes(imageSizeBytes)}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Email 本月</span>
      <span class="stat-value">{currentMonthEmail}</span>
      <span class="stat-sub">封</span>
    </div>
```

- [ ] **Step 3: 在「委託類型排名」section 之後加入 Email 趨勢圖 section**

```html
  <!-- 近 6 個月 Email 寄件數 -->
  <section class="section">
    <h2>近 6 個月 Email 寄件數</h2>
    <div class="bar-chart">
      {#each emailMonthly as m}
        <div class="bar-col">
          <div class="bar-wrap">
            <div
              class="bar email"
              style="height: {(m.count / maxEmail * 100).toFixed(1)}%"
              title="{m.count} 封"
            ></div>
          </div>
          <span class="bar-label">{formatMonth(m.month)}</span>
          <span class="bar-value">{m.count > 0 ? m.count : '—'}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- 訪客流量 -->
  <section class="section">
    <h2>訪客流量</h2>
    <p class="cf-desc">由 Cloudflare Analytics 提供</p>
    <a
      href="https://dash.cloudflare.com/"
      target="_blank"
      rel="noopener noreferrer"
      class="cf-link"
    >
      前往 Cloudflare Dashboard →
    </a>
  </section>
```

- [ ] **Step 4: 在 `<style>` 中加入新 CSS**

在現有 `.empty { ... }` 區塊後加入：

```css
  .stat-value.small { font-size: 1.2rem; }
  .stat-sub { font-size: 0.75rem; color: var(--color-text-secondary); }

  .recalc-btn {
    background: none; border: none; cursor: pointer;
    font-size: 0.75rem; color: var(--color-text-tertiary);
    padding: 0 0.15rem; margin-left: 0.25rem;
    opacity: 0.7;
  }
  .recalc-btn:hover { opacity: 1; }
  .recalc-btn:disabled { cursor: default; }

  .bar.email { background: #f59e0b; }

  .cf-desc { font-size: 0.8rem; color: var(--color-text-secondary); margin: 0; }
  .cf-link {
    font-size: 0.85rem; color: var(--color-text-primary);
    text-decoration: none; border-bottom: 1px solid var(--color-border-tertiary);
    padding-bottom: 1px; width: fit-content;
  }
  .cf-link:hover { border-bottom-color: var(--color-border-primary); }
```

- [ ] **Step 5: 確認 TypeScript 不報錯**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/routes/dashboard/stats/+page.svelte
git commit -m "feat: add image storage, email stats, and Cloudflare link to stats dashboard"
```

---

## Self-Review

**Spec coverage check:**
- ✅ 圖片儲存卡片（imageCount + formatBytes） → Task 7 Step 2
- ✅ 重新計算按鈕 + invalidateAll → Task 7 Step 1 (recalculate function) + Step 2
- ✅ Email 本月卡片 → Task 7 Step 2
- ✅ 近 6 個月 Email 長條圖（同 .bar-chart CSS） → Task 7 Step 3
- ✅ 訪客流量卡片 + Cloudflare Dashboard 連結 → Task 7 Step 3
- ✅ KV key: image_count, image_size_bytes, email_count:YYYY-MM → Task 1
- ✅ incrementImageStats get→parse→put → Task 1
- ✅ incrementEmailCount 當月 key → Task 1
- ✅ platform.context.waitUntil 非阻塞 → Task 4
- ✅ Hub 路徑不計數（guard 在 R2 put 之後） → Task 4
- ✅ email_mode === 'none' 不計數（因 dispatch 不被呼叫） → Task 5（sent flag 確保 none 模式不進 dispatch）
- ✅ POST /api/admin/recalculate-storage artist session + R2.list pagination + cursor → Task 3
- ✅ R2 未設定 → `{ ok: false, error: 'R2 not configured' }` → Task 3
- ✅ last6Months() 純函式 → Task 1, tested Task 2
- ✅ formatBytes 輔助 → Task 1, tested Task 2
- ✅ grouped Promise.all KV reads in server load → Task 6

**Placeholder scan:** 無 TBD 或 TODO。

**Type consistency:**
- `incrementImageStats(kv: KVNamespace, sizeBytes: number)` — Task 1 定義，Task 4 使用 ✅
- `incrementEmailCount(kv: KVNamespace)` — Task 1 定義，Task 5 使用 ✅
- `last6Months(): string[]` — Task 1 定義，Task 6 使用 ✅
- `formatBytes(bytes: number): string` — Task 1 定義，Task 7 import 使用 ✅
- `emailMonthly: { month: string, count: number }[]` — Task 6 回傳，Task 7 消費 ✅
