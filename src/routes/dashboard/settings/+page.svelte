<script lang="ts">
  import { onMount } from "svelte"
  import { enhance } from "$app/forms"
  import type { PageData, ActionData } from "./$types"
  import {
    PALETTES, FONTS, type PaletteKey, type FontKey, type ThemeConfig,
    DEFAULT_THEME, loadTheme, saveTheme, applyTheme,
  } from "$lib/theme"
  import { DEFAULT_GLOBAL } from "$lib/components/editor/globalDesign"
  import type { GlobalDesign } from "$lib/components/editor/globalDesign"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  /* ── Dashboard theme picker ───────────────────── */
  let theme = $state<ThemeConfig>(DEFAULT_THEME)
  let themeSaved = $state(false)

  onMount(() => { theme = loadTheme() })

  function selectPalette(p: PaletteKey) {
    theme = { ...theme, palette: p }; applyTheme(theme); saveTheme(theme); flashSaved()
  }
  function selectFont(f: FontKey) {
    theme = { ...theme, font: f }; applyTheme(theme); saveTheme(theme); flashSaved()
  }
  function flashSaved() {
    themeSaved = true; setTimeout(() => { themeSaved = false }, 1600)
  }

  const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]
  const FONT_KEYS    = Object.keys(FONTS)    as FontKey[]

  /* ── Page / Card design (GlobalDesign) ───────── */
  let gd = $state<GlobalDesign>({ ...DEFAULT_GLOBAL, ...data.globalDesign })
  let designTab = $state<'bg' | 'font' | 'palette' | 'layout'>('bg')
  let designSaved = $state(false)
  let uploading = $state(false)
  let uploadError = $state("")

  $effect(() => {
    if (form?.designSaved) {
      designSaved = true
      setTimeout(() => { designSaved = false }, 1600)
    }
  })

  const FONT_PRESETS = [
    { label: '系統字體',     value: 'inherit',                             url: '' },
    { label: '思源黑體',     value: "'Noto Sans TC', sans-serif",         url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap' },
    { label: '思源宋體',     value: "'Noto Serif TC', serif",             url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700;900&display=swap' },
    { label: 'M PLUS 圓體', value: "'M PLUS Rounded 1c', sans-serif",    url: 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;900&display=swap' },
    { label: 'Zen 角哥德',  value: "'Zen Kaku Gothic New', sans-serif",   url: 'https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&display=swap' },
  ]
  const fontSelectValue = $derived(
    FONT_PRESETS.some(f => f.value === gd.fontFamily) ? gd.fontFamily : 'custom'
  )
  let customFontFamily = $state('')
  let customFontUrl = $state('')

  function set(patch: Partial<GlobalDesign>) { gd = { ...gd, ...patch } }

  function selectGdFont(value: string) {
    if (value === 'custom') return
    const p = FONT_PRESETS.find(f => f.value === value)
    if (p) set({ fontFamily: p.value, fontUrl: p.url })
  }
  function applyCustomFont() {
    if (customFontFamily.trim()) set({ fontFamily: customFontFamily.trim(), fontUrl: customFontUrl.trim() })
  }
  function addColor(c: string) {
    if (!gd.palette.includes(c)) set({ palette: [...gd.palette, c] })
  }
  function removeColor(i: number) {
    set({ palette: gd.palette.filter((_, idx) => idx !== i) })
  }

  let newColor = $state('#7ab8d8')

  async function uploadBgImage(file: File) {
    uploading = true; uploadError = ""
    const fd = new FormData(); fd.append("file", file)
    const res = await fetch("?/uploadBgImage", { method: "POST", body: fd })
    uploading = false
    if (!res.ok) { uploadError = "上傳失敗，請重試"; return }
    const result = await res.json() as any
    const url = result?.data?.uploadedBgUrl
    if (url) set({ bgImage: url })
  }

  /* hidden design form */
  let designFormEl: HTMLFormElement
  let designJsonInput = $state("")

  async function submitDesign() {
    designJsonInput = JSON.stringify(gd)
    await new Promise(r => setTimeout(r, 0))
    designFormEl.requestSubmit()
  }
</script>

<svelte:head>
  {#if gd.fontUrl}
    <link rel="stylesheet" href={gd.fontUrl} />
  {/if}
</svelte:head>

<div class="page">
  <h1>設定</h1>

  <!-- ══ 儀表板主題 ══════════════════════════════════════ -->
  <section class="section theme-section">
    <div class="theme-head">
      <div>
        <h2 class="theme-title">
          儀表板主題
          <span class="saved-badge" class:visible={themeSaved}>✓ 已套用</span>
        </h2>
        <p class="theme-sub">點擊即時套用，自動儲存於此裝置。</p>
      </div>
    </div>

    <div class="theme-group">
      <div class="theme-group-label">色票 Palette</div>
      <div class="palette-grid">
        {#each PALETTE_KEYS as key}
          {@const p = PALETTES[key]}
          <button class="palette-card" class:active={theme.palette === key}
            onclick={() => selectPalette(key)} title={p.nameEn}>
            <div class="palette-swatches">
              {#each p.swatch as c}<div class="swatch" style="background:{c}"></div>{/each}
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
          <button class="font-card" class:active={theme.font === key} onclick={() => selectFont(key)}>
            <div class="font-preview" style="font-family:{f.vars['--font-display']}">{f.preview}</div>
            <div class="font-name">{f.name}</div>
            <div class="font-name-en">{f.nameEn}</div>
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- ══ 頁面設計（GlobalDesign）══════════════════════════ -->
  <section class="section design-section">
    <div class="design-head">
      <div>
        <h2 class="theme-title">
          頁面設計
          <span class="saved-badge" class:visible={designSaved}>✓ 已儲存</span>
        </h2>
        <p class="theme-sub">公開名片頁面的外觀，與編輯器同步。</p>
      </div>
    </div>

    <!-- tab bar -->
    <div class="dtab-bar">
      {#each ([['bg','背景'],['font','字型'],['palette','色彩'],['layout','佈局']] as const) as [k,l]}
        <button class="dtab" class:active={designTab === k} onclick={() => designTab = k}>{l}</button>
      {/each}
    </div>

    <!-- ── 背景 ── -->
    {#if designTab === 'bg'}
      <div class="tab-body">
        <!-- Upload zone -->
        <label class="upload-zone" class:has-img={!!gd.bgImage}>
          {#if gd.bgImage}
            <img src={gd.bgImage} alt="" class="upload-preview" />
            <div class="upload-ov"><span>{uploading ? '上傳中…' : '更換圖片'}</span></div>
          {:else}
            <span class="upload-hint">{uploading ? '上傳中…' : '點擊或拖曳圖片至此處'}</span>
          {/if}
          <input type="file" accept="image/*" style="display:none;" disabled={uploading}
            onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadBgImage(f) }} />
        </label>
        {#if gd.bgImage}
          <button class="remove-btn" onclick={() => set({ bgImage: '' })}>移除背景圖片</button>
        {/if}
        {#if uploadError}<p class="upload-error">{uploadError}</p>{/if}

        <div class="row2">
          <div>
            <div class="lbl">或貼上 URL</div>
            <input class="inp" placeholder="https://..." value={gd.bgImage}
              onchange={(e) => set({ bgImage: (e.target as HTMLInputElement).value })} />
          </div>
        </div>

        <div class="lbl">背景色</div>
        <div class="swatch-row">
          {#each gd.palette as c}
            <button class="sw" style="background:{c};" class:sw-on={gd.bgColor===c}
              onclick={() => set({ bgColor: c })} aria-label={c}></button>
          {/each}
          <label class="sw sw-pick" title="自訂">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <input type="color" style="display:none;" value="#f5f0e8"
              oninput={(e) => set({ bgColor: (e.target as HTMLInputElement).value })} />
          </label>
        </div>

        <div class="row2">
          <div>
            <div class="lbl">重複</div>
            <select class="sel" value={gd.bgRepeat}
              onchange={(e) => set({ bgRepeat: (e.target as HTMLSelectElement).value as any })}>
              <option value="no-repeat">不重複</option>
              <option value="repeat">重複</option>
              <option value="repeat-x">水平</option>
              <option value="repeat-y">垂直</option>
            </select>
          </div>
          <div>
            <div class="lbl">填充</div>
            <select class="sel" value={gd.bgSize}
              onchange={(e) => set({ bgSize: (e.target as HTMLSelectElement).value as any })}>
              <option value="cover">裁切填滿</option>
              <option value="contain">完整顯示</option>
              <option value="100% 100%">拉伸</option>
              <option value="auto">原尺寸</option>
            </select>
          </div>
          <div>
            <div class="lbl">圖片捲動</div>
            <select class="sel" value={gd.bgAttachment}
              onchange={(e) => set({ bgAttachment: (e.target as HTMLSelectElement).value as any })}>
              <option value="fixed">固定畫面</option>
              <option value="scroll">跟著畫面</option>
            </select>
          </div>
        </div>

        <div class="lbl" style="margin-top:.5rem;">圖片風格（遮罩）</div>
        {#each [
          { key: 'bgBrightness', label: '亮暗', min: 0, max: 200, unit: '%', v: gd.bgBrightness },
          { key: 'bgBlur',       label: '模糊', min: 0, max: 20,  unit: 'px', v: gd.bgBlur },
          { key: 'bgSaturation', label: '飽和', min: 0, max: 200, unit: '%', v: gd.bgSaturation },
        ] as row}
          <div class="sl-row">
            <span class="sl-lbl">{row.label}</span>
            <input type="range" class="slider" min={row.min} max={row.max} value={row.v}
              style="--v:{((row.v - row.min) / (row.max - row.min)) * 100}%"
              oninput={(e) => set({ [row.key]: +(e.target as HTMLInputElement).value } as any)} />
            <span class="sl-val">{row.v}{row.unit}</span>
          </div>
        {/each}
      </div>

    <!-- ── 字型 ── -->
    {:else if designTab === 'font'}
      <div class="tab-body">
        <div class="lbl">字體</div>
        <select class="sel" value={fontSelectValue}
          onchange={(e) => { const v = (e.target as HTMLSelectElement).value; if (v !== 'custom') selectGdFont(v) }}>
          {#each FONT_PRESETS as f}
            <option value={f.value}>{f.label}</option>
          {/each}
          <option value="custom">自訂字體…</option>
        </select>
        {#if fontSelectValue === 'custom'}
          <div class="lbl" style="margin-top:.5rem;">CSS font-family</div>
          <input class="inp" placeholder="'My Font', sans-serif" bind:value={customFontFamily} />
          <div class="lbl" style="margin-top:.5rem;">Google Fonts CSS URL</div>
          <input class="inp" placeholder="https://fonts.googleapis.com/css2?..." bind:value={customFontUrl} />
          <button class="apply-btn" onclick={applyCustomFont}>套用</button>
        {/if}

        <div class="lbl" style="margin-top:.75rem;">全局對齊</div>
        <div class="btn-row">
          {#each ([['left','靠左'],['center','置中'],['right','靠右']] as const) as [v,l]}
            <button class="sz-btn" class:on={gd.textAlign===v} onclick={() => set({ textAlign: v })}>{l}</button>
          {/each}
        </div>

        {#each ([
          { key: 'textColor',    label: '文字顏色' },
          { key: 'bgBlockColor', label: '元件底色' },
          { key: 'borderColor',  label: '邊框顏色' },
        ] as const) as row}
          <div class="lbl" style="margin-top:.75rem;">{row.label}</div>
          <div class="swatch-row">
            {#each gd.palette as c}
              <button class="sw" style="background:{c};" class:sw-on={(gd as any)[row.key]===c}
                onclick={() => set({ [row.key]: c } as any)} aria-label={c}></button>
            {/each}
            <label class="sw sw-pick" title="自訂">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              <input type="color" style="display:none;"
                value={(gd as any)[row.key]?.startsWith?.('#') ? (gd as any)[row.key] : '#888888'}
                oninput={(e) => set({ [row.key]: (e.target as HTMLInputElement).value } as any)} />
            </label>
          </div>
        {/each}

        <div class="lbl" style="margin-top:.75rem;">元件透明度</div>
        <div class="sl-row">
          <input type="range" class="slider" min="0" max="100" value={gd.bgBlockOpacity}
            style="--v:{gd.bgBlockOpacity}%"
            oninput={(e) => set({ bgBlockOpacity: +(e.target as HTMLInputElement).value })} />
          <span class="sl-val">{gd.bgBlockOpacity}%</span>
        </div>

        <div class="row2" style="margin-top:.75rem;">
          <div>
            <div class="lbl">邊框粗細</div>
            <select class="sel" value={gd.borderWidth}
              onchange={(e) => set({ borderWidth: (e.target as HTMLSelectElement).value })}>
              <option value="1px">細 (1px)</option>
              <option value="2px">中 (2px)</option>
              <option value="3px">粗 (3px)</option>
            </select>
          </div>
          <div>
            <div class="lbl">邊框樣式</div>
            <select class="sel" value={gd.borderStyle}
              onchange={(e) => set({ borderStyle: (e.target as HTMLSelectElement).value })}>
              <option value="double">雙線</option>
              <option value="solid">實線</option>
              <option value="dashed">虛線</option>
            </select>
          </div>
          <div>
            <div class="lbl">圓角</div>
            <div class="sl-row" style="margin-top:.2rem;">
              <input type="range" class="slider" min="0" max="48" value={parseInt(gd.radius)||32}
                style="--v:{(parseInt(gd.radius)||32)/48*100}%"
                oninput={(e) => set({ radius: (e.target as HTMLInputElement).value + 'px' })} />
              <span class="sl-val">{gd.radius}</span>
            </div>
          </div>
        </div>
      </div>

    <!-- ── 色彩庫 ── -->
    {:else if designTab === 'palette'}
      <div class="tab-body">
        <div class="lbl">目前色彩庫</div>
        <div class="pal-grid">
          {#each gd.palette as c, i}
            <div class="pal-item">
              <div class="pal-swatch" style="background:{c};"></div>
              <button class="pal-del" onclick={() => removeColor(i)} aria-label="刪除">✕</button>
            </div>
          {/each}
        </div>
        <div class="add-color-row">
          <input type="color" class="color-input" bind:value={newColor} />
          <button class="apply-btn" onclick={() => addColor(newColor)}>新增顏色</button>
        </div>
      </div>

    <!-- ── 佈局 ── -->
    {:else if designTab === 'layout'}
      <div class="tab-body">
        <div class="layout-row">
          <button class="lay-btn" class:on={gd.layoutWidth==='narrow'}
            onclick={() => set({ layoutWidth: 'narrow' })}>
            <div class="lay-icon lay-narrow"></div>
            <span>窄版</span>
          </button>
          <button class="lay-btn" class:on={gd.layoutWidth==='full'}
            onclick={() => set({ layoutWidth: 'full' })}>
            <div class="lay-icon lay-full"></div>
            <span>全寬</span>
          </button>
        </div>
        <p class="lay-hint">
          {gd.layoutWidth === 'narrow'
            ? '窄版：適合名片式版面，所有元件集中在窄版面寬度內。'
            : '全寬：元件延伸至整個視窗寬度。'}
        </p>
      </div>
    {/if}

    <!-- save -->
    <div class="design-footer">
      <button class="btn-save-design" onclick={submitDesign}>儲存頁面設計</button>
      <span class="saved-inline" class:visible={designSaved}>✓ 已儲存</span>
    </div>
  </section>

  <!-- hidden form for globalDesign save -->
  <form bind:this={designFormEl} method="POST" action="?/saveDesign" style="display:none;"
    use:enhance={() => {
      return async ({ result, update }) => {
        await update({ reset: false })
        if (result.type === 'success') {
          localStorage.setItem('card_global', designJsonInput)
        }
      }
    }}>
    <input type="hidden" name="design" bind:value={designJsonInput} />
  </form>

  <!-- ══ Hub 同步設定 ══════════════════════════════════ -->
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
  h2 { font-size: 0.85rem; font-weight: 500; color: var(--color-text-secondary); margin: 0 0 1rem; }

  /* ── Shared header / badge ── */
  .theme-head { margin-bottom: 1.25rem; }
  .theme-title {
    font-family: var(--font-display);
    font-size: 1.1rem; color: var(--blue);
    margin: 0 0 0.2rem;
    display: flex; align-items: center; gap: 0.75rem;
  }
  .theme-sub { font-size: 0.8rem; color: var(--color-text-tertiary); font-family: var(--font-mono); }
  .saved-badge {
    font-family: var(--font-mono); font-size: 11px;
    color: #16a34a; font-weight: 700; opacity: 0; transition: opacity 0.3s;
  }
  .saved-badge.visible { opacity: 1; }

  /* ── Dashboard theme ── */
  .theme-group { margin-bottom: 1.25rem; }
  .theme-group-label {
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    letter-spacing: 0.15em; color: var(--color-text-tertiary);
    margin-bottom: 0.6rem; text-transform: uppercase;
  }
  .palette-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }
  .palette-card {
    background: var(--white); border: 2px solid var(--color-border-tertiary);
    padding: 0.6rem 0.5rem; cursor: pointer; text-align: center;
    transition: border-color 0.12s, box-shadow 0.12s, transform 0.08s;
    border-radius: var(--border-radius-md);
  }
  .palette-card:hover { border-color: var(--blue); transform: translateY(-2px); }
  .palette-card.active { border-color: var(--blue); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
  .palette-swatches { display: flex; height: 28px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); border-radius: 2px; margin-bottom: 0.4rem; }
  .swatch { flex: 1; }
  .palette-name { font-size: 12px; font-weight: 700; line-height: 1.2; }
  .palette-name-en { font-family: var(--font-mono); font-size: 9px; color: var(--color-text-tertiary); }

  .font-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .font-card {
    background: var(--white); border: 2px solid var(--color-border-tertiary);
    padding: 0.75rem; cursor: pointer; text-align: center;
    transition: border-color 0.12s, box-shadow 0.12s, transform 0.08s;
    border-radius: var(--border-radius-md);
  }
  .font-card:hover { border-color: var(--blue); transform: translateY(-2px); }
  .font-card.active { border-color: var(--blue); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
  .font-preview { font-size: 1.8rem; font-weight: 700; line-height: 1; color: var(--blue); margin-bottom: 0.4rem; letter-spacing: -0.02em; }
  .font-name { font-size: 12px; font-weight: 700; }
  .font-name-en { font-family: var(--font-mono); font-size: 9px; color: var(--color-text-tertiary); }

  /* ── Page design (GlobalDesign) ── */
  .design-section { border: var(--border); box-shadow: var(--shadow-md); }
  .design-head { margin-bottom: 1rem; }

  .dtab-bar {
    display: flex; gap: 0.25rem;
    border-bottom: 1px solid var(--color-border-tertiary);
    margin-bottom: 1.25rem;
  }
  .dtab {
    padding: 0.45rem 1rem; background: none; border: none; cursor: pointer;
    font-family: var(--font-body); font-size: 0.82rem; font-weight: 600;
    color: var(--color-text-tertiary); border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: color 0.12s, border-color 0.12s;
  }
  .dtab:hover { color: var(--color-text-primary); }
  .dtab.active { color: var(--blue); border-bottom-color: var(--blue); }

  .tab-body { display: flex; flex-direction: column; gap: 0.6rem; }

  /* shared controls */
  .lbl {
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em;
    color: var(--color-text-tertiary); text-transform: uppercase;
  }
  .inp {
    padding: 0.5rem 0.75rem; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); font-size: 0.85rem;
    background: var(--color-background-primary); color: var(--color-text-primary);
    width: 100%; box-sizing: border-box; font-family: inherit;
  }
  .inp:focus { outline: none; border-color: var(--blue); }
  .sel {
    width: 100%; padding: 0.45rem 0.7rem;
    border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md);
    background: var(--color-background-primary); font-size: 0.82rem;
    color: var(--color-text-primary); font-family: inherit; cursor: pointer;
  }
  .row2 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
  .btn-row { display: flex; gap: 0.5rem; }
  .sz-btn {
    flex: 1; padding: 0.4rem; border-radius: var(--border-radius-md);
    border: 0.5px solid var(--color-border-secondary);
    background: var(--color-background-primary);
    font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary);
    cursor: pointer; font-family: inherit; transition: all 0.12s;
  }
  .sz-btn.on { background: var(--color-text-primary); color: var(--color-background-primary); border-color: var(--color-text-primary); }
  .apply-btn {
    padding: 0.4rem 0.9rem; border-radius: var(--border-radius-md);
    border: 0.5px solid var(--blue);
    background: color-mix(in srgb, var(--blue) 8%, transparent);
    color: var(--blue); font-size: 0.8rem; font-weight: 600;
    cursor: pointer; font-family: inherit; align-self: flex-start;
  }

  /* sliders */
  .sl-row { display: flex; align-items: center; gap: 0.5rem; }
  .sl-lbl { font-size: 0.7rem; font-weight: 700; color: var(--color-text-tertiary); width: 2.25rem; flex-shrink: 0; }
  .slider {
    flex: 1; height: 4px; appearance: none; border-radius: 999px; cursor: pointer; outline: none;
    background: linear-gradient(to right, var(--blue) var(--v,50%), color-mix(in srgb, var(--blue) 15%, transparent) var(--v,50%));
  }
  .slider::-webkit-slider-thumb { appearance: none; width: 1rem; height: 1rem; border-radius: 50%; background: white; border: 2px solid var(--blue); cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.15); }
  .sl-val { font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); min-width: 2.5rem; text-align: right; }

  /* swatches */
  .swatch-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .sw { width: 1.75rem; height: 1.75rem; border-radius: 0.5rem; cursor: pointer; border: 2px solid transparent; transition: all 0.12s; flex-shrink: 0; }
  .sw:hover { transform: scale(1.08); }
  .sw.sw-on { border-color: var(--color-text-primary); transform: scale(1.1); box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color-text-primary); }
  .sw-pick { display: flex; align-items: center; justify-content: center; background: var(--color-background-secondary); color: var(--color-text-tertiary); border-style: dashed; border-color: var(--color-border-secondary); }
  .sw-pick:hover { border-color: var(--blue); color: var(--blue); }

  /* upload */
  .upload-zone {
    display: flex; align-items: center; justify-content: center;
    width: 100%; height: 5.5rem;
    border: 1.5px dashed var(--color-border-secondary);
    border-radius: var(--border-radius-md); cursor: pointer;
    overflow: hidden; position: relative;
    background: var(--color-background-secondary); transition: border-color 0.15s;
  }
  .upload-zone:hover { border-color: var(--blue); }
  .upload-zone.has-img { border-style: solid; }
  .upload-hint { font-size: 0.78rem; color: var(--color-text-tertiary); font-weight: 600; }
  .upload-preview { width: 100%; height: 100%; object-fit: cover; }
  .upload-ov { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: 700; opacity: 0; transition: opacity 0.15s; }
  .upload-zone:hover .upload-ov { opacity: 1; }
  .remove-btn { font-size: 0.72rem; font-weight: 700; color: rgba(180,40,40,.7); background: none; border: 0.5px solid rgba(180,40,40,.15); border-radius: 0.5rem; padding: 0.25rem 0.6rem; cursor: pointer; font-family: inherit; align-self: flex-start; }
  .upload-error { font-size: 0.75rem; color: var(--color-text-danger, #c0392b); margin: 0; }

  /* palette tab */
  .pal-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem; }
  .pal-item { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
  .pal-swatch { width: 100%; aspect-ratio: 1; border-radius: 0.5rem; border: 0.5px solid var(--color-border-tertiary); }
  .pal-del { background: none; border: none; cursor: pointer; font-size: 0.7rem; color: var(--color-text-tertiary); padding: 0.1rem; }
  .pal-del:hover { color: var(--color-text-danger, #c0392b); }
  .add-color-row { display: flex; align-items: center; gap: 0.75rem; }
  .color-input { width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; border: 0.5px solid var(--color-border-secondary); cursor: pointer; padding: 0.125rem; background: white; }

  /* layout tab */
  .layout-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .lay-btn {
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    padding: 1rem 0.5rem; border-radius: var(--border-radius-md);
    border: 2px solid var(--color-border-tertiary);
    background: var(--color-background-primary); cursor: pointer;
    font-family: inherit; font-size: 0.8rem; font-weight: 700;
    color: var(--color-text-secondary); transition: all 0.12s;
  }
  .lay-btn.on { border-color: var(--blue); background: color-mix(in srgb, var(--blue) 5%, transparent); color: var(--blue); }
  .lay-icon { border: 2.5px solid currentColor; border-radius: 0.25rem; }
  .lay-narrow { width: 1.5rem; height: 1.25rem; }
  .lay-full { width: 2.5rem; height: 1.25rem; }
  .lay-hint { font-size: 0.75rem; color: var(--color-text-tertiary); line-height: 1.5; margin: 0; }

  /* footer */
  .design-footer { display: flex; align-items: center; gap: 1rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 0.5px solid var(--color-border-tertiary); }
  .btn-save-design {
    padding: 0.5rem 1.25rem; background: var(--blue); color: white;
    border: none; border-radius: var(--border-radius-md);
    font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: opacity 0.12s;
  }
  .btn-save-design:hover { opacity: 0.85; }
  .saved-inline { font-size: 0.8rem; font-weight: 700; color: #16a34a; opacity: 0; transition: opacity 0.3s; }
  .saved-inline.visible { opacity: 1; }

  /* ── Hub section ── */
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
    .font-grid { grid-template-columns: 1fr 1fr; }
    .row2 { grid-template-columns: 1fr 1fr; }
    .pal-grid { grid-template-columns: repeat(4, 1fr); }
  }
  @media (max-width: 480px) {
    .row2 { grid-template-columns: 1fr; }
    .dtab { padding: 0.4rem 0.65rem; font-size: 0.78rem; }
  }
</style>
