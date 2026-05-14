<script lang="ts">
  import { untrack } from "svelte"
  import { enhance } from "$app/forms"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  type FieldErrors = {
    type_id?: string[]
    client_name?: string[]
    client_email?: string[]
    detail?: string[]
  }
  const errors  = $derived<FieldErrors>((form?.errors ?? {}) as FieldErrors)
  const fValues = $derived(form?.values)

  /* ── type metadata ── */
  const typeLabels: Record<string, string> = {
    bust:'BUST', halfbody:'HALF', fullbody:'FULL', fullpage:'FULL-PAGE',
    chibi:'CHIBI', doodle:'DOODLE', emote:'EMOTE',
  }
  const leadTimes: Record<string, string> = {
    bust:'7–10 天', halfbody:'10–14 天', fullbody:'14–21 天',
    fullpage:'21–28 天', chibi:'5–7 天', doodle:'3–5 天', emote:'7–10 天',
  }

  /* ── type selection ── */
  let selectedTypeId = $state(
    untrack(() => data.preselectedType?.id ?? data.types[0]?.id ?? "")
  )
  const selectedType  = $derived(data.types.find(t => t.id === selectedTypeId))
  const labelEn       = $derived(selectedType ? (typeLabels[selectedType.id] ?? selectedType.name.toUpperCase()) : '')
  const leadTime      = $derived(selectedType ? (leadTimes[selectedType.id] ?? '—') : '—')

  /* ── add-ons ── */
  const allAddons = [
    { id: 'bg',    label: '完整背景',        en: 'FULL BACKGROUND', price: 800  },
    { id: 'props', label: '額外道具',        en: 'EXTRA PROPS',     price: 300  },
    { id: 'sfx',   label: '光效/特效',       en: 'SFX',             price: 400  },
    { id: 'rush',  label: '加急 RUSH (5天)', en: 'RUSH (5 DAYS)',   price: 1200 },
    { id: 'psd',   label: '附 PSD 原檔',     en: 'PSD SOURCE',      price: 600  },
  ]
  let selectedAddons = $state(new Set<string>(untrack(() => data.preselectedAddons ?? [])))
  function toggleAddon(id: string) {
    const s = new Set(selectedAddons)
    s.has(id) ? s.delete(id) : s.add(id)
    selectedAddons = s
  }

  /* ── usage ── */
  let usage = $state<'personal' | 'commercial'>('personal')

  /* ── char count ── */
  const charMults = [
    { label: '1 角', factor: 1.0 },
    { label: '2 角', factor: 1.8 },
    { label: '3 角', factor: 2.5 },
  ]
  let charIdx = $state(untrack(() => data.preselectedChars ?? 0))

  /* ── price ── */
  const estimatedPrice = $derived.by(() => {
    if (!selectedType) return 0
    const base  = selectedType.base_price
    const extra = allAddons.filter(a => selectedAddons.has(a.id)).reduce((s,a) => s + a.price, 0)
    const usageMult = usage === 'commercial' ? 1.5 : 1
    return Math.round((base + extra) * charMults[charIdx].factor * usageMult)
  })

  const selectedOptions = $derived(JSON.stringify([...selectedAddons]))
  const activeAddons    = $derived(allAddons.filter(a => selectedAddons.has(a.id)))

  /* ── brief char count ── */
  let briefText = $state(String(fValues?.detail ?? ""))

  /* ── reference images ── */
  type Ref = { preview: string; name: string }
  let refs = $state<Ref[]>([])

  function onRefFile(e: Event, slot: number) {
    const input = e.target as HTMLInputElement
    const file  = input.files?.[0]
    if (!file) return
    if (refs[slot]) URL.revokeObjectURL(refs[slot].preview)
    const next = [...refs]
    next[slot] = { preview: URL.createObjectURL(file), name: file.name }
    refs = next
  }
  function removeRef(i: number) {
    URL.revokeObjectURL(refs[i]?.preview ?? "")
    const next = [...refs]
    next[i] = { preview: "", name: "" }
    refs = next
  }

  /* ── referrer options ── */
  const referrers = ['Twitter / X','Instagram','Pixiv','朋友介紹','Google搜尋','其他']
</script>

<svelte:head>
  <title>申請委託 · APPLY</title>
</svelte:head>

