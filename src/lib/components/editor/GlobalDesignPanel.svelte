<script lang="ts">
  import type { GlobalDesign } from './globalDesign'

  interface Props {
    design: GlobalDesign
    onpatch: (patch: Partial<GlobalDesign>) => void
    onclose: () => void
    uploading?: boolean
    onupload?: (file: File) => void
  }

  let { design, onpatch, onclose, uploading = false, onupload }: Props = $props()

  let sec = $state({ bg: true, font: false, palette: false, layout: false })
  let newColor = $state('#7ab8d8')
  let customFontFamily = $state('')
  let customFontUrl = $state('')

  const FONT_PRESETS = [
    { label: '系統字體',       value: 'inherit',                                url: '' },
    { label: '思源黑體',       value: "'Noto Sans TC', sans-serif",             url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap' },
    { label: '思源宋體',       value: "'Noto Serif TC', serif",                 url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700;900&display=swap' },
    { label: 'M PLUS 圓體',   value: "'M PLUS Rounded 1c', sans-serif",        url: 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;900&display=swap' },
    { label: 'Zen 角哥德',    value: "'Zen Kaku Gothic New', sans-serif",       url: 'https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&display=swap' },
  ]

  const fontSelectValue = $derived(
    FONT_PRESETS.some(f => f.value === design.fontFamily) ? design.fontFamily : 'custom'
  )

  function set(patch: Partial<GlobalDesign>) { onpatch(patch) }

  function selectFont(value: string) {
    if (value === 'custom') return
    const p = FONT_PRESETS.find(f => f.value === value)
    if (p) set({ fontFamily: p.value, fontUrl: p.url })
  }

  function applyCustomFont() {
    if (customFontFamily.trim()) set({ fontFamily: customFontFamily.trim(), fontUrl: customFontUrl.trim() })
  }

  function addColor() {
    if (!design.palette.includes(newColor)) set({ palette: [...design.palette, newColor] })
  }

  function removeColor(i: number) {
    set({ palette: design.palette.filter((_, idx) => idx !== i) })
  }
</script>

<svelte:head>
  {#if design.fontUrl}
    <link rel="stylesheet" href={design.fontUrl} />
  {/if}
</svelte:head>

<div class="gd-panel panel-enter" role="complementary" aria-label="全局設計">
  <div class="gd-inner">

    <div class="gd-hdr">
      <div class="gd-hdr-left">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <span class="gd-title">全局網站設計</span>
      </div>
      <button class="close-btn" onclick={onclose} aria-label="關閉">✕</button>
    </div>

    <div class="gd-body">

      <!-- 背景設定 -->
      <div class="section">
        <button class="sec-hdr" onclick={() => sec = { ...sec, bg: !sec.bg }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span>背景設定</span>
          <span class="chevron" class:open={sec.bg}>›</span>
        </button>
        {#if sec.bg}
          <div class="sec-body">
            <!-- Upload zone -->
            <label class="upload-zone" class:has-img={!!design.bgImage}>
              {#if design.bgImage}
                <img src={design.bgImage} alt="" class="upload-preview" />
                <div class="upload-ov"><span>{uploading ? '上傳中…' : '更換圖片'}</span></div>
              {:else}
                <span class="upload-hint">{uploading ? '上傳中…' : '點擊或拖曳圖片至此處'}</span>
              {/if}
              <input type="file" accept="image/*" style="display:none;" disabled={uploading}
                onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f && onupload) onupload(f) }} />
            </label>
            {#if design.bgImage}
              <button class="remove-btn" onclick={() => set({ bgImage: '' })}>移除背景圖片</button>
            {/if}
            <div class="p-label">或貼上 URL</div>
            <input class="p-input" placeholder="https://..." value={design.bgImage}
              onchange={(e) => set({ bgImage: (e.target as HTMLInputElement).value })} />

            <div class="p-label">背景色</div>
            <div class="swatch-row">
              {#each design.palette as c}
                <button class="sw" style="background:{c};" class:sw-on={design.bgColor===c}
                  onclick={() => set({ bgColor: c })} aria-label={c}></button>
              {/each}
              <label class="sw sw-pick" title="自訂">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                <input type="color" style="display:none;" value="#f5f0e8"
                  oninput={(e) => set({ bgColor: (e.target as HTMLInputElement).value })} />
              </label>
            </div>

            <div class="two-col">
              <div>
                <div class="p-label">重複</div>
                <select class="p-sel" value={design.bgRepeat}
                  onchange={(e) => set({ bgRepeat: (e.target as HTMLSelectElement).value as any })}>
                  <option value="no-repeat">不重複</option>
                  <option value="repeat">重複</option>
                  <option value="repeat-x">水平</option>
                  <option value="repeat-y">垂直</option>
                </select>
              </div>
              <div>
                <div class="p-label">填充</div>
                <select class="p-sel" value={design.bgSize}
                  onchange={(e) => set({ bgSize: (e.target as HTMLSelectElement).value as any })}>
                  <option value="cover">裁切填滿</option>
                  <option value="contain">完整顯示</option>
                  <option value="100% 100%">拉伸</option>
                  <option value="auto">原尺寸</option>
                </select>
              </div>
            </div>
            <div class="two-col">
              <div>
                <div class="p-label">圖片捲動</div>
                <select class="p-sel" value={design.bgAttachment}
                  onchange={(e) => set({ bgAttachment: (e.target as HTMLSelectElement).value as any })}>
                  <option value="fixed">固定畫面</option>
                  <option value="scroll">跟著畫面</option>
                </select>
              </div>
            </div>

            <div class="p-label" style="margin-top:.4rem;">圖片風格（遮罩）</div>
            <div class="slider-group">
              {#each [
                { key: 'bgBrightness', label: '亮暗', min: 0, max: 200, unit: '%', v: design.bgBrightness },
                { key: 'bgBlur',       label: '模糊', min: 0, max: 20,  unit: 'px', v: design.bgBlur },
                { key: 'bgSaturation', label: '飽和', min: 0, max: 200, unit: '%', v: design.bgSaturation },
              ] as row}
                <div class="sl-row">
                  <span class="sl-lbl">{row.label}</span>
                  <input type="range" class="p-slider" min={row.min} max={row.max} value={row.v}
                    style="--v:{((row.v - row.min) / (row.max - row.min)) * 100}%"
                    oninput={(e) => set({ [row.key]: +(e.target as HTMLInputElement).value } as any)} />
                  <span class="sl-val">{row.v}{row.unit}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- 字型與主色 -->
      <div class="section">
        <button class="sec-hdr" onclick={() => sec = { ...sec, font: !sec.font }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
          <span>字型與主色</span>
          <span class="chevron" class:open={sec.font}>›</span>
        </button>
        {#if sec.font}
          <div class="sec-body">
            <div class="p-label">字體</div>
            <select class="p-sel" value={fontSelectValue}
              onchange={(e) => { const v = (e.target as HTMLSelectElement).value; if (v !== 'custom') selectFont(v) }}>
              {#each FONT_PRESETS as f}
                <option value={f.value}>{f.label}</option>
              {/each}
              <option value="custom">自訂字體…</option>
            </select>
            {#if fontSelectValue === 'custom'}
              <div class="p-label" style="margin-top:.4rem;">CSS font-family</div>
              <input class="p-input" placeholder="'My Font', sans-serif" bind:value={customFontFamily} />
              <div class="p-label" style="margin-top:.4rem;">Google Fonts CSS URL</div>
              <input class="p-input" placeholder="https://fonts.googleapis.com/css2?..." bind:value={customFontUrl} />
              <button class="apply-btn" onclick={applyCustomFont}>套用</button>
            {/if}

            <div class="p-label" style="margin-top:.5rem;">全局對齊</div>
            <div class="btn-row">
              {#each [['left','靠左'],['center','置中'],['right','靠右']] as [v,l]}
                <button class="sz-btn" class:on={design.textAlign===v}
                  onclick={() => set({ textAlign: v as any })}>{l}</button>
              {/each}
            </div>

            {#each [
              { key: 'textColor',    label: '文字顏色' },
              { key: 'bgBlockColor', label: '元件底色' },
              { key: 'borderColor',  label: '邊框顏色' },
            ] as row}
              <div class="p-label" style="margin-top:.4rem;">{row.label}</div>
              <div class="swatch-row">
                {#each design.palette as c}
                  <button class="sw" style="background:{c};" class:sw-on={(design as any)[row.key]===c}
                    onclick={() => set({ [row.key]: c } as any)} aria-label={c}></button>
                {/each}
                <label class="sw sw-pick" title="自訂">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  <input type="color" style="display:none;"
                    value={(design as any)[row.key]?.startsWith?.('#') ? (design as any)[row.key] : '#888888'}
                    oninput={(e) => set({ [row.key]: (e.target as HTMLInputElement).value } as any)} />
                </label>
              </div>
            {/each}

            <div class="p-label" style="margin-top:.4rem;">透明度</div>
            <div class="sl-row">
              <input type="range" class="p-slider" min="0" max="100" value={design.bgBlockOpacity}
                style="--v:{design.bgBlockOpacity}%"
                oninput={(e) => set({ bgBlockOpacity: +(e.target as HTMLInputElement).value })} />
              <span class="sl-val">{design.bgBlockOpacity}%</span>
            </div>

            <div class="two-col" style="margin-top:.4rem;">
              <div>
                <div class="p-label">邊框粗細</div>
                <select class="p-sel" value={design.borderWidth}
                  onchange={(e) => set({ borderWidth: (e.target as HTMLSelectElement).value })}>
                  <option value="1px">細 (1px)</option>
                  <option value="2px">中 (2px)</option>
                  <option value="3px">粗 (3px)</option>
                </select>
              </div>
              <div>
                <div class="p-label">邊框樣式</div>
                <select class="p-sel" value={design.borderStyle}
                  onchange={(e) => set({ borderStyle: (e.target as HTMLSelectElement).value })}>
                  <option value="double">雙線</option>
                  <option value="solid">實線</option>
                  <option value="dashed">虛線</option>
                </select>
              </div>
            </div>

            <div class="p-label" style="margin-top:.4rem;">圓角</div>
            <div class="sl-row">
              <input type="range" class="p-slider" min="0" max="48" value={parseInt(design.radius)||32}
                style="--v:{(parseInt(design.radius)||32)/48*100}%"
                oninput={(e) => set({ radius: (e.target as HTMLInputElement).value + 'px' })} />
              <span class="sl-val">{design.radius}</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- 主題色彩庫 -->
      <div class="section">
        <button class="sec-hdr" onclick={() => sec = { ...sec, palette: !sec.palette }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/></svg>
          <span>主題色彩庫</span>
          <span class="chevron" class:open={sec.palette}>›</span>
        </button>
        {#if sec.palette}
          <div class="sec-body">
            <div class="pal-grid">
              {#each design.palette as c, i}
                <div class="pal-item">
                  <div class="pal-swatch" style="background:{c};"></div>
                  <button class="pal-del" onclick={() => removeColor(i)} aria-label="刪除">🗑</button>
                </div>
              {/each}
            </div>
            <div class="add-color-row">
              <input type="color" class="color-input" bind:value={newColor} />
              <button class="add-color-btn" onclick={addColor}>新增顏色</button>
            </div>
          </div>
        {/if}
      </div>

      <!-- 佈局寬度 -->
      <div class="section">
        <button class="sec-hdr" onclick={() => sec = { ...sec, layout: !sec.layout }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
          <span>佈局寬度</span>
          <span class="chevron" class:open={sec.layout}>›</span>
        </button>
        {#if sec.layout}
          <div class="sec-body">
            <div class="layout-row">
              <button class="lay-btn" class:on={design.layoutWidth==='narrow'}
                onclick={() => set({ layoutWidth: 'narrow' })}>
                <div class="lay-icon lay-narrow"></div>
                <span>窄</span>
              </button>
              <button class="lay-btn" class:on={design.layoutWidth==='full'}
                onclick={() => set({ layoutWidth: 'full' })}>
                <div class="lay-icon lay-full"></div>
                <span>全寬</span>
              </button>
            </div>
            <p class="lay-hint">
              {design.layoutWidth === 'narrow'
                ? '窄模式：適合名片式版面，所有元件集中在窄版面寬度內。'
                : '全寬模式：元件延伸至整個視窗寬度。'}
            </p>
          </div>
        {/if}
      </div>

    </div>
  </div>
</div>

<style>
  @keyframes slideLeft { from { transform:translateX(100%);opacity:0 } to { transform:translateX(0);opacity:1 } }
  .panel-enter { animation: slideLeft .22s cubic-bezier(.25,.46,.45,.94) both }

  .gd-panel { position:fixed; right:1.5rem; top:5rem; z-index:50; width:18rem; max-height:calc(100vh - 6.25rem) }
  .gd-inner { background:white; border-radius:1.875rem; overflow:hidden; display:flex; flex-direction:column; max-height:calc(100vh - 6.25rem); box-shadow:0 20px 60px color-mix(in srgb,var(--ink) 15%,transparent) }
  .gd-hdr { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.25rem 1rem; border-bottom:1px solid color-mix(in srgb,var(--ink) 6%,transparent); flex-shrink:0 }
  .gd-hdr-left { display:flex; align-items:center; gap:.5rem }
  .gd-title { font-weight:700; font-size:.875rem; color:var(--ink) }
  .close-btn { width:1.75rem; height:1.75rem; border-radius:999px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.875rem; background:color-mix(in srgb,var(--ink) 5%,transparent); color:color-mix(in srgb,var(--ink) 30%,transparent); transition:background .15s }
  .close-btn:hover { background:color-mix(in srgb,var(--ink) 10%,transparent) }

  .gd-body { overflow-y:auto; flex:1; padding:.75rem; display:flex; flex-direction:column; gap:.5rem }
  .gd-body::-webkit-scrollbar { width:4px }
  .gd-body::-webkit-scrollbar-thumb { background:var(--blue); border-radius:99px }

  .section { border:1px solid color-mix(in srgb,var(--ink) 8%,transparent); border-radius:1rem; overflow:hidden }
  .sec-hdr { display:flex; align-items:center; gap:.5rem; width:100%; padding:.75rem 1rem; background:white; border:none; cursor:pointer; font-family:inherit; font-size:.8125rem; font-weight:700; color:color-mix(in srgb,var(--ink) 65%,transparent); text-align:left; transition:background .1s }
  .sec-hdr:hover { background:color-mix(in srgb,var(--ink) 3%,transparent) }
  .chevron { margin-left:auto; font-size:1rem; display:inline-block; transform:rotate(90deg); transition:transform .2s; color:color-mix(in srgb,var(--ink) 25%,transparent) }
  .chevron.open { transform:rotate(-90deg) }
  .sec-body { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.5rem; border-top:1px solid color-mix(in srgb,var(--ink) 5%,transparent); background:color-mix(in srgb,var(--cream) 25%,transparent) }

  /* Upload */
  .upload-zone { display:flex; align-items:center; justify-content:center; width:100%; height:5rem; border:1.5px dashed color-mix(in srgb,var(--ink) 15%,transparent); border-radius:.875rem; cursor:pointer; overflow:hidden; position:relative; background:color-mix(in srgb,var(--cream) 50%,transparent); transition:border-color .15s }
  .upload-zone:hover { border-color:var(--blue) }
  .upload-zone.has-img { border-style:solid }
  .upload-hint { font-size:.75rem; color:color-mix(in srgb,var(--ink) 35%,transparent); font-weight:600 }
  .upload-preview { width:100%; height:100%; object-fit:cover }
  .upload-ov { position:absolute; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; color:white; font-size:.75rem; font-weight:700; opacity:0; transition:opacity .15s }
  .upload-zone:hover .upload-ov { opacity:1 }
  .remove-btn { font-size:.7rem; font-weight:700; color:rgba(200,50,50,.65); background:none; border:1px solid rgba(200,50,50,.15); border-radius:.5rem; padding:.25rem .6rem; cursor:pointer; font-family:inherit; align-self:flex-start }

  /* Controls */
  .p-label { font-size:.6875rem; font-weight:700; color:color-mix(in srgb,var(--ink) 35%,transparent); text-transform:uppercase; letter-spacing:.06em }
  .p-input { width:100%; padding:.45rem .7rem; border:1px solid color-mix(in srgb,var(--ink) 12%,transparent); border-radius:.75rem; background:white; font-size:.8125rem; color:var(--ink); outline:none; font-family:inherit }
  .p-input:focus { border-color:var(--blue) }
  .p-sel { width:100%; padding:.4rem .7rem; border:1px solid color-mix(in srgb,var(--ink) 12%,transparent); border-radius:.75rem; background:white; font-size:.78rem; color:var(--ink); outline:none; font-family:inherit; cursor:pointer }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:.5rem }
  .btn-row { display:flex; gap:.5rem }
  .sz-btn { flex:1; padding:.4rem; border-radius:.75rem; border:1px solid color-mix(in srgb,var(--ink) 10%,transparent); background:white; font-size:.75rem; font-weight:700; color:color-mix(in srgb,var(--ink) 40%,transparent); cursor:pointer; font-family:inherit; transition:all .15s }
  .sz-btn.on { background:var(--ink); color:white; border-color:var(--ink) }
  .apply-btn { padding:.4rem .875rem; border-radius:.75rem; border:1px solid var(--blue); background:color-mix(in srgb,var(--blue) 10%,transparent); color:var(--blue); font-size:.75rem; font-weight:700; cursor:pointer; font-family:inherit; align-self:flex-start }

  /* Sliders */
  .slider-group { display:flex; flex-direction:column; gap:.35rem }
  .sl-row { display:flex; align-items:center; gap:.5rem }
  .sl-lbl { font-size:.625rem; font-weight:700; color:color-mix(in srgb,var(--ink) 35%,transparent); width:2rem; flex-shrink:0 }
  .p-slider { flex:1; height:4px; appearance:none; border-radius:999px; cursor:pointer; outline:none; background:linear-gradient(to right,var(--ink) var(--v,50%),color-mix(in srgb,var(--ink) 10%,transparent) var(--v,50%)) }
  .p-slider::-webkit-slider-thumb { appearance:none; width:1rem; height:1rem; border-radius:50%; background:white; border:2px solid var(--ink); cursor:pointer }
  .sl-val { font-size:.7rem; font-weight:700; color:color-mix(in srgb,var(--ink) 40%,transparent); min-width:2.5rem; text-align:right }

  /* Swatches */
  .swatch-row { display:flex; flex-wrap:wrap; gap:.35rem }
  .sw { width:1.75rem; height:1.75rem; border-radius:.5rem; cursor:pointer; border:2px solid transparent; transition:all .15s; flex-shrink:0 }
  .sw:hover { transform:scale(1.08) }
  .sw.sw-on { border-color:var(--ink); transform:scale(1.1); box-shadow:0 0 0 2px white,0 0 0 4px var(--ink) }
  .sw-pick { display:flex; align-items:center; justify-content:center; background:color-mix(in srgb,var(--ink) 6%,transparent); color:color-mix(in srgb,var(--ink) 35%,transparent); border-style:dashed; border-color:color-mix(in srgb,var(--ink) 18%,transparent) }
  .sw-pick:hover { border-color:var(--blue); color:var(--blue) }

  /* Palette library */
  .pal-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.5rem }
  .pal-item { display:flex; flex-direction:column; align-items:center; gap:.25rem }
  .pal-swatch { width:100%; aspect-ratio:1.4; border-radius:.625rem; border:1px solid color-mix(in srgb,var(--ink) 8%,transparent) }
  .pal-del { background:none; border:none; cursor:pointer; font-size:.8rem; opacity:.5; padding:.1rem }
  .pal-del:hover { opacity:1 }
  .add-color-row { display:flex; align-items:center; gap:.5rem }
  .color-input { width:2.5rem; height:2.5rem; border-radius:.625rem; border:1px solid color-mix(in srgb,var(--ink) 12%,transparent); cursor:pointer; padding:.125rem; background:white }
  .add-color-btn { flex:1; padding:.5rem; border-radius:.75rem; border:1px solid color-mix(in srgb,var(--blue) 30%,transparent); background:color-mix(in srgb,var(--blue) 8%,transparent); color:var(--blue); font-size:.75rem; font-weight:700; cursor:pointer; font-family:inherit; transition:background .15s }
  .add-color-btn:hover { background:color-mix(in srgb,var(--blue) 15%,transparent) }

  /* Layout */
  .layout-row { display:grid; grid-template-columns:1fr 1fr; gap:.5rem }
  .lay-btn { display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:.875rem .5rem; border-radius:1rem; border:2px solid color-mix(in srgb,var(--ink) 10%,transparent); background:white; cursor:pointer; font-family:inherit; font-size:.75rem; font-weight:700; color:color-mix(in srgb,var(--ink) 45%,transparent); transition:all .15s }
  .lay-btn.on { border-color:var(--blue); background:color-mix(in srgb,var(--blue) 8%,transparent); color:var(--blue) }
  .lay-icon { border:2.5px solid currentColor; border-radius:.25rem }
  .lay-narrow { width:1.5rem; height:1.25rem }
  .lay-full { width:2.25rem; height:1.25rem }
  .lay-hint { font-size:.6875rem; color:color-mix(in srgb,var(--ink) 40%,transparent); line-height:1.5; margin:0 }
</style>
