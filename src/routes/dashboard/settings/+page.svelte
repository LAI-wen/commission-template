<script lang="ts">
  import { onMount, tick } from "svelte"
  import { enhance } from "$app/forms"
  import type { PageData, ActionData } from "./$types"
  import {
    PALETTES, FONTS, type PaletteKey, type FontKey, type ThemeConfig,
    DEFAULT_THEME, loadTheme, saveTheme, applyTheme,
  } from "$lib/theme"
  import { DEFAULT_GLOBAL } from "$lib/components/editor/globalDesign"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  /* ── Dashboard theme ─────────────────────────── */
  let theme = $state<ThemeConfig>(DEFAULT_THEME)
  let themeSaved = $state(false)

  onMount(() => { theme = loadTheme() })

  function selectPalette(p: PaletteKey) {
    theme = { ...theme, palette: p }; applyTheme(theme); saveTheme(theme); flash()
  }
  function selectFont(f: FontKey) {
    theme = { ...theme, font: f }; applyTheme(theme); saveTheme(theme); flash()
  }
  function flash() {
    themeSaved = true; setTimeout(() => { themeSaved = false }, 1600)
  }

  const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]
  const FONT_KEYS    = Object.keys(FONTS)    as FontKey[]

  /* ── Layout / radius (saved to DB) ──────────── */
  let layoutWidth = $state<'narrow' | 'full'>(data.layoutWidth ?? DEFAULT_GLOBAL.layoutWidth)
  let radius      = $state<string>(data.radius ?? DEFAULT_GLOBAL.radius)
  let layoutSaved = $state(false)

  $effect(() => {
    if (form?.layoutSaved) {
      layoutSaved = true
      setTimeout(() => { layoutSaved = false }, 1600)
      // sync editor localStorage so it picks up the new values
      const stored = localStorage.getItem("card_global")
      const gd = stored ? JSON.parse(stored) : {}
      localStorage.setItem("card_global", JSON.stringify({ ...gd, layoutWidth, radius }))
    }
  })

  /* ── Tab ─────────────────────────────────────── */
  let tab = $state<'palette' | 'font' | 'layout'>('palette')

  /* ── Layout form (hidden submit) ─────────────── */
  let layoutFormEl: HTMLFormElement
</script>

