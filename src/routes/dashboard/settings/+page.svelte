<script lang="ts">
  import { onMount } from "svelte"
  import type { PageData, ActionData } from "./$types"
  import {
    PALETTES, FONTS, type PaletteKey, type FontKey, type ThemeConfig,
    DEFAULT_THEME, loadTheme, saveTheme, applyTheme,
  } from "$lib/theme"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  /* ── Theme picker ────────────────────────────── */
  let theme = $state<ThemeConfig>(DEFAULT_THEME)
  let themeSaved = $state(false)

  onMount(() => {
    theme = loadTheme()
  })

  function selectPalette(p: PaletteKey) {
    theme = { ...theme, palette: p }
    applyTheme(theme)
    saveTheme(theme)
    flashSaved()
  }

  function selectFont(f: FontKey) {
    theme = { ...theme, font: f }
    applyTheme(theme)
    saveTheme(theme)
    flashSaved()
  }

  function flashSaved() {
    themeSaved = true
    setTimeout(() => { themeSaved = false }, 1600)
  }

  const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]
  const FONT_KEYS    = Object.keys(FONTS)    as FontKey[]
</script>

<div class="page">
  <h1>設定</h1>

  <!-- ── 外觀主題 ── -->
  <section class="section theme-section">
    <div class="theme-head">
      <div>
        <h2 class="theme-title">外觀主題 <span class="theme-saved-badge" class:visible={themeSaved}>✓ 已套用</span></h2>
        <p class="theme-sub">點擊即時套用，自動儲存於此裝置。</p>
      </div>
    </div>

    <div class="theme-group">
      <div class="theme-group-label">色票 Palette</div>
      <div class="palette-grid">
        {#each PALETTE_KEYS as key}
          {@const p = PALETTES[key]}
          <button
            class="palette-card"
            class:active={theme.palette === key}
            onclick={() => selectPalette(key)}
            title={p.nameEn}
          >
            <div class="palette-swatches">
              {#each p.swatch as c}
                <div class="swatch" style="background:{c}"></div>
              {/each}
            </div>
            <div class="palette-name">{p.name}</div>
            <div class="palette-name-en">{p.nameEn}</div>
          </button>
        {/each}
      </div>
    </div>

    <div class="theme-group">
      <div class="theme-group-label">字體 Font</div>
      <div class="font-grid">
        {#each FONT_KEYS as key}
          {@const f = FONTS[key]}
          <button
            class="font-card"
            class:active={theme.font === key}
            onclick={() => selectFont(key)}
          >
            <div class="font-preview" style="font-family:{f.vars['--font-display']}">{f.preview}</div>
            <div class="font-name">{f.name}</div>
            <div class="font-name-en">{f.nameEn}</div>
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- ── Hub 同步設定 ── -->
  <section class="section hub-section">
    <div class="theme-head">
      <div>
        <h2 class="theme-title">Hub 同步設定</h2>
        <p class="theme-sub">將委託資料同步到聚合平台，讓粉絲追蹤你的開委狀態。</p>
      </div>
    </div>

    <form method="POST" action="?/saveHub" class="hub-form">
      <div class="hub-field">
        <label for="site_url">網站網址</label>
        <input
          id="site_url"
          name="site_url"
          type="url"
          placeholder="https://your-name.pages.dev"
          value={data.siteUrl ?? ""}
          spellcheck="false"
          autocomplete="off"
        />
        {#if form?.errors?.site_url}
          <span class="field-error">{form.errors.site_url[0]}</span>
        {/if}
        <span class="field-hint">你這個委託網站的公開網址</span>
      </div>

      <div class="hub-field">
        <label for="hub_token">Hub Token</label>
        <input
          id="hub_token"
          name="hub_token"
          type="text"
          placeholder="貼上從 Hub 平台複製的 Token"
          value={data.hubToken ?? ""}
          spellcheck="false"
          autocomplete="off"
        />
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

  /* ── Theme Picker ──────────────────────────────────── */
  .theme-section { border: var(--border); box-shadow: var(--shadow-md); }
  .theme-head { margin-bottom: 1.25rem; }
  .theme-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: var(--blue);
    margin: 0 0 0.2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .theme-saved-badge {
    font-family: var(--font-mono);
    font-size: 11px;
    color: #16a34a;
    font-weight: 700;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .theme-saved-badge.visible { opacity: 1; }
  .theme-sub { font-size: 0.8rem; color: var(--color-text-tertiary); font-family: var(--font-mono); }
  .theme-group { margin-bottom: 1.25rem; }
  .theme-group-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--color-text-tertiary);
    margin-bottom: 0.6rem;
    text-transform: uppercase;
  }

  .palette-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
  }
  .palette-card {
    background: var(--white);
    border: 2px solid var(--color-border-tertiary);
    padding: 0.6rem 0.5rem;
    cursor: pointer;
    text-align: center;
    transition: border-color 0.12s, box-shadow 0.12s, transform 0.08s;
    border-radius: var(--border-radius-md);
  }
  .palette-card:hover { border-color: var(--blue); transform: translateY(-2px); }
  .palette-card.active {
    border-color: var(--blue);
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
  }
  .palette-swatches {
    display: flex;
    height: 28px;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 2px;
    margin-bottom: 0.4rem;
  }
  .swatch { flex: 1; }
  .palette-name { font-size: 12px; font-weight: 700; line-height: 1.2; }
  .palette-name-en { font-family: var(--font-mono); font-size: 9px; color: var(--color-text-tertiary); }

  .font-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  .font-card {
    background: var(--white);
    border: 2px solid var(--color-border-tertiary);
    padding: 0.75rem;
    cursor: pointer;
    text-align: center;
    transition: border-color 0.12s, box-shadow 0.12s, transform 0.08s;
    border-radius: var(--border-radius-md);
  }
  .font-card:hover { border-color: var(--blue); transform: translateY(-2px); }
  .font-card.active {
    border-color: var(--blue);
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
  }
  .font-preview {
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1;
    color: var(--blue);
    margin-bottom: 0.4rem;
    letter-spacing: -0.02em;
  }
  .font-name { font-size: 12px; font-weight: 700; }
  .font-name-en { font-family: var(--font-mono); font-size: 9px; color: var(--color-text-tertiary); }

  /* ── rest ── */
  .section {
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-lg);
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }
  h2 {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin: 0 0 1rem;
  }

  /* ── Hub section ── */
  .hub-section { border: var(--border); box-shadow: var(--shadow-md); }
  .hub-form { display: flex; flex-direction: column; gap: 1rem; }
  .hub-field { display: flex; flex-direction: column; gap: 0.35rem; }
  .hub-field label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
  }
  .hub-field input {
    padding: 0.55rem 0.75rem;
    border: var(--border);
    font-family: var(--font-mono);
    font-size: 0.82rem;
    background: var(--white);
    color: var(--ink);
    width: 100%;
    box-sizing: border-box;
  }
  .hub-field input:focus { outline: 2px solid var(--blue); outline-offset: 1px; }
  .field-hint { font-size: 0.75rem; color: var(--color-text-tertiary); }
  .field-hint a { color: var(--blue); }
  .field-error { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; color: var(--red); }
  .hub-actions { display: flex; align-items: center; gap: 1rem; }
  .btn-hub {
    padding: 0.45rem 1.1rem;
    background: var(--blue);
    color: var(--white);
    border: 2px solid var(--blue-deep, #1747BB);
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform 0.08s, box-shadow 0.08s;
  }
  .btn-hub:hover { transform: translate(-1px, -1px); box-shadow: var(--shadow-md); }
  .hub-saved {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    color: #16a34a;
  }

  @media (max-width: 720px) {
    .palette-grid, .font-grid { grid-template-columns: 1fr; }
    .theme-title { flex-wrap: wrap; }
  }

  @media (max-width: 640px) {
    .section { padding: 1rem; }
  }
</style>
