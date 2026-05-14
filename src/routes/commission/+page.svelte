<script lang="ts">
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()

  const creator = $derived(data.creator)
  const types   = $derived(data.types)
  const isOpen  = $derived(creator?.is_open === 1)

  /* ── type metadata ── */
  const typeLabels: Record<string, string> = {
    bust:     'BUST',
    halfbody: 'HALF',
    fullbody: 'FULL',
    fullpage: 'FULL-PAGE',
    chibi:    'CHIBI',
    doodle:   'DOODLE',
    emote:    'EMOTE',
  }
  const typeImages: Record<string, string[]> = {
    bust:     ['/images/大頭一.jpg',           '/images/大頭二.jpg',           '/images/大頭三.jpg'],
    halfbody: ['/images/塗鴉半身一.png',       '/images/插圖一.jpg'],
    fullbody: ['/images/插圖二.jpg',           '/images/插圖三.jpg',           '/images/插圖五.jpg'],
    fullpage: ['/images/滿版一.jpg',           '/images/滿版塗鴉一.jpg',       '/images/滿版塗鴉二.jpg'],
    chibi:    ['/images/小人塗鴉立繪01.jpg',   '/images/小人塗鴉立繪02.jpg',   '/images/小人塗鴉立繪總覽01.jpg'],
    doodle:   ['/images/塗鴉大頭一.png',       '/images/塗鴉大頭二.png',       '/images/塗鴉立繪與表情包.jpg'],
    emote:    ['/images/塗鴉立繪與表情包.jpg', '/images/小人塗鴉立繪總覽01.jpg'],
  }

  /* ── selected type + image ── */
  let selectedTypeIdx = $state(0)
  let selectedImgIdx  = $state(0)

  const selectedType   = $derived(types[selectedTypeIdx])
  const currentImages  = $derived(selectedType ? (typeImages[selectedType.id] ?? []) : [])
  const currentImage   = $derived(currentImages[selectedImgIdx] ?? '')
  const currentLabelEn = $derived(selectedType ? (typeLabels[selectedType.id] ?? selectedType.name.toUpperCase()) : '')

  function selectType(i: number) { selectedTypeIdx = i; selectedImgIdx = 0 }

  /* ── lightbox ── */
  let lightboxOpen = $state(false)
  function openLightbox() { if (currentImage) lightboxOpen = true }
  function closeLightbox() { lightboxOpen = false }

  /* ── quick estimate ── */
  const addons = [
    { id: 'bg',    label: '完整背景',       en: 'FULL BACKGROUND', price: 800  },
    { id: 'props', label: '額外道具',       en: 'EXTRA PROPS',     price: 300  },
    { id: 'sfx',   label: '光效/特效',      en: 'SFX',             price: 400  },
    { id: 'rush',  label: '加急 RUSH (5天)',en: 'RUSH (5 DAYS)',   price: 1200 },
    { id: 'psd',   label: '附 PSD 原檔',    en: 'PSD SOURCE',      price: 600  },
  ]
  const charMults = [
    { label: '1 角', factor: 1.0 },
    { label: '2 角', factor: 1.8 },
    { label: '3 角', factor: 2.5 },
  ]

  let selectedAddons  = $state(new Set<string>())
  let selectedCharIdx = $state(0)

  function toggleAddon(id: string) {
    const next = new Set(selectedAddons)
    next.has(id) ? next.delete(id) : next.add(id)
    selectedAddons = next
  }

  const estimatedPrice = $derived.by(() => {
    if (!selectedType) return 0
    const base = selectedType.base_price
    const extra = addons.filter(a => selectedAddons.has(a.id)).reduce((s, a) => s + a.price, 0)
    return Math.round((base + extra) * charMults[selectedCharIdx].factor)
  })

  /* ── rules cards ── */
  const ruleCards = [
    {
      en: 'LEAD TIME',  zh: '交稿時程',
      items: ['頭像 7–10 日｜半身 10–14 日｜全身 14–21 日', '付款後正式開工，假日不計', '加急 +NT$1,200・5 日內交付'],
    },
    {
      en: 'REVISION',   zh: '修改規則',
      items: ['草稿階段最多 2 次大改', '線稿後僅限細節調整', '完稿後不再修改'],
    },
    {
      en: 'NG ITEMS',   zh: '不接受',
      items: ['NSFW / 18+ 任何成人內容', '寫實人像・精密機甲結構', 'AI 生成參考圖｜宗教/政治敏感'],
    },
    {
      en: 'COPYRIGHT',  zh: '版權說明',
      items: ['著作權保留繪師所有', '個人非商業用途', '商業授權另議 +50%'],
    },
  ]

  /* ── flow steps ── */
  const flowSteps = [
    { num: '01', en: 'SUBMIT FORM',    zh: '填寫申請', desc: '從項目詳情頁帶入估價，5 分鐘完成。' },
    { num: '02', en: 'CONFIRM QUOTE',  zh: '繪師確認', desc: '3 個工作天內回覆是否接案與報價。' },
    { num: '03', en: 'PAY · START',    zh: '付款開工', desc: '收到款項後正式開始草稿。' },
    { num: '04', en: 'DRAFT · DELIVER',zh: '草稿交付', desc: '草稿審核 → 線稿 → 上色 → 完稿。' },
  ]
