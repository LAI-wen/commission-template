<script lang="ts">
  import { untrack } from "svelte"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  type FieldErrors = {
    type_id?: string[]
    client_name?: string[]
    client_email?: string[]
    detail?: string[]
  }

  const types = $derived(data.types)
  const errors = $derived<FieldErrors>((form?.errors ?? {}) as FieldErrors)
  const values = $derived(form?.values)

  let selectedTypeId = $state(untrack(() => data.preselectedType?.id ?? ""))
  let currentPrice = $state(untrack(() => data.estimatedPrice))

  function onTypeChange(e: Event) {
    selectedTypeId = (e.target as HTMLSelectElement).value
    currentPrice = types.find(t => t.id === selectedTypeId)?.base_price ?? 0
  }
</script>

<svelte:head>
  <title>申請委託</title>
</svelte:head>

<main class="page">
  <div class="page-header">
    <h1 class="page-title">申請委託</h1>
    <p class="page-subtitle">填寫以下資料，送出後等待繪師確認</p>
  </div>

  <div class="form-grid">
    <form method="POST">
      <!-- 防機器人 honeypot（隱藏） -->
      <div class="honeypot">
        <input type="text" name="honeypot" tabindex="-1" autocomplete="off" />
      </div>

      <!-- 委託項目 -->
      <div class="form-section">
        <div class="form-section-title">委託項目</div>
        <div class="field" class:has-error={!!errors.type_id}>
          <label for="type_id">委託項目 *</label>
          <select
            id="type_id"
            name="type_id"
            value={selectedTypeId}
            onchange={onTypeChange}
            required
          >
            <option value="">請選擇</option>
            {#each types as type}
              <option value={type.id}>{type.name}（NT$ {type.base_price.toLocaleString()} 起）</option>
            {/each}
          </select>
          {#if errors.type_id}
            <span class="error-msg">{errors.type_id[0]}</span>
          {/if}
        </div>

        <!-- 預估金額（隱藏傳遞） -->
        <input type="hidden" name="estimated_price" value={currentPrice} />
        <input type="hidden" name="selected_options" value={data.preselectedOptions} />

        {#if currentPrice > 0}
          <div class="price-display">
            預估金額：<strong>NT$ {currentPrice.toLocaleString()}</strong>
            {#if selectedTypeId}
              <a href="/commission/{selectedTypeId}" class="recalc">重新估價</a>
            {/if}
          </div>
        {/if}
      </div>

      <!-- 聯絡資料 -->
      <div class="form-section">
        <div class="form-section-title">聯絡資料</div>

        <!-- 姓名 -->
        <div class="field" class:has-error={!!errors.client_name}>
          <label for="client_name">稱呼 *</label>
          <input
            id="client_name"
            name="client_name"
            type="text"
            placeholder="希望繪師怎麼稱呼你"
            value={String(values?.client_name ?? "")}
            required
          />
          {#if errors.client_name}
            <span class="error-msg">{errors.client_name[0]}</span>
          {/if}
        </div>

        <!-- Email -->
        <div class="field" class:has-error={!!errors.client_email}>
          <label for="client_email">Email *</label>
          <input
            id="client_email"
            name="client_email"
            type="email"
            placeholder="用於接收進度通知"
            value={String(values?.client_email ?? "")}
            required
          />
          {#if errors.client_email}
            <span class="error-msg">{errors.client_email[0]}</span>
          {/if}
        </div>
      </div>

      <!-- 需求說明 -->
      <div class="form-section">
        <div class="form-section-title">需求說明</div>
        <div class="field" class:has-error={!!errors.detail}>
          <label for="detail">需求說明 *</label>
          <textarea
            id="detail"
            name="detail"
            rows="6"
            placeholder="請描述角色設定、參考圖、特別要求等..."
            required
          >{String(values?.detail ?? "")}</textarea>
          {#if errors.detail}
            <span class="error-msg">{errors.detail[0]}</span>
          {/if}
        </div>
      </div>

      <button type="submit" class="submit-btn">送出委託申請</button>
    </form>

    <!-- 右側摘要卡 -->
    <div class="summary-panel">
      <div class="summary-header">委託摘要</div>
      <div class="summary-body">
        <span class="summary-total">NT$ {currentPrice > 0 ? currentPrice.toLocaleString() : '—'}</span>
        {#if selectedTypeId}
          <div class="summary-row">
            <span class="summary-label">項目</span>
            <span>{types.find(t => t.id === selectedTypeId)?.name ?? '—'}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</main>

<style>
.page { max-width: 900px; margin: 0 auto; padding: 0 1rem 4rem; }

.page-header {
  padding: 2.5rem 0 2rem;
  border-bottom: var(--border);
}
.page-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--blue);
}
.page-subtitle {
  margin-top: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  margin-top: 2rem;
  align-items: start;
}
.form-section { margin-bottom: 2rem; }
.form-section-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--color-text-secondary);
  border-bottom: var(--border);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.field { margin-bottom: 1.25rem; }
.field label {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink);
  margin-bottom: 0.4rem;
}
.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px 14px;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 15px;
  background: var(--white);
  color: var(--ink);
  outline: none;
  appearance: auto;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  box-shadow: var(--shadow-sm);
}
.field.has-error input,
.field.has-error textarea,
.field.has-error select {
  border-color: var(--red);
}
.error-msg {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--red);
  margin-top: 4px;
  display: block;
}

.price-display {
  padding: 1rem 1.25rem;
  background: var(--ink);
  color: var(--gold);
  border: var(--border);
  font-family: var(--font-display);
  font-size: 1.75rem;
  margin-bottom: 1.25rem;
}

.checkbox-group { display: flex; flex-direction: column; gap: 0.5rem; }
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--ink);
  cursor: pointer;
}
.checkbox-item input { accent-color: var(--blue); cursor: pointer; }

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: var(--red);
  color: var(--white);
  border: var(--border);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: transform 0.08s, box-shadow 0.08s;
  margin-top: 1.5rem;
}
.submit-btn:hover { transform: translate(-2px, -2px); box-shadow: var(--shadow-lg); }
.submit-btn:active { transform: translate(2px, 2px); box-shadow: none; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.honeypot { display: none; }

.summary-panel {
  background: var(--ink);
  color: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 1rem;
  overflow: hidden;
}
.summary-header {
  background: var(--blue);
  padding: 1rem 1.25rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
  border-bottom: var(--border);
  color: var(--white);
}
.summary-body { padding: 1.25rem; }
.summary-total {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--gold);
  display: block;
  margin: 1rem 0;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-family: var(--font-mono);
  font-size: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  opacity: 0.8;
}
.summary-label { color: var(--color-text-secondary); }

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .summary-panel { position: static; }
}
</style>
