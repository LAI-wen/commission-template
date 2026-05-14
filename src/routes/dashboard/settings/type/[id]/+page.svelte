<script lang="ts">
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const type = $derived(data.type)
  const options = $derived(data.options as any[])

  let editingOptionId = $state<string | null>(null)
</script>

<svelte:head>
  <title>{type ? `編輯項目 - ${type.name}` : "新增項目"}</title>
</svelte:head>

<div class="page">
  <a href="/dashboard/settings" class="back">← 返回設定</a>

  <header class="header">
    <h1>{type ? "編輯委託項目" : "新增委託項目"}</h1>
    {#if type}
      <form
        method="POST"
        action="?/deleteType"
        onsubmit={(e) => { if (!confirm('確定要刪除嗎？相關的加價選項也會被隱藏')) e.preventDefault() }}
      >
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

      <button type="submit" class="btn-save">儲存項目資訊</button>
    </form>
  </section>

  {#if type}
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