<div class="page-wrap">
  <div class="page-inner">

    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <span class="page-header-tag">★ COMMISSION APPLICATION · 委託申請</span>
        <h1 class="page-header-title">APPLY NOW</h1>
      </div>
      <a href="/commission" class="back-link">← 返回委託說明</a>
    </div>

    <div class="form-grid">
      <!-- ─────────── LEFT: FORM ─────────── -->
      <form
        method="POST"
        use:enhance
        class="form-col"
      >
        <input type="hidden" name="honeypot" value="" />
        <input type="hidden" name="selected_options" value={selectedOptions} />
        <input type="hidden" name="estimated_price"  value={estimatedPrice} />
        <input type="hidden" name="char_count"        value={charMults[charIdx].label} />

        <!-- 委託類型 -->
        <div class="field-group">
          <label class="field-label" for="type_id">
            ★ 委託類型 COMMISSION TYPE
            <span class="required">*</span>
          </label>
          <div class="select-wrap" class:has-error={!!errors.type_id}>
            <select
              id="type_id"
              name="type_id"
              bind:value={selectedTypeId}
            >
              {#each data.types as t, i}
                <option value={t.id}>
                  {String(i+1).padStart(2,'0')} · {typeLabels[t.id] ?? t.name.toUpperCase()} · {t.name} · 起 NT${t.base_price.toLocaleString()}
                </option>
              {/each}
            </select>
          </div>
          {#if errors.type_id}
            <p class="error-msg">{errors.type_id[0]}</p>
          {/if}
        </div>

        <!-- 加購選項 -->
        <div class="field-group">
          <div class="field-label-row">
            <span class="field-label">加購選項 ADD-ONS</span>
            <span class="field-note">已從詳情頁帶入</span>
          </div>
          <div class="addon-toggles">
            {#each allAddons as addon}
              <button
                type="button"
                class="addon-toggle"
                class:selected={selectedAddons.has(addon.id)}
                onclick={() => toggleAddon(addon.id)}
              >
                {selectedAddons.has(addon.id) ? '✓' : '+'} {addon.label} {addon.en} +${addon.price.toLocaleString()}
              </button>
            {/each}
          </div>
        </div>

        <!-- 使用用途 -->
        <div class="field-group">
          <span class="field-label">★ 使用用途 USAGE <span class="required">*</span></span>
          <div class="usage-row">
            <label class="usage-option" class:selected={usage === 'personal'}>
              <input type="radio" bind:group={usage} value="personal" name="usage" />
              <span class="usage-radio"></span>
              個人 PERSONAL
            </label>
            <label class="usage-option" class:selected={usage === 'commercial'}>
              <input type="radio" bind:group={usage} value="commercial" name="usage" />
              <span class="usage-radio"></span>
              商業 COMMERCIAL (+50%)
            </label>
          </div>
        </div>

        <!-- 角色數 -->
        <div class="field-group">
          <span class="field-label">角色數 CHARACTERS</span>
          <div class="char-row">
            {#each charMults as m, i}
              <button
                type="button"
                class="char-btn"
                class:active={charIdx === i}
                onclick={() => charIdx = i}
              >{m.label} ×{m.factor.toFixed(1)}</button>
            {/each}
          </div>
        </div>

        <!-- 預估金額 -->
        <div class="price-display">
          <span class="price-display-label">TOTAL · 即時計算</span>
          <span class="price-display-val">NT$ {estimatedPrice.toLocaleString()}</span>
        </div>

        <hr class="divider" />

        <!-- 稱呼 + Email -->
        <div class="field-row-2">
          <div class="field-group" class:has-error={!!errors.client_name}>
            <label class="field-label" for="client_name">★ 稱呼 NAME <span class="required">*</span></label>
            <input
              id="client_name"
              name="client_name"
              type="text"
              class="input"
              placeholder="希望繪師怎麼稱呼你"
              value={String(fValues?.client_name ?? "")}
              required
            />
            {#if errors.client_name}
              <p class="error-msg">{errors.client_name[0]}</p>
            {/if}
          </div>

          <div class="field-group" class:has-error={!!errors.client_email}>
            <label class="field-label" for="client_email">★ 聯絡 EMAIL <span class="required">*</span></label>
            <input
              id="client_email"
              name="client_email"
              type="email"
              class="input"
              placeholder="用於接收進度通知"
              value={String(fValues?.client_email ?? "")}
              required
            />
            {#if errors.client_email}
              <p class="error-msg">{errors.client_email[0]}</p>
            {/if}
          </div>
        </div>

        <!-- 希望交稿日 -->
        <div class="field-group">
          <label class="field-label" for="wish_date">希望交稿日 WISH DATE</label>
          <input
            id="wish_date"
            name="wish_date"
            type="date"
            class="input input--date"
          />
        </div>

        <!-- 需求說明 -->
        <div class="field-group" class:has-error={!!errors.detail}>
          <div class="field-label-row">
            <label class="field-label" for="detail">★ 需求說明 BRIEF <span class="required">*</span></label>
            <span class="field-note">
              MIN. 20 CHARS · 已填 {briefText.length}
            </span>
          </div>
          <textarea
            id="detail"
            name="detail"
            class="input input--textarea"
            rows="5"
            placeholder="請描述角色設定、氣氛、配色、特別要求..."
            bind:value={briefText}
            required
            minlength="20"
          ></textarea>
          {#if errors.detail}
            <p class="error-msg">{errors.detail[0]}</p>
          {/if}
        </div>

        <!-- 參考圖 -->
        <div class="field-group">
          <div class="field-label-row">
            <span class="field-label">參考圖 REFERENCES · 最多 5 張</span>
            <span class="field-note">JPG/PNG · 角色設定、氛圍參考</span>
          </div>
          <div class="ref-grid">
            {#each Array(5) as _, i}
              <div class="ref-slot">
                {#if refs[i]?.preview}
                  <img src={refs[i].preview} alt="ref {i+1}" class="ref-preview" />
                  <button type="button" class="ref-remove" onclick={() => removeRef(i)}>✕</button>
                {:else}
                  <label class="ref-drop">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      class="ref-input"
                      onchange={(e) => onRefFile(e, i)}
                    />
                    <span>+ DROP IMAGE</span>
                  </label>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- 特別備注 -->
        <div class="field-group">
          <label class="field-label" for="notes">特別備注 NOTES</label>
          <textarea
            id="notes"
            name="notes"
            class="input input--textarea"
            rows="3"
            placeholder="其他補充..."
          ></textarea>
        </div>

        <!-- 如何得知 -->
        <div class="field-group">
          <label class="field-label" for="referrer">如何得知 HOW DID YOU FIND ME?</label>
          <div class="select-wrap">
            <select id="referrer" name="referrer" class="input">
              <option value="">請選擇</option>
              {#each referrers as r}
                <option value={r}>{r}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- 同意條款 -->
        <label class="agree-row">
          <input type="checkbox" name="agreed" required class="agree-check" />
          <span>
            我已閱讀並同意
            <a href="/commission#rules" class="agree-link">委託規則 RULES</a>、版權說明與修改限制
            <span class="required">*</span>
          </span>
        </label>

        <!-- Buttons -->
        <div class="btn-row">
          <button type="submit" class="btn-submit">★ 送出申請 SUBMIT →</button>
          <button type="button" class="btn-draft">儲存草稿 SAVE DRAFT</button>
        </div>

        <p class="form-footer">
          HONEYPOT 防垃圾 · ENCRYPTED · 3 日內回覆
        </p>
      </form>

      <!-- ─────────── RIGHT: SUMMARY ─────────── -->
      <aside class="summary-panel">
        <div class="summary-tag">★ ORDER SUMMARY · 摘要</div>
        <h2 class="summary-type">
          {labelEn} · {selectedType?.name ?? '—'}
        </h2>

        <div class="summary-lines">
          <div class="summary-line">
            <span class="sl-label">基本 BASE</span>
            <span class="sl-val">NT$ {(selectedType?.base_price ?? 0).toLocaleString()}</span>
          </div>
          {#each activeAddons as addon}
            <div class="summary-line summary-line--addon">
              <span class="sl-label">+ {addon.label} {addon.en}</span>
              <span class="sl-val">+${addon.price.toLocaleString()}</span>
            </div>
          {/each}
          {#if usage === 'commercial'}
            <div class="summary-line summary-line--addon">
              <span class="sl-label">+ 商業授權 Commercial</span>
              <span class="sl-val">×1.5</span>
            </div>
          {/if}
          {#if charIdx > 0}
            <div class="summary-line summary-line--addon">
              <span class="sl-label">+ {charMults[charIdx].label}</span>
              <span class="sl-val">×{charMults[charIdx].factor.toFixed(1)}</span>
            </div>
          {/if}

          <div class="summary-line summary-line--meta">
            <span class="sl-label">使用用途</span>
            <span class="sl-val">{usage === 'commercial' ? 'COMMERCIAL' : 'PERSONAL'}</span>
          </div>
          <div class="summary-line summary-line--meta">
            <span class="sl-label">角色數</span>
            <span class="sl-val">{charMults[charIdx].label}</span>
          </div>
          <div class="summary-line summary-line--meta">
            <span class="sl-label">LEAD TIME</span>
            <span class="sl-val">{leadTime}</span>
          </div>
        </div>

        <div class="summary-total-box">
          <span class="summary-total-label">TOTAL · 預估</span>
          <span class="summary-total-val">NT$ {estimatedPrice.toLocaleString()}</span>
        </div>

        <p class="summary-note">* 預估金額為參考，繪師確認後正式報價</p>

        <div class="summary-barcode">
          <div class="barcode-lines"></div>
          <span class="barcode-label">DRAFT · APPLY</span>
        </div>
      </aside>
    </div>
  </div>
</div>

<style>
/* ── Layout ── */
.page-wrap {
  background: var(--color-background-secondary);
  min-height: 100vh;
  padding-bottom: 4rem;
}
.page-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* ── Page header ── */
.page-header {
  padding: 2rem 0 1.5rem;
  border-bottom: var(--border);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}
.page-header-tag {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--color-text-secondary);
  margin-bottom: 0.3rem;
}
.page-header-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--ink);
  line-height: 1;
}
.back-link {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  text-decoration: none;
  white-space: nowrap;
}
.back-link:hover { color: var(--blue); }

/* ── Grid ── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2.5rem;
  align-items: start;
}

/* ── Field groups ── */
.form-col { display: flex; flex-direction: column; gap: 0; }

.field-group {
  margin-bottom: 1.5rem;
}
.field-group.has-error .input { border-color: var(--red); }

.field-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ink);
  margin-bottom: 0.5rem;
}
.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}
.field-label-row .field-label { margin-bottom: 0; }
.field-note {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
}
.required { color: var(--red); margin-left: 2px; }
.error-msg {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--red);
  margin-top: 4px;
  letter-spacing: 0.05em;
}

/* ── Inputs ── */
.input {
  width: 100%;
  padding: 10px 14px;
  border: var(--border);
  background: var(--white);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 15px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  transition: box-shadow 0.1s;
}
.input:focus { box-shadow: var(--shadow-sm); }
.input--textarea { resize: vertical; }
.input--date { font-family: var(--font-mono); font-size: 14px; }

.select-wrap { position: relative; }
.select-wrap::after {
  content: '∨';
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--ink);
  pointer-events: none;
}
.select-wrap select { cursor: pointer; padding-right: 36px; }

.field-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ── Add-ons ── */
.addon-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.addon-toggle {
  padding: 0.45rem 0.875rem;
  background: var(--white);
  color: var(--ink);
  border: var(--border);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}
.addon-toggle.selected {
  background: var(--red);
  color: var(--white);
  border-color: var(--red);
}

/* ── Usage ── */
.usage-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.usage-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--white);
  border: var(--border);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: border-color 0.1s, background 0.1s;
}
.usage-option input[type="radio"] { display: none; }
.usage-radio {
  width: 16px; height: 16px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}
.usage-option.selected {
  border-color: var(--red);
  background: rgba(227,61,44,0.04);
}
.usage-option.selected .usage-radio {
  border-color: var(--red);
  background: var(--red);
}
.usage-option.selected .usage-radio::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: var(--white);
  border-radius: 50%;
}

/* ── Char count ── */
.char-row {
  display: flex;
  gap: 8px;
}
.char-btn {
  padding: 0.45rem 1.1rem;
  background: var(--white);
  color: var(--ink);
  border: var(--border);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
.char-btn.active {
  background: var(--ink);
  color: var(--white);
}

/* ── Price display ── */
.price-display {
  background: var(--ink);
  color: var(--white);
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border: var(--border);
}
.price-display-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  opacity: 0.55;
}
.price-display-val {
  font-family: var(--font-display);
  font-size: 1.75rem;
  color: var(--white);
  letter-spacing: 0.02em;
}

/* ── Divider ── */
.divider {
  border: none;
  border-top: 1px dashed var(--color-border-secondary);
  margin: 0 0 1.5rem;
}

/* ── References ── */
.ref-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.ref-slot {
  aspect-ratio: 1;
  position: relative;
}
.ref-preview {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  border: var(--border);
}
.ref-remove {
  position: absolute;
  top: 3px; right: 3px;
  width: 22px; height: 22px;
  background: var(--ink);
  color: var(--white);
  border: none;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ref-drop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%; height: 100%;
  border: 1.5px dashed var(--color-border-secondary);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  transition: border-color 0.1s, color 0.1s;
  text-align: center;
  background: var(--white);
}
.ref-drop:hover { border-color: var(--blue); color: var(--blue); }
.ref-input { display: none; }

/* ── Agree ── */
.agree-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--color-background-secondary);
  border: var(--border);
  cursor: pointer;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  color: var(--ink);
  line-height: 1.5;
}
.agree-check { accent-color: var(--red); width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
.agree-link { color: var(--blue); font-weight: 700; text-decoration: none; }
.agree-link:hover { text-decoration: underline; }

/* ── Buttons ── */
.btn-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.btn-submit {
  padding: 1rem;
  background: var(--red);
  color: var(--white);
  border: var(--border);
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: transform 0.08s, box-shadow 0.08s;
}
.btn-submit:hover  { transform: translate(-2px,-2px); box-shadow: var(--shadow-lg); }
.btn-submit:active { transform: translate(2px,2px); box-shadow: none; }
.btn-draft {
  padding: 1rem;
  background: var(--white);
  color: var(--ink);
  border: var(--border);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.08s, box-shadow 0.08s;
}
.btn-draft:hover { transform: translate(-1px,-1px); box-shadow: var(--shadow-md); }
.form-footer {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--color-text-tertiary);
  text-align: center;
}