<div class="page">
  <h1>設定</h1>

  <!-- ══ 外觀主題 ══════════════════════════════════════ -->
  <section class="section theme-section">
    <div class="section-head">
      <h2 class="section-title">
        外觀主題
        <span class="saved-badge" class:visible={themeSaved || layoutSaved}>✓ 已套用</span>
      </h2>
      <p class="section-sub">點擊即時套用，配色與字型儲存於此裝置；版面設定儲存至伺服器。</p>
    </div>

    <!-- tab bar -->
    <div class="tab-bar">
      <button class="tab" class:active={tab === 'palette'} onclick={() => tab = 'palette'}>配色</button>
      <button class="tab" class:active={tab === 'font'}    onclick={() => tab = 'font'}>字型</button>
      <button class="tab" class:active={tab === 'layout'}  onclick={() => tab = 'layout'}>版面</button>
    </div>

    <!-- ── 配色 ── -->
    {#if tab === 'palette'}
      <div class="palette-grid">
        {#each PALETTE_KEYS as key}
          {@const p = PALETTES[key]}
          <button class="palette-card" class:active={theme.palette === key}
            onclick={() => selectPalette(key)} title={p.nameEn}>
            <div class="palette-swatches">
              {#each p.swatch as c}<div class="swatch" style="background:{c}"></div>{/each}
            </div>
            <div class="card-name">{p.name}</div>
            <div class="card-sub">{p.nameEn}</div>
          </button>
        {/each}
      </div>

    <!-- ── 字型 ── -->
    {:else if tab === 'font'}
      <div class="font-grid">
        {#each FONT_KEYS as key}
          {@const f = FONTS[key]}
          <button class="font-card" class:active={theme.font === key} onclick={() => selectFont(key)}>
            <div class="font-preview" style="font-family:{f.vars['--font-display']}">{f.preview}</div>
            <div class="card-name">{f.name}</div>
            <div class="card-sub">{f.nameEn}</div>
          </button>
        {/each}
      </div>

    <!-- ── 版面 ── -->
    {:else if tab === 'layout'}
      <div class="layout-section">
        <div class="field-label">版面寬度</div>
        <div class="layout-row">
          <button class="lay-btn" class:on={layoutWidth === 'narrow'}
            onclick={() => layoutWidth = 'narrow'}>
            <div class="lay-icon lay-narrow"></div>
            <span>窄版</span>
          </button>
          <button class="lay-btn" class:on={layoutWidth === 'full'}
            onclick={() => layoutWidth = 'full'}>
            <div class="lay-icon lay-full"></div>
            <span>全寬</span>
          </button>
        </div>
        <p class="lay-hint">
          {layoutWidth === 'narrow'
            ? '窄版：名片集中於畫面中央，適合直式排版。'
            : '全寬：元件延伸至整個視窗，適合橫向展示。'}
        </p>

        <div class="field-label" style="margin-top:1.25rem;">元件圓角</div>
        <div class="sl-row">
          <input type="range" class="slider" min="0" max="48"
            value={parseInt(radius) || 32}
            style="--v:{((parseInt(radius)||32)/48)*100}%"
            oninput={(e) => radius = (e.target as HTMLInputElement).value + 'px'} />
          <span class="sl-val">{radius}</span>
        </div>
        <p class="lay-hint">影響名片頁所有元件的圓角大小。</p>

        <div class="layout-footer">
          <button class="btn-save" onclick={async () => { await tick(); layoutFormEl.requestSubmit() }}>
            儲存版面設定
          </button>
          {#if form?.layoutSaved}
            <span class="saved-inline">✓ 已儲存</span>
          {/if}
        </div>
      </div>
    {/if}
  </section>

  <!-- hidden form for layout save -->
  <form bind:this={layoutFormEl} method="POST" action="?/saveLayout"
    style="display:none;" use:enhance>
    <input type="hidden" name="layoutWidth" value={layoutWidth} />
    <input type="hidden" name="radius"      value={radius} />
  </form>

  <!-- ══ Hub 同步設定 ══════════════════════════════════ -->
  <section class="section hub-section">
    <div class="section-head">
      <h2 class="section-title">Hub 同步設定</h2>
      <p class="section-sub">將委託資料同步到聚合平台，讓粉絲追蹤你的開委狀態。</p>
    </div>

    <form method="POST" action="?/saveHub" class="hub-form">
      <div class="hub-field">
        <label for="site_url">網站網址</label>
        <input id="site_url" name="site_url" type="url"
          placeholder="https://your-name.pages.dev"
          value={data.siteUrl ?? ""} spellcheck="false" autocomplete="off" />
        {#if form?.errors?.site_url}
          <span class="field-error">{form.errors.site_url[0]}</span>
        {/if}
        <span class="field-hint">你這個委託網站的公開網址</span>
      </div>

      <div class="hub-field">
        <label for="hub_token">Hub Token</label>
        <input id="hub_token" name="hub_token" type="text"
          placeholder="貼上從 Hub 平台複製的 Token"
          value={data.hubToken ?? ""} spellcheck="false" autocomplete="off" />
        {#if form?.errors?.hub_token}
          <span class="field-error">{form.errors.hub_token[0]}</span>
        {/if}
        {#if data.hubToken}
          <span class="field-hint">已設定，可貼上新 Token 覆蓋</span>
        {:else}
          <span class="field-hint">前往 <a href="https://commission-hub.pages.dev/manage" target="_blank" rel="noopener">Hub 平台</a> 取得 Token</span>
        {/if}
      </div>

      <div class="hub-actions">
        <button type="submit" class="btn-hub">儲存並同步</button>
        {#if form?.hubSaved}
          <span class="hub-saved">✓ 已儲存並推送同步</span>
        {/if}
      </div>
    </form>
  </section>
</div>

<style>
  h1 { font-size: 1.3rem; font-weight: 500; margin: 0 0 1.5rem; }

  .section {
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-lg);
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }
  .theme-section { border: var(--border); box-shadow: var(--shadow-md); }

  .section-head { margin-bottom: 1rem; }
  .section-title {
    font-family: var(--font-display);
    font-size: 1.1rem; color: var(--blue);
    margin: 0 0 0.2rem;
    display: flex; align-items: center; gap: 0.75rem;
  }
  .section-sub { font-size: 0.8rem; color: var(--color-text-tertiary); font-family: var(--font-mono); margin: 0; }
  .saved-badge {
    font-family: var(--font-mono); font-size: 11px;
    color: #16a34a; font-weight: 700; opacity: 0; transition: opacity 0.3s;
  }
  .saved-badge.visible { opacity: 1; }

  /* ── Tabs ── */
  .tab-bar {
    display: flex; gap: 0.25rem;
    border-bottom: 1px solid var(--color-border-tertiary);
    margin-bottom: 1.25rem;
  }
  .tab {
    padding: 0.45rem 1.1rem; background: none; border: none; cursor: pointer;
    font-family: var(--font-body); font-size: 0.82rem; font-weight: 600;
    color: var(--color-text-tertiary); border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: color 0.12s, border-color 0.12s;
  }
  .tab:hover { color: var(--color-text-primary); }
  .tab.active { color: var(--blue); border-bottom-color: var(--blue); }

  /* ── Palette ── */
  .palette-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }
  .palette-card {
    background: var(--white); border: 2px solid var(--color-border-tertiary);
    padding: 0.6rem 0.5rem; cursor: pointer; text-align: center;
    transition: border-color 0.12s, box-shadow 0.12s, transform 0.08s;
    border-radius: var(--border-radius-md);
  }
  .palette-card:hover  { border-color: var(--blue); transform: translateY(-2px); }
  .palette-card.active { border-color: var(--blue); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
  .palette-swatches { display: flex; height: 28px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); border-radius: 2px; margin-bottom: 0.4rem; }
  .swatch { flex: 1; }

  /* ── Font ── */
  .font-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .font-card {
    background: var(--white); border: 2px solid var(--color-border-tertiary);
    padding: 0.75rem; cursor: pointer; text-align: center;
    transition: border-color 0.12s, box-shadow 0.12s, transform 0.08s;
    border-radius: var(--border-radius-md);
  }
  .font-card:hover  { border-color: var(--blue); transform: translateY(-2px); }
  .font-card.active { border-color: var(--blue); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
  .font-preview { font-size: 1.8rem; font-weight: 700; line-height: 1; color: var(--blue); margin-bottom: 0.4rem; letter-spacing: -0.02em; }

  /* shared card labels */
  .card-name { font-size: 12px; font-weight: 700; line-height: 1.2; }
  .card-sub  { font-family: var(--font-mono); font-size: 9px; color: var(--color-text-tertiary); }

  /* ── Layout tab ── */
  .layout-section { display: flex; flex-direction: column; gap: 0.5rem; }
  .field-label {
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--color-text-tertiary);
  }
  .layout-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; max-width: 320px; }
  .lay-btn {
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    padding: 1rem 0.5rem; border-radius: var(--border-radius-md);
    border: 2px solid var(--color-border-tertiary);
    background: var(--color-background-primary); cursor: pointer;
    font-family: inherit; font-size: 0.82rem; font-weight: 700;
    color: var(--color-text-secondary); transition: all 0.12s;
  }
  .lay-btn.on { border-color: var(--blue); background: color-mix(in srgb, var(--blue) 5%, transparent); color: var(--blue); }
  .lay-icon { border: 2.5px solid currentColor; border-radius: 0.25rem; }
  .lay-narrow { width: 1.5rem; height: 1.25rem; }
  .lay-full   { width: 2.5rem; height: 1.25rem; }
  .lay-hint   { font-size: 0.75rem; color: var(--color-text-tertiary); line-height: 1.5; margin: 0.1rem 0 0; }
  .sl-row { display: flex; align-items: center; gap: 0.75rem; max-width: 400px; }
  .slider {
    flex: 1; height: 4px; appearance: none; border-radius: 999px; cursor: pointer; outline: none;
    background: linear-gradient(to right, var(--blue) var(--v,50%), color-mix(in srgb, var(--blue) 15%, transparent) var(--v,50%));
  }
  .slider::-webkit-slider-thumb { appearance: none; width: 1rem; height: 1rem; border-radius: 50%; background: white; border: 2px solid var(--blue); cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.15); }
  .sl-val { font-size: 0.75rem; font-weight: 700; color: var(--color-text-secondary); min-width: 2.5rem; }
  .layout-footer { display: flex; align-items: center; gap: 1rem; margin-top: 0.75rem; padding-top: 1rem; border-top: 0.5px solid var(--color-border-tertiary); }
  .btn-save {
    padding: 0.45rem 1.25rem; background: var(--blue); color: white;
    border: none; border-radius: var(--border-radius-md);
    font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: opacity 0.12s;
  }
  .btn-save:hover { opacity: 0.85; }
  .saved-inline { font-size: 0.8rem; font-weight: 700; color: #16a34a; }

  /* ── Hub ── */
  .hub-section { border: var(--border); box-shadow: var(--shadow-md); }
  .hub-form { display: flex; flex-direction: column; gap: 1rem; }
  .hub-field { display: flex; flex-direction: column; gap: 0.35rem; }
  .hub-field label { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-text-tertiary); }
  .hub-field input { padding: 0.55rem 0.75rem; border: var(--border); font-family: var(--font-mono); font-size: 0.82rem; background: var(--white); color: var(--ink); width: 100%; box-sizing: border-box; }
  .hub-field input:focus { outline: 2px solid var(--blue); outline-offset: 1px; }
  .field-hint { font-size: 0.75rem; color: var(--color-text-tertiary); }
  .field-hint a { color: var(--blue); }
  .field-error { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; color: var(--red); }
  .hub-actions { display: flex; align-items: center; gap: 1rem; }
  .btn-hub { padding: 0.45rem 1.1rem; background: var(--blue); color: var(--white); border: 2px solid var(--blue-deep, #1747BB); font-family: var(--font-body); font-size: 0.875rem; font-weight: 700; cursor: pointer; box-shadow: var(--shadow-sm); transition: transform 0.08s, box-shadow 0.08s; }
  .btn-hub:hover { transform: translate(-1px,-1px); box-shadow: var(--shadow-md); }
  .hub-saved { font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; color: #16a34a; }

  @media (max-width: 720px) {
    .palette-grid { grid-template-columns: repeat(3, 1fr); }
    .font-grid    { grid-template-columns: 1fr 1fr; }
  }
</style>