</script>

<svelte:head>
  <title>委託資訊 · {creator?.display_name ?? 'Studio'}</title>
</svelte:head>

<!-- Status Banner -->
<div class="status-banner">
  <span class="status-dot" class:closed={!isOpen}></span>
  {isOpen ? '現在開放委託 · NOW ACCEPTING' : '暫停接案 · COMMISSIONS CLOSED'}
  <a href="/status" class="status-link-inline">已申請？查詢進度 →</a>
</div>
<div class="checker-row"></div>

<!-- ══ SECTION 01: COMMISSION TYPES ══════════════════════════════════════════ -->
<section class="section-types">
  <header class="section-header">
    <div class="sh-inner">
      <div class="sh-left">
        <span class="sh-num">01</span>
        <div>
          <p class="sh-title-en">COMMISSION TYPES</p>
          <p class="sh-title-zh">委託類型・報價</p>
        </div>
      </div>
      <span class="sh-counter">SECTION · 01 / 03</span>
    </div>
  </header>

  <div class="types-body">
    <!-- Left: preview carousel -->
    <aside class="preview-panel">
      <div class="preview-frame">
        <span class="preview-label">
          {String(selectedTypeIdx + 1).padStart(2, '0')} · {currentLabelEn}
        </span>
        {#if currentImage}
          <button class="preview-img-btn" onclick={openLightbox} aria-label="放大預覽">
            <img class="preview-img" src={currentImage} alt={selectedType?.name} />
            <span class="preview-zoom-hint">🔍 點擊放大</span>
          </button>
        {:else}
          <div class="preview-placeholder"></div>
        {/if}
      </div>

      <div class="preview-dots">
        {#each currentImages as _, i}
          <button
            class="dot"
            class:active={i === selectedImgIdx}
            onclick={() => selectedImgIdx = i}
            aria-label="圖 {i + 1}"
          ></button>
        {/each}
      </div>

      <div class="preview-footer">
        <div class="preview-thumbs">
          {#each currentImages as img, i}
            <button
              class="thumb"
              class:active={i === selectedImgIdx}
              onclick={() => selectedImgIdx = i}
            >
              <img src={img} alt="" />
            </button>
          {/each}
        </div>
        <div class="preview-price-block">
          <span class="price-from-label">FROM · 起價</span>
          <span class="price-from-val">NT${selectedType?.base_price.toLocaleString()}</span>
        </div>
      </div>
    </aside>

    <!-- Right: type list + estimate -->
    <div class="types-right">
      <div class="types-list">
        {#each types as type, i}
          <button
            class="type-row"
            class:active={selectedTypeIdx === i}
            onclick={() => selectType(i)}
          >
            <span class="type-num">{String(i + 1).padStart(2, '0')}</span>
            <div class="type-info">
              <p class="type-name">
                <strong>{typeLabels[type.id] ?? type.name.toUpperCase()}</strong>
                · {type.name}
              </p>
              {#if type.description}
                <p class="type-desc">{type.description}</p>
              {/if}
            </div>
            <div class="type-price-col">
              <span class="type-price">NT${type.base_price.toLocaleString()}+</span>
              <span class="type-detail">DETAIL →</span>
            </div>
          </button>
        {/each}
      </div>

      <!-- Quick Estimate -->
      <div class="estimate-box">
        <div class="estimate-header">
          <span>★ 快速估價 QUICK ESTIMATE</span>
          <span class="estimate-header-note">選擇加購 · 即時計算</span>
        </div>

        <div class="addon-grid">
          {#each addons as addon}
            <button
              class="addon-btn"
              class:selected={selectedAddons.has(addon.id)}
              onclick={() => toggleAddon(addon.id)}
            >
              + {addon.label} {addon.en} +${addon.price.toLocaleString()}
            </button>
          {/each}
        </div>

        <div class="char-row">
          {#each charMults as m, i}
            <button
              class="char-btn"
              class:active={selectedCharIdx === i}
              onclick={() => selectedCharIdx = i}
            >
              {m.label} ×{m.factor.toFixed(1)}
            </button>
          {/each}
        </div>

        <div class="estimate-result">
          <div class="estimate-result-label">
            <span>ESTIMATED · 預估</span>
            <span class="estimate-result-sub">
              ({selectedType?.name} · {charMults[selectedCharIdx].label})
            </span>
          </div>
          <span class="estimate-total">NT$ {estimatedPrice.toLocaleString()}</span>
        </div>

        {#if isOpen}
          <a
            href="/apply?type={selectedType?.id ?? ''}&price={estimatedPrice}&addons={[...selectedAddons].join(',')}&chars={selectedCharIdx}"
            class="apply-btn"
          >★ 申請委託 APPLY NOW →</a>
        {:else}
          <div class="apply-btn apply-btn--closed">目前暫停接案 · COMMISSIONS CLOSED</div>
        {/if}
      </div>
    </div>
  </div>
</section>

<!-- Lightbox -->
{#if lightboxOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="lightbox-overlay" onclick={closeLightbox} role="dialog" aria-modal="true" tabindex="-1">
    <img class="lightbox-img" src={currentImage} alt={selectedType?.name} />
    <button class="lightbox-close" onclick={closeLightbox} aria-label="關閉">✕</button>
  </div>
{/if}

<!-- ══ SECTION 02: RULES ══════════════════════════════════════════════════════ -->
<section class="section-rules">
  <div class="checker-row checker-red"></div>

  <header class="section-header">
    <div class="sh-inner">
      <div class="sh-left">
        <span class="sh-num">02</span>
        <div>
          <p class="sh-title-en">COMMISSION RULES</p>
          <p class="sh-title-zh">委託注意事項・規範</p>
        </div>
      </div>
      <span class="sh-counter">SECTION · 02 / 03</span>
    </div>
  </header>

  <div class="rules-body">
    <div class="rules-left">
      <span class="rules-read-tag">★ READ FIRST · 委託前請務必閱讀</span>
      <h2 class="rules-big">
        PLEASE READ<br/>THE RULES<br/>BEFORE YOU<br/><em>APPLY.</em>
      </h2>
      <div class="rules-updated">★ LAST UPDATED 2026·05·01</div>
    </div>

    <div class="rules-cards">
      {#each ruleCards as card}
        <div class="rule-card">
          <h4 class="rule-card-title">
            + <span class="rule-en">{card.en}</span>
            <span class="rule-zh">{card.zh}</span>
          </h4>
          <ul class="rule-list">
            {#each card.items as item}
              <li>★ {item}</li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ══ SECTION 03: FLOW ═══════════════════════════════════════════════════════ -->
<section class="section-flow">
  <header class="section-header">
    <div class="sh-inner">
      <div class="sh-left">
        <span class="sh-num">03</span>
        <div>
          <p class="sh-title-en">COMMISSION FLOW</p>
          <p class="sh-title-zh">委託流程・四步驟</p>
        </div>
      </div>
      <span class="sh-counter">SECTION · 03 / 03</span>
    </div>
  </header>

  <div class="flow-body">
    <div class="flow-headline-row">
      <h2 class="flow-headline">
        FROM APPLY · TO DELIVERY —— 04<br/><em>STEPS</em>
      </h2>
      <p class="flow-sub">SIMPLE &<br/>TRANSPARENT</p>
    </div>

    <div class="flow-steps">
      {#each flowSteps as step}
        <div class="flow-step">
          <span class="flow-step-num">{step.num}</span>
          <span class="flow-step-en">{step.en}</span>
          <h3 class="flow-step-zh">{step.zh}</h3>
          <p class="flow-step-desc">{step.desc}</p>
        </div>
      {/each}
    </div>
  </div>
  <div class="checker-row"></div>
</section>

<style>
/* ── page reset ── */
:global(body) { background: var(--color-background-secondary); }

/* ── Status banner ── */
.status-banner {
  background: var(--blue);
  color: var(--white);
  padding: 0.55rem 1.5rem;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-bottom: var(--border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4ade80;
  border: 1px solid rgba(255,255,255,0.5);
  flex-shrink: 0;
}
.status-dot.closed { background: var(--red); }
.status-link-inline {
  margin-left: auto;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 10px;
  letter-spacing: 0.06em;
}
.status-link-inline:hover { color: var(--white); }

/* ── checker-row variant: red ── */
.checker-red {
  background-image: repeating-linear-gradient(
    90deg,
    var(--red)   0px, var(--red)   20px,
    var(--white) 20px, var(--white) 40px
  );
  border-top-color: var(--red);
  border-bottom-color: var(--red);
}

/* ── Section header (shared) ── */
.section-header {
  background: var(--ink);
  border-bottom: var(--border);
}
.sh-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sh-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.sh-num {
  font-family: var(--font-display);
  font-size: 2.25rem;
  color: var(--red);
  line-height: 1;
  flex-shrink: 0;
}
.sh-title-en {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--white);
  letter-spacing: 0.03em;
  line-height: 1.1;
  margin: 0;
}
.sh-title-zh {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.55);
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  margin: 2px 0 0;
}
.sh-counter {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.1em;
}

/* ══ SECTION 01: TYPES ══════════════════════════════════════════════════════ */
.section-types { border-bottom: var(--border); }

.types-body {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 2rem;
  align-items: start;
}

/* Preview panel */
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.preview-frame {
  position: relative;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-md);
  height: 540px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-label {
  position: absolute;
  top: 10px; left: 10px;
  background: var(--ink);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 3px 8px;
  z-index: 1;
}
.preview-img-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%; height: 100%;
  background: none;
  border: none;
  padding: 12px;
  cursor: zoom-in;
  position: relative;
}
.preview-img-btn:hover .preview-zoom-hint { opacity: 1; }
.preview-zoom-hint {
  position: absolute;
  bottom: 12px; right: 12px;
  background: rgba(21,22,45,0.7);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  padding: 4px 8px;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}
.preview-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}
.preview-placeholder {
  width: 100%; height: 100%;
  background: repeating-linear-gradient(
    45deg,
    #f0f0f0 0px, #f0f0f0 1px,
    transparent 1px, transparent 12px
  );
}
.preview-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.dot {
  width: 24px; height: 8px;
  border: 1.5px solid var(--ink);
  background: var(--white);
  cursor: pointer;
  padding: 0;
  transition: background 0.1s;
}
.dot.active { background: var(--red); border-color: var(--red); }

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.preview-thumbs {
  display: flex;
  gap: 6px;
}
.thumb {
  width: 60px; height: 60px;
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: border-color 0.1s;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb.active { border-color: var(--ink); }

.preview-price-block {
  text-align: right;
  flex-shrink: 0;
}
.price-from-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin-bottom: 2px;
}
.price-from-val {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--red);
  line-height: 1;
}

/* Type list */
.types-right {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.types-list {
  display: flex;
  flex-direction: column;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  background: var(--white);
  margin-bottom: 1.25rem;
}
.type-row {
  display: grid;
  grid-template-columns: 2.5rem 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.25rem;
  border: none;
  border-bottom: 1px dashed var(--color-border-secondary);
  background: var(--white);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  border-left: 3px solid transparent;
}
.type-row:last-child { border-bottom: none; }
.type-row:hover { background: var(--color-background-secondary); }
.type-row.active {
  background: var(--color-background-secondary);
  border-left-color: var(--red);
}
.type-num {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--red);
  line-height: 1;
}
.type-info { min-width: 0; }
.type-name {
  font-family: var(--font-body);
  font-size: 0.95rem;
  margin: 0 0 2px;
  color: var(--ink);
}
.type-name strong {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.02em;
}
.type-desc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
}
.type-price-col {
  text-align: right;
  flex-shrink: 0;
}
.type-price {
  display: block;
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--blue);
  line-height: 1;
  margin-bottom: 4px;
}
.type-detail {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--red);
}

/* Quick Estimate */
.estimate-box {
  background: var(--blue);
  border: var(--border);
  box-shadow: var(--shadow-md);
}
.estimate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--white);
}
.estimate-header-note {
  font-size: 9px;
  opacity: 0.65;
  letter-spacing: 0.06em;
}
.addon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 1rem 1.25rem 0.75rem;
}
.addon-btn {
  padding: 0.4rem 0.75rem;
  background: rgba(255,255,255,0.1);
  color: var(--white);
  border: 1.5px solid rgba(255,255,255,0.3);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}
.addon-btn:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.6); }
.addon-btn.selected {
  background: var(--white);
  color: var(--blue);
  border-color: var(--white);
}

