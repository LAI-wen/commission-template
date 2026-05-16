<script lang="ts">
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte"

  let includeWorks      = $state(true)
  let includeTypeImages = $state(true)
  let exporting         = $state(false)
  let exportError       = $state('')

  let importFile   = $state<File | null>(null)
  let importing    = $state(false)
  let importResult = $state<{ stats: { tables: Record<string, number>; images: number } } | null>(null)
  let importError  = $state('')
  let confirmOpen  = $state(false)

  async function handleExport() {
    exporting = true
    exportError = ''
    try {
      const res = await fetch('/api/backup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeWorks, includeTypeImages }),
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      exportError = e instanceof Error ? e.message : String(e)
    } finally {
      exporting = false
    }
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    importFile = input.files?.[0] ?? null
    importResult = null
    importError = ''
  }

  async function doImport() {
    if (!importFile) return
    importing = true
    importResult = null
    importError = ''
    confirmOpen = false
    try {
      const form = new FormData()
      form.append('file', importFile)
      const res = await fetch('/api/backup/import', { method: 'POST', body: form })
      const json = await res.json() as any
      if (!json.ok) throw new Error(json.error ?? '匯入失敗')
      importResult = json
    } catch (e) {
      importError = e instanceof Error ? e.message : String(e)
    } finally {
      importing = false
    }
  }

  const totalRows = $derived(
    importResult
      ? Object.values(importResult.stats.tables).reduce((a, b) => a + b, 0)
      : 0
  )
</script>

<div class="page">
  <h1>備份與還原</h1>

  <!-- 匯出 -->
  <section class="section">
    <h2 class="section-title">匯出備份</h2>
    <p class="section-desc">將所有委託資料、設定、頁面模板打包成 ZIP 下載。</p>

    <div class="options">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={includeWorks} />
        <span>包含作品集圖片</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={includeTypeImages} />
        <span>包含委託類型預覽圖</span>
      </label>
    </div>

    <button class="btn btn-primary" onclick={handleExport} disabled={exporting}>
      {exporting ? '打包中…' : '下載備份'}
    </button>

    {#if exportError}
      <p class="msg-error">{exportError}</p>
    {/if}
  </section>

  <!-- 匯入 -->
  <section class="section section-danger-zone">
    <h2 class="section-title">還原備份</h2>

    <div class="warning-box">
      <strong>⚠ 注意：</strong>此操作將清除所有現有資料，包含委託紀錄、客戶資料、作品集。
      此操作不可逆，請先確認已下載最新備份。
    </div>

    <label class="file-label">
      <input type="file" accept=".zip" onchange={handleFileChange} />
    </label>

    {#if importFile}
      <p class="file-name">已選擇：{importFile.name}（{(importFile.size / 1024).toFixed(1)} KB）</p>
    {/if}

    <button
      class="btn btn-danger"
      disabled={!importFile || importing}
      onclick={() => { confirmOpen = true }}
    >
      {importing ? '還原中…' : '還原備份'}
    </button>

    {#if importResult}
      <div class="msg-success">
        還原完成：已寫入 {totalRows} 筆資料、{importResult.stats.images} 張圖片。
      </div>
    {/if}

    {#if importError}
      <p class="msg-error">{importError}</p>
    {/if}
  </section>
</div>

<ConfirmDialog
  open={confirmOpen}
  title="確認還原備份"
  body="此操作將清除所有現有資料並以備份內容覆蓋，不可逆。確定要繼續嗎？"
  confirmLabel="確定還原"
  cancelLabel="取消"
  danger={true}
  onconfirm={doImport}
  oncancel={() => { confirmOpen = false }}
/>

<style>
.page { max-width: 680px; }
.page h1 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: var(--ink);
}

.section {
  background: var(--white);
  border: var(--border);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-danger-zone { border-color: var(--red); }

.section-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink);
  margin: 0 0 0.4rem;
}

.section-desc {
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--ink) 60%, transparent);
  margin: 0 0 1.25rem;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.warning-box {
  background: color-mix(in srgb, var(--red) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--red) 40%, transparent);
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  line-height: 1.55;
  margin-bottom: 1.25rem;
  color: var(--ink);
}

.file-label {
  display: block;
  margin-bottom: 0.5rem;
}

.file-name {
  font-family: var(--font-mono);
  font-size: 12px;
  color: color-mix(in srgb, var(--ink) 55%, transparent);
  margin: 0 0 1rem;
}

.btn {
  padding: 0.55rem 1.25rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 700;
  border: var(--border);
  cursor: pointer;
  transition: transform 0.08s, box-shadow 0.08s;
  box-shadow: var(--shadow-sm);
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
.btn:not(:disabled):hover { transform: translate(-1px,-1px); box-shadow: var(--shadow-md); }

.btn-primary { background: var(--blue); color: #fff; }
.btn-danger  { background: var(--red);  color: #fff; margin-top: 0.5rem; }

.msg-error   { color: var(--red); font-size: 0.875rem; margin-top: 0.75rem; }
.msg-success {
  background: color-mix(in srgb, var(--blue) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--blue) 30%, transparent);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}
</style>
