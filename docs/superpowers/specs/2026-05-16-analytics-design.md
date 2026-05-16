# Analytics 計量儀表板設計

**日期：** 2026-05-16  
**狀態：** 已核准  
**範圍：** commission-template — 擴充 `/dashboard/stats`

---

## 目標

在現有統計頁新增三類計量指標：

1. **圖片儲存**：總上傳張數 + 總大小（MB）
2. **Email 寄件數**：本月數字 + 近 6 個月趨勢圖
3. **訪客流量**：連結到 Cloudflare Dashboard（不自建）

---

## KV 資料結構

| Key | 格式 | 說明 |
|-----|------|------|
| `image_count` | `"42"` | 總上傳圖片數（字串） |
| `image_size_bytes` | `"18432000"` | 總位元組（字串） |
| `email_count:YYYY-MM` | `"8"` | 指定月份寄件數，例如 `email_count:2026-05` |

**原子性說明：** KV 無原子加法，採用 `get → parse → +N → put` 模式。Solo creator 環境不會有並發衝突；drift 透過「重新計算」按鈕修正。

---

## 寫入邏輯

### 圖片計數

修改 `src/routes/api/upload/+server.ts`：

在本地 R2 `put()` 成功後，透過 `platform.context.waitUntil()` 非同步更新 KV（不阻塞回應）：

```typescript
platform.context.waitUntil(
  incrementImageStats(env.KV, file.size)
)
```

Hub 上傳路徑不更新本地 KV（圖片存在 Hub 的 R2，非本地）。

`incrementImageStats(kv, sizeBytes)` 邏輯：

```typescript
async function incrementImageStats(kv: KVNamespace, sizeBytes: number) {
  const [countStr, sizeStr] = await Promise.all([
    kv.get('image_count'),
    kv.get('image_size_bytes'),
  ])
  await Promise.all([
    kv.put('image_count', String((parseInt(countStr ?? '0') + 1))),
    kv.put('image_size_bytes', String((parseInt(sizeStr ?? '0') + sizeBytes))),
  ])
}
```

### Email 計數

修改 `src/lib/email.ts` 的 `dispatch()` 函式：

在 send 完成後（無論 hub 或 resend），更新當月 key：

```typescript
const month = new Date().toISOString().slice(0, 7)  // "2026-05"
const key = `email_count:${month}`
const prev = await env.KV.get(key)
await env.KV.put(key, String((parseInt(prev ?? '0') + 1)))
```

`dispatch()` 已有 `env` 參數，不需改 signature。只在有實際寄送動作時計數（`email_mode === 'none'` 直接 return，不會呼叫 dispatch）。

---

## 重算端點

`POST /api/admin/recalculate-storage`

- 需要 artist session
- 分頁呼叫 `env.R2.list()`（每頁最多 1000 筆，用 `cursor` 直到 `truncated === false`）
- 加總物件數量和 `size`
- 寫入 `image_count` 和 `image_size_bytes`
- 回傳 `{ ok: true, count: number, bytes: number }`
- 若 R2 未設定（`!env.R2`）回傳 `{ ok: false, error: 'R2 not configured' }`

---

## Stats 頁面修改

### `src/routes/dashboard/stats/+page.server.ts`

新增從 KV 讀取：

```typescript
function last6Months(): string[] {
  const months: string[] = []
  const d = new Date()
  for (let i = 5; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1)
    months.push(t.toISOString().slice(0, 7))
  }
  return months
}

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB
  const kv = platform!.env.KV
  const months = last6Months()

  const [[monthly, overall, topTypes], [imageCount, imageSizeBytes], emailCounts] =
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
    monthly, overall, topTypes: topTypes.results,
    imageCount: parseInt(imageCount ?? '0'),
    imageSizeBytes: parseInt(imageSizeBytes ?? '0'),
    emailMonthly,
  }
}
```

### `src/routes/dashboard/stats/+page.svelte` 新增內容

**總覽卡片區**（加在現有 4 張後）：

- 「圖片儲存」卡片：`{imageCount} 張 / {formatBytes(imageSizeBytes)}`，附「重新計算」小按鈕
- 「Email 本月」卡片：`{currentMonthEmailCount} 封`

**新 section**（加在「委託類型排名」後）：

- 「近 6 個月 Email 寄件數」長條圖（使用與現有 `.bar-chart` 相同 CSS）

**訪客流量卡片**（加在 Email 圖表後）：

```
訪客流量
由 Cloudflare Analytics 提供
[前往 Cloudflare Dashboard →]
```

`formatBytes(n)` 輔助函式：

```typescript
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
```

「重新計算」按鈕行為：
- `onclick` 發 `POST /api/admin/recalculate-storage`
- 完成後 `invalidateAll()` 刷新頁面資料
- 顯示 loading 狀態，完成後短暫顯示「✓ 已更新」

---

## 不在範圍內

- 訪客流量自建計數
- Email 寄送明細記錄（哪位客戶、何種類型）
- R2 儲存用量的歷史趨勢圖
- 自動定時重算儲存用量