.char-row {
  display: flex;
  gap: 8px;
  padding: 0 1.25rem 1rem;
}
.char-btn {
  padding: 0.4rem 1rem;
  background: transparent;
  color: var(--white);
  border: 1.5px solid rgba(255,255,255,0.3);
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}
.char-btn:hover { border-color: rgba(255,255,255,0.7); }
.char-btn.active {
  background: var(--red);
  border-color: var(--red);
}

.estimate-result {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.2);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.estimate-result-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.estimate-result-label span:first-child {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(255,255,255,0.6);
  letter-spacing: 0.08em;
}
.estimate-result-sub {
  font-family: var(--font-mono);
  font-size: 9px;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.05em;
}
.estimate-total {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--white);
  line-height: 1;
}
.apply-btn {
  display: block;
  width: 100%;
  padding: 1rem;
  background: var(--red);
  color: var(--white);
  border: none;
  border-top: var(--border);
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.04em;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: filter 0.1s;
}
.apply-btn:hover { filter: brightness(1.1); }
.apply-btn--closed {
  background: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.5);
  cursor: default;
}
.apply-btn--closed:hover { filter: none; }

/* ══ SECTION 02: RULES ════════════════════════════════════════════════════ */
.section-rules { border-bottom: var(--border); }

.rules-body {
  background: var(--blue);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  max-width: 100%;
}
.rules-left {
  padding: 3rem 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-right: 2px solid rgba(255,255,255,0.15);
}
.rules-read-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.65);
}
.rules-big {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3.5rem);
  color: var(--white);
  line-height: 1.05;
  letter-spacing: 0.01em;
  margin: 0;
}
.rules-big em {
  color: var(--red);
  font-style: normal;
}
.rules-updated {
  display: inline-block;
  padding: 0.4rem 0.9rem;
  background: var(--ink);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  border: 1px solid rgba(255,255,255,0.2);
  align-self: flex-start;
}
.rules-cards {
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-content: start;
}
.rule-card {
  border: 1.5px solid rgba(255,255,255,0.35);
  padding: 1.1rem 1.1rem 1rem;
  background: rgba(255,255,255,0.05);
}
.rule-card-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rule-en { color: var(--white); font-size: 13px; }
.rule-zh { color: rgba(255,255,255,0.6); font-size: 11px; }
.rule-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.rule-list li {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.85);
  font-family: var(--font-body);
  line-height: 1.4;
}