/* ── Summary panel ── */
.summary-panel {
  position: sticky;
  top: 70px;
  background: var(--blue);
  color: var(--white);
  border: var(--border);
  box-shadow: 6px 6px 0 var(--ink);
  overflow: hidden;
}
.summary-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  opacity: 0.65;
  padding: 0.875rem 1.25rem 0;
}
.summary-type {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--white);
  padding: 0.25rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.15);
  line-height: 1.1;
}
.summary-lines {
  padding: 0.875rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}
.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.summary-line:last-child { border-bottom: none; }
.summary-line--addon .sl-label,
.summary-line--addon .sl-val { opacity: 0.85; font-size: 0.8rem; }
.summary-line--meta { margin-top: 4px; }
.summary-line--meta .sl-label { opacity: 0.55; }
.sl-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  opacity: 0.75;
}
.sl-val {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.summary-total-box {
  margin: 0.875rem 1.25rem;
  border: 1.5px solid rgba(255,255,255,0.4);
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.summary-total-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  opacity: 0.6;
}
.summary-total-val {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--white);
  line-height: 1;
}
.summary-note {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  opacity: 0.5;
  padding: 0 1.25rem 0.875rem;
}

.summary-barcode {
  border-top: 1px solid rgba(255,255,255,0.15);
  padding: 0.875rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.barcode-lines {
  width: 80px;
  height: 28px;
  background-image: repeating-linear-gradient(
    90deg,
    rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 2px,
    transparent 2px, transparent 4px,
    rgba(255,255,255,0.9) 4px, rgba(255,255,255,0.9) 5px,
    transparent 5px, transparent 8px,
    rgba(255,255,255,0.9) 8px, rgba(255,255,255,0.9) 11px,
    transparent 11px, transparent 12px,
    rgba(255,255,255,0.9) 12px, rgba(255,255,255,0.9) 13px,
    transparent 13px, transparent 16px
  );
  flex-shrink: 0;
}
.barcode-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  opacity: 0.5;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .form-grid { grid-template-columns: 1fr; }
  .summary-panel { position: static; order: -1; }
  .page-inner { padding: 0 1rem; }
}
@media (max-width: 600px) {
  .field-row-2 { grid-template-columns: 1fr; }
  .usage-row { grid-template-columns: 1fr; }
  .ref-grid { grid-template-columns: repeat(3, 1fr); }
  .btn-row { grid-template-columns: 1fr; }
}
</style>
