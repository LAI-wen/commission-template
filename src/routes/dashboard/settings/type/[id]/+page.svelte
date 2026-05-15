<script lang="ts">
  import type { PageData, ActionData } from "./$types"
  import { enhance } from "$app/forms"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const type = $derived(data.type)
  const options = $derived(data.options as any[])
  const images = $derived<string[]>(JSON.parse((data.type as any)?.preview_images ?? "[]"))
  const returnTo = $derived(data.returnTo ?? "/dashboard/settings")

  let editingOptionId = $state<string | null>(null)
  let uploading = $state(false)
  let uploadError = $state("")
</script>

<svelte:head>
  <title>{type ? `編輯項目 - ${type.name}` : "新增項目"}</title>
</svelte:head>

<div class="page">
  <a href={returnTo} class="back">← 返回</a>

  <header class="header">
    <h1>{type ? "編輯委託項目" : "新增委託項目"}</h1>
    {#if type}
      <form
        method="POST"
        action="?/deleteType"
        onsubmit={(e) => { if (!confirm('確定要刪除嗎？相關的加價選項也會被隱藏')) e.preventDefault() }}
      >
        <input type="hidden" name="returnTo" value={returnTo} />
        <button type="submit" class="btn-delete-type">刪除此項目</button>
      </form>
    {/if}
  </header>

  <section class="section">
    <h2>基本設定</h2>
    <form method="POST" action="?/saveType" class="type-form">
      <div class="field">
        <label for="name">項目名稱 *</label>
        <input id="name" name="name" type="text" value={type?.name ?? ""} required />
      </div>
      
      <div class="field">
        <label for="description">說明</label>
        <textarea id="description" name="description" rows="3">{type?.description ?? ""}</textarea>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="base_price">基本價格 (NT$)</label>
          <input id="base_price" name="base_price" type="number" value={type?.base_price ?? 0} required />
        </div>
        <div class="field">
          <label for="sort_order">排序</label>
          <input id="sort_order" name="sort_order" type="number" value={type?.sort_order ?? 0} />
        </div>
      </div>

      <input type="hidden" name="returnTo" value={returnTo} />
      <button type="submit" class="btn-save">儲存項目資訊</button>
    </form>
  </section>

  {#if type}
    <!-- ── 範例圖片 ── -->
    <section class="section">
      <h2>範例圖片</h2>
      <p class="section-hint">顯示在 /commission 頁的類型預覽輪播，建議上傳 3-5 張作品圖。</p>

      <div class="img-grid">
        {#each images as imgUrl, i}
          <div class="img-item">
            <img src={imgUrl} alt="預覽 {i + 1}" class="img-thumb" />
            <form method="POST" action="?/removeImage" use:enhance>
              <input type="hidden" name="url" value={imgUrl} />
              <button type="submit" class="img-del" aria-label="刪除">✕</button>
            </form>
          </div>
        {/each}

        <label class="img-add" class:uploading>
          {#if uploading}
            <span class="img-add-icon">⏳</span>
            <span>上傳中…</span>
          {:else}
            <span class="img-add-icon">＋</span>
            <span>新增圖片</span>
          {/if}
          <input type="file" accept="image/*" style="display:none;" disabled={uploading}
            onchange={async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (!file) return
              uploading = true; uploadError = ""
              const fd = new FormData(); fd.append("file", file)
              const res = await fetch("?/uploadImage", { method: "POST", body: fd })
              uploading = false
              if (!res.ok) uploadError = "上傳失敗，請重試"
              else location.reload()
            }} />
        </label>
      </div>
      {#if uploadError}<p class="upload-error">{uploadError}</p>{/if}
    </section>

    <section class="section">
      <h2>加價選項</h2>
      
      <div class="options-list">
        {#each options as opt}
          <div class="option-row">
            {#if editingOptionId === opt.id}
              <form method="POST" action="?/saveOption" class="opt-edit-form">
                <input type="hidden" name="option_id" value={opt.id} />
                <input name="label" type="text" value={opt.label} required />
                <select name="option_type" value={opt.option_type}>
                  <option value="add">固定加價 (+)</option>
                  <option value="multiply">倍率乘積 (×)</option>
                </select>
                {#if opt.option_type === 'add'}
                  <input name="price_delta" type="number" value={opt.price_delta} />
                {:else}
                  <input name="price_multiplier" type="number" step="0.1" value={opt.price_multiplier} />
                {/if}
                <div class="opt-actions">
                  <button type="submit" class="btn-save-opt">儲存</button>
                  <button type="button" class="btn-cancel" onclick={() => editingOptionId = null}>取消</button>
                </div>
              </form>
            {:else}
              <div class="opt-info">
                <span class="opt-label">{opt.label}</span>
                <span class="opt-value">
                  {opt.option_type === 'add' ? `+NT$ ${opt.price_delta.toLocaleString()}` : `×${opt.price_multiplier}`}
                </span>
              </div>
              <div class="opt-actions">
                <button type="button" class="btn-edit" onclick={() => editingOptionId = opt.id}>編輯</button>
                <form method="POST" action="?/deleteOption" class="inline-form" onsubmit={(e) => { if (!confirm('確定要刪除這個加價選項嗎？')) e.preventDefault() }}>
                  <input type="hidden" name="option_id" value={opt.id} />
                  <button type="submit" class="btn-delete">刪除</button>
                </form>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="add-option">
        <h3>新增選項</h3>
        <form method="POST" action="?/saveOption" class="opt-add-form">
          <div class="field">
            <label>標籤</label>
            <input name="label" type="text" placeholder="例：人物加一位" required />
          </div>
          <div class="field">
            <label>類型</label>
            <select name="option_type">
              <option value="add">固定加價 (+)</option>
              <option value="multiply">倍率乘積 (×)</option>
            </select>
          </div>
          <div class="field">
            <label>數值</label>
            <div class="input-group">
              <input name="price_delta" type="number" value="0" placeholder="加價金額" />
              <input name="price_multiplier" type="number" step="0.1" value="1.0" placeholder="倍率" />
            </div>
            <span class="hint">根據類型填寫其中一個</span>
          </div>
          <input type="hidden" name="sort_order" value={options.length} />
          <button type="submit" class="btn-add">+ 新增</button>
        </form>
      </div>
    </section>
  {/if}
</div>

<style>
  .section-hint { font-size: 0.8rem; color: var(--color-text-secondary); margin: -0.5rem 0 1rem; }

  .img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; }
  .img-item { position: relative; aspect-ratio: 3/4; border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); overflow: hidden; }
  .img-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
  .img-del { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none; cursor: pointer; font-size: 0.65rem; display: flex; align-items: center; justify-content: center; line-height: 1; opacity: 0; transition: opacity 0.15s; }
  .img-item:hover .img-del { opacity: 1; }
  .img-add { aspect-ratio: 3/4; border: 1.5px dashed var(--color-border-secondary); border-radius: var(--border-radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
  .img-add:hover { border-color: var(--color-text-primary); background: color-mix(in srgb, var(--color-text-primary) 4%, transparent); }
  .img-add.uploading { opacity: 0.6; cursor: not-allowed; }
  .img-add-icon { font-size: 1.5rem; line-height: 1; color: var(--color-text-secondary); }
  .img-add span:last-child { font-size: 0.75rem; color: var(--color-text-secondary); }
  .upload-error { font-size: 0.8rem; color: var(--color-text-danger); margin-top: 0.5rem; }

  .back { display: inline-block; font-size: 0.85rem; color: var(--color-text-secondary); text-decoration: none; margin-bottom: 1.5rem; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  h1 { font-size: 1.5rem; font-weight: 500; margin: 0; }
  h2 { font-size: 0.95rem; font-weight: 500; margin: 0 0 1.25rem; color: var(--color-text-secondary); }
  h3 { font-size: 0.85rem; font-weight: 500; margin: 0 0 0.75rem; }

  .section {
    background: var(--color-background-primary);
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-lg);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .type-form { display: flex; flex-direction: column; gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.4rem; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  label { font-size: 0.82rem; font-weight: 500; }
  input, textarea, select {
    padding: 0.6rem;
    border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md);
    font-size: 0.9rem;
    background: var(--color-background-primary);
    color: var(--color-text-primary);
  }
  .hint { font-size: 0.75rem; color: var(--color-text-tertiary); }

  .btn-save { align-self: flex-start; padding: 0.6rem 1.5rem; background: var(--color-text-primary); color: var(--color-background-primary); border: none; border-radius: var(--border-radius-md); font-weight: 500; cursor: pointer; }
  .btn-delete-type { padding: 0.4rem 0.75rem; background: none; border: 0.5px solid var(--color-background-danger); color: var(--color-text-danger); border-radius: var(--border-radius-md); font-size: 0.8rem; cursor: pointer; }

  .options-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
  .option-row { padding: 0.75rem; border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); display: flex; justify-content: space-between; align-items: center; }
  .opt-info { display: flex; flex-direction: column; gap: 0.2rem; }
  .opt-label { font-weight: 500; font-size: 0.9rem; }
  .opt-value { font-size: 0.85rem; color: var(--color-text-secondary); }
  .opt-actions { display: flex; gap: 0.5rem; }
  .btn-edit, .btn-delete, .btn-cancel { padding: 0.25rem 0.6rem; font-size: 0.8rem; border-radius: var(--border-radius-sm); cursor: pointer; }
  .btn-edit { background: none; border: 0.5px solid var(--color-border-secondary); color: var(--color-text-secondary); }
  .btn-delete { background: none; border: 0.5px solid var(--color-background-danger); color: var(--color-text-danger); }
  .btn-save-opt { padding: 0.25rem 0.6rem; font-size: 0.8rem; background: var(--color-text-primary); color: white; border: none; border-radius: var(--border-radius-sm); }
  
  .opt-edit-form { flex: 1; display: grid; grid-template-columns: 1fr 1fr 100px auto; gap: 0.5rem; align-items: center; }

  .add-option { border-top: 1px dashed var(--color-border-tertiary); padding-top: 1.5rem; }
  .opt-add-form { display: grid; grid-template-columns: 1fr 150px 1fr auto; gap: 1rem; align-items: flex-end; }
  .input-group { display: flex; gap: 0.5rem; }
  .btn-add { padding: 0.6rem 1rem; background: var(--color-text-primary); color: white; border: none; border-radius: var(--border-radius-md); cursor: pointer; }

  @media (max-width: 800px) {
    .opt-add-form { grid-template-columns: 1fr 1fr; }
    .btn-add { grid-column: span 2; }
  }
</style>