/* ══ SECTION 03: FLOW ════════════════════════════════════════════════════ */
.section-flow { }

.flow-body {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2.5rem 2rem 2rem;
}
.flow-headline-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
}
.flow-headline {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3.5vw, 2.75rem);
  color: var(--ink);
  line-height: 1.05;
  margin: 0;
  letter-spacing: 0.01em;
}
.flow-headline em {
  color: var(--red);
  font-style: normal;
}
.flow-sub {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--color-text-tertiary);
  text-align: right;
  flex-shrink: 0;
  margin-left: 2rem;
  line-height: 1.6;
}

.flow-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}
.flow-step {
  background: var(--color-background-secondary);
  border: var(--border);
  box-shadow: 4px 4px 0 var(--blue);
  padding: 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.flow-step-num {
  font-family: var(--font-display);
  font-size: 2.25rem;
  color: var(--red);
  line-height: 1;
}
.flow-step-en {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--blue);
}
.flow-step-zh {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink);
  margin: 4px 0 2px;
}
.flow-step-desc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* ── Lightbox ── */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(21, 22, 45, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: zoom-out;
}
.lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  display: block;
  box-shadow: 0 0 60px rgba(0,0,0,0.6);
}
.lightbox-close {
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  background: var(--white);
  color: var(--ink);
  border: var(--border);
  width: 36px;
  height: 36px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}
.lightbox-close:hover { background: var(--red); color: var(--white); }

/* ── Responsive ── */
@media (max-width: 900px) {
  .types-body {
    grid-template-columns: 1fr;
    padding: 1.25rem;
  }
  .preview-panel { display: none; }

  .rules-body { grid-template-columns: 1fr; }
  .rules-left { border-right: none; border-bottom: 2px solid rgba(255,255,255,0.15); padding: 2rem 1.5rem; }
  .rules-cards { padding: 1.5rem; }

  .flow-steps { grid-template-columns: 1fr 1fr; }
  .flow-body { padding: 1.5rem; }
}

@media (max-width: 600px) {
  .sh-inner { padding: 0.875rem 1rem; }
  .sh-num { font-size: 1.75rem; }
  .sh-title-en { font-size: 1.1rem; }

  .types-body { padding: 1rem; }
  .rules-cards { grid-template-columns: 1fr; }
  .flow-steps { grid-template-columns: 1fr; }
}
</style>
