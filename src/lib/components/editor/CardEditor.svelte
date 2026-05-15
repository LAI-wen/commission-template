<script lang="ts">
  import GlobalDesignPanel from './GlobalDesignPanel.svelte'
  import { DEFAULT_GLOBAL } from './globalDesign'
  import type { GlobalDesign } from './globalDesign'
  import type { CommissionType } from '$lib/db'

  type StyleMap = {
    bgColor?: string; textColor?: string; borderColor?: string
    borderStyle?: string; borderWidth?: string; radius?: string; opacity?: number
  }
  type Block = { id: string; type: string; data: Record<string, any> }

  interface Props {
    creator?: { display_name?: any; avatar_url?: string | null; [k: string]: any } | null
    types?: CommissionType[]
  }
  let { creator = null, types = [] }: Props = $props()

  function extractName(n: any): string {
    if (!n) return '創作者名稱'
    if (typeof n === 'string') return n
    if (typeof n === 'object') return n.zh ?? n.en ?? '創作者名稱'
    return '創作者名稱'
  }

  // ── Global design ──
  let globalDesign = $state<GlobalDesign>({ ...DEFAULT_GLOBAL })
  let globalOpen   = $state(false)
  let bgUploading  = $state(false)

  const THEME = $derived<Required<StyleMap>>({
    bgColor:     globalDesign.bgBlockColor,
    textColor:   globalDesign.textColor,
    borderColor: globalDesign.borderColor,
    borderStyle: globalDesign.borderStyle,
    borderWidth: globalDesign.borderWidth,
    radius:      globalDesign.radius,
    opacity:     globalDesign.bgBlockOpacity,
  })

  const PALETTE = $derived(
    globalDesign.palette.map((bg, i) => ({ bg, label: `color-${i}` }))
  )

  // ── State ──
  let blocks = $state<Block[]>([
    { id:'profile_avatar', type:'avatar',       data:{ src: creator?.avatar_url ?? 'https://i.pravatar.cc/200?img=47', shape:'square' } },
    { id:'profile_name',   type:'profile_name', data:{ name: extractName(creator?.display_name) } },
    { id:'el_sec_001',     type:'section',      data:{ title:'#HOME' } },
    { id:'el_img_001',     type:'image',        data:{ src:'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=60', alt:'作品' } },
    { id:'el_tags_001',    type:'tags',         data:{ tags:['畫圖的','⬛ 開發','🎮 FF14小草'] } },
    { id:'el_gal_001',     type:'gallery',      data:{ cols:3, images:['https://picsum.photos/seed/a1/200','https://picsum.photos/seed/a2/200','https://picsum.photos/seed/a3/200'] } },
    { id:'el_cd_001',      type:'countdown',    data:{ label:'HAPPY DAY', targetDate:'2026-12-31' } },
    { id:'el_anon_001',    type:'anon_box',     data:{ title:'匿名箱', placeholder:'在此輸入...' } },
    { id:'el_btn_001',     type:'button',       data:{ label:'Twitter / X', icon:'𝕏', url:'#' } },
  ])

  let selectedId  = $state<string | null>(null)
  let overrides   = $state<Record<string, StyleMap>>({})
  let addOpen     = $state(false)
  let cdTick      = $state(0)
  let toasts      = $state<{ id: number; msg: string }[]>([])
  let toastN      = $state(0)
  let dragSrcId   = $state<string | null>(null)
  let device      = $state<'mobile' | 'desktop'>('desktop')

  let selBlock = $derived(blocks.find(b => b.id === selectedId) ?? null)

  // ── 初始化 / 倒計時 ──
  $effect(() => {
    try {
      const sb = localStorage.getItem('card_blocks')
      const so = localStorage.getItem('card_overrides')
      const sg = localStorage.getItem('card_global')
      if (sb) blocks = JSON.parse(sb)
      if (so) overrides = JSON.parse(so)
      if (sg) globalDesign = { ...DEFAULT_GLOBAL, ...JSON.parse(sg) }
    } catch {}
    const iv = setInterval(() => cdTick++, 1000)
    return () => clearInterval(iv)
  })

  // ── 樣式輔助 ──
  function S(id: string): Required<StyleMap> {
    return { ...THEME, ...(overrides[id] ?? {}) } as Required<StyleMap>
  }
  function mix(c: string, pct: number) {
    return `color-mix(in srgb, ${c} ${pct}%, transparent)`
  }
  function blockBg(id: string) {
    const s = S(id)
    return `background-color:${mix(s.bgColor,s.opacity)};border-color:${s.borderColor};border-width:${s.borderWidth};border-style:${s.borderStyle};border-radius:${s.radius};color:${s.textColor};`
  }
  function avR(id: string, shape: string) {
    return shape === 'circle' ? '50%' : `calc(${S(id).radius} - 8px)`
  }
  function calcCD(targetDate: string) {
    void cdTick
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return null
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }

  // ── 選取 ──
  function sel(id: string) { selectedId = id }
  function closePanel() { selectedId = null }

  // ── 刪除 ──
  function delBlock() {
    if (!selectedId) return
    const name = LABELS[blocks.find(b => b.id === selectedId)?.type ?? ''] ?? '元件'
    blocks = blocks.filter(b => b.id !== selectedId)
    selectedId = null
    toast(`已刪除 ${name}`)
  }

  // ── 新增 ──
  const DEFS: Record<string, Record<string, any>> = {
    avatar:       { src:'https://i.pravatar.cc/200?img=47', shape:'square' },
    profile_name: { name:'新名稱' },
    section:      { title:'#新區段' },
    image:        { src:'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=60', alt:'' },
    gallery:      { cols:3, images:['https://picsum.photos/seed/b1/200','https://picsum.photos/seed/b2/200','https://picsum.photos/seed/b3/200'] },
    tags:         { tags:['標籤一','標籤二'] },
    button:       { label:'連結按鈕', icon:'→', url:'#' },
    countdown:    { label:'倒數', targetDate:'2026-12-31' },
    anon_box:     { title:'匿名箱', placeholder:'在此輸入...' },
    visitor:      { label:'歡迎光臨', count:'0' },
    text:         { content:'在此輸入文字內容...', size:'base' },
    commission:   {},
    queue:        { label:'目前排單', max:10, current:3 },
  }
  function addBlock(type: string) {
    const id = 'el_' + Date.now()
    blocks = [...blocks, { id, type, data: { ...(DEFS[type] ?? {}) } }]
    selectedId = id
    addOpen = false
    toast(`已新增「${LABELS[type] ?? type}」`)
  }

  // ── 資料更新 ──
  function upd(id: string, key: string, value: any) {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx < 0) return
    blocks[idx] = { ...blocks[idx], data: { ...blocks[idx].data, [key]: value } }
    blocks = [...blocks]
  }
  function setStyle(id: string, key: string, value: any) {
    overrides = { ...overrides, [id]: { ...(overrides[id] ?? {}), [key]: value } }
  }
  function toggleOverride(id: string) {
    if (overrides[id]) {
      const { [id]: _, ...rest } = overrides
      overrides = rest
    } else {
      overrides = { ...overrides, [id]: {} }
    }
  }

  // ── 拖拉排序 ──
  function dstart(e: DragEvent, id: string) {
    dragSrcId = id
    e.dataTransfer?.setData('text/plain', id)
    setTimeout(() => document.querySelector(`[data-id="${id}"]`)?.classList.add('dragging'), 0)
  }
  function dover(e: DragEvent, id: string) {
    e.preventDefault()
    if (id === dragSrcId) return
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'))
    document.querySelector(`[data-id="${id}"]`)?.classList.add('drag-over')
  }
  function ddrop(e: DragEvent, tid: string) {
    e.preventDefault()
    if (!dragSrcId || dragSrcId === tid) return
    const si = blocks.findIndex(b => b.id === dragSrcId)
    const ti = blocks.findIndex(b => b.id === tid)
    const arr = [...blocks]; const [m] = arr.splice(si, 1); arr.splice(ti, 0, m)
    blocks = arr; dragSrcId = null
  }
  function dleave(e: DragEvent) { (e.currentTarget as Element).classList.remove('drag-over') }
  function dend() {
    dragSrcId = null
    document.querySelectorAll('.dragging,.drag-over').forEach(el => el.classList.remove('dragging','drag-over'))
  }

  // ── 圖片上傳 ──
  let uploading = $state(false)
  async function uploadImage(file: File, blockId: string, dataKey: string) {
    uploading = true
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) { toast('上傳失敗'); return }
      const { url } = await res.json() as { url: string }
      upd(blockId, dataKey, url)
      toast('✓ 圖片已上傳')
    } catch { toast('上傳失敗') }
    finally { uploading = false }
  }

  // ── Toast ──
  function toast(msg: string) {
    const id = toastN++
    toasts = [...toasts, { id, msg }]
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id) }, 2100)
  }

  // ── 背景圖片上傳 ──
  async function uploadBgImage(file: File) {
    bgUploading = true
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) { toast('上傳失敗'); return }
      const { url } = await res.json() as { url: string }
      globalDesign = { ...globalDesign, bgImage: url }
      toast('✓ 背景圖片已上傳')
    } catch { toast('上傳失敗') }
    finally { bgUploading = false }
  }

  // ── 儲存 ──
  function saveAll() {
    try {
      // 保存到 localStorage
      localStorage.setItem('card_blocks', JSON.stringify(blocks))
      localStorage.setItem('card_overrides', JSON.stringify(overrides))
      localStorage.setItem('card_global', JSON.stringify(globalDesign))

      // 準備配置對象
      const config = {
        blocks,
        overrides,
        globalDesign,
        timestamp: Date.now(),
      }
      
      // 保存到服務器
      const formData = new FormData()
      formData.append('config', JSON.stringify(config))
      
      fetch('?/saveCardConfig', {
        method: 'POST',
        body: formData,
      })
        .then(res => {
          if (!res.ok) throw new Error('Save failed')
          toast('✓ 已儲存到服務器')
          // 觸發頁面更新，使首頁可以讀取新的配置
          window.dispatchEvent(new CustomEvent('cardConfigUpdated', { detail: config }))
        })
        .catch(() => {
          toast('⚠ 本地已儲存，但服務器保存失敗')
        })
    } catch { toast('儲存失敗') }
  }

  // ── 全局設計面板 ──
  function openGlobal() { selectedId = null; globalOpen = true }
  function closeGlobal() { globalOpen = false }

  // ── 點空白取消選取 ──
  function clickOut(e: MouseEvent) {
    const t = e.target as Element
    if (!t.closest('.block-wrap') && !t.closest('.attr-panel') && !t.closest('.add-panel') && !t.closest('.gd-panel') && !t.closest('.fab-col')) {
      if (selectedId) selectedId = null
      if (globalOpen) globalOpen = false
    }
  }

  // ── 常數表 ──
  const LABELS: Record<string,string> = {
    avatar:'頭像', profile_name:'名稱', section:'區段', image:'圖片',
    gallery:'圖庫', tags:'標籤', button:'按鈕', countdown:'倒計時',
    anon_box:'匿名箱', visitor:'訪客計數', text:'文字', commission:'委託項目', queue:'排單狀態'
  }
  const ICONS: Record<string,string> = {
    avatar:'👤', profile_name:'名', section:'#', image:'🖼', gallery:'⊞',
    tags:'⊙', button:'→', countdown:'⏱', anon_box:'✉', visitor:'👁',
    text:'T', commission:'📄', queue:'≡'
  }
  const GENERAL_TYPES: [string, string, string][] = [
    ['profile_name','名','名稱'], ['text','T','文字'],
    ['image','🖼','圖片'],        ['gallery','⊞','圖庫'],
    ['section','#','區段'],       ['tags','⊙','標籤'],
    ['button','→','按鈕'],        ['countdown','⏱','倒計時'],
    ['anon_box','✉','匿名箱'],    ['visitor','👁','訪客計數'],
  ]
</script>

<svelte:window onclick={clickOut} ondragend={dend} />

<!-- ── Toast ── -->
<div class="toast-area" aria-live="polite" aria-atomic="false">
  {#each toasts as t (t.id)}
    <div class="toast toast-in">{t.msg}</div>
  {/each}
</div>

<!-- ── 主預覽區 ── -->
<div class="editor-root" style="font-family:{globalDesign.fontFamily};">
  <div class="editor-bg" aria-hidden="true" style="
    background-color:{globalDesign.bgColor};
    {globalDesign.bgImage ? `background-image:url('${globalDesign.bgImage}');` : ''}
    background-size:{globalDesign.bgSize};
    background-repeat:{globalDesign.bgRepeat};
    background-attachment:{globalDesign.bgAttachment};
    background-position:center;
    filter:brightness({globalDesign.bgBrightness}%) blur({globalDesign.bgBlur}px) saturate({globalDesign.bgSaturation}%);
  "></div>

  <div class="preview-wrap" class:mobile={device === 'mobile'} class:full-width={globalDesign.layoutWidth==='full'}>
    <ul class="blocks-list">
      {#each blocks as block (block.id)}
        {@const s  = S(block.id)}
        {@const bg = blockBg(block.id)}
        <li
          class="block-wrap"
          class:selected={block.id === selectedId}
          data-id={block.id}
          draggable={true}
          style="border-radius:{s.radius}"
          onclick={(e) => { e.stopPropagation(); sel(block.id) }}
          ondragstart={(e) => dstart(e, block.id)}
          ondragover={(e) => dover(e, block.id)}
          ondrop={(e) => ddrop(e, block.id)}
          ondragleave={dleave}
        >
          <!-- 拖拉把手 -->
          <button class="grip" title="拖曳排序" onclick={(e) => e.stopPropagation()} tabindex="-1" aria-label="拖曳排序">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/>
              <circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
            </svg>
          </button>

          {#if block.type === 'avatar'}
            <div class="w-full text-center">
              <div class="avatar-frame" style="background:{mix(s.bgColor,s.opacity)};border-radius:{s.radius};border:{s.borderWidth} {s.borderStyle} {s.borderColor};">
                <img src={block.data.src} alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:{avR(block.id,block.data.shape)};" />
              </div>
            </div>

          {:else if block.type === 'profile_name'}
            {@const nameSize = block.data.size === 'sm' ? '1.125rem' : block.data.size === 'base' ? '1.5rem' : block.data.size === 'xl' ? '2.5rem' : '1.875rem'}
            <div style="text-align:{block.data.align ?? 'center'};">
              <h1 class="profile-name" style="color:{s.textColor};font-size:{nameSize};">{block.data.name}</h1>
            </div>

          {:else if block.type === 'section'}
            <div class="section-wrap" style={bg}>
              <div class="section-inner">
                <div class="section-line" style="border-color:{s.borderColor};"></div>
                <span class="section-title">{block.data.title}</span>
                <div class="section-line" style="border-color:{s.borderColor};"></div>
              </div>
            </div>

          {:else if block.type === 'image'}
            {@const imgW = block.data.width === 'small' ? '40%' : block.data.width === 'medium' ? '70%' : '100%'}
            {@const imgJ = block.data.align === 'left' ? 'flex-start' : block.data.align === 'right' ? 'flex-end' : 'center'}
            <div style="display:flex;justify-content:{imgJ};overflow:hidden;border-radius:{s.radius};">
              <img src={block.data.src} alt={block.data.alt ?? ''} style="width:{imgW};height:auto;object-fit:cover;display:block;border-radius:{s.radius};" />
            </div>

          {:else if block.type === 'gallery'}
            <div class="gallery-grid" style="grid-template-columns:repeat({block.data.cols ?? 3},1fr);">
              {#each block.data.images as img}
                <div style="aspect-ratio:1;overflow:hidden;{bg}">
                  <img src={img} alt="" style="width:100%;height:100%;object-fit:cover;" />
                </div>
              {/each}
            </div>

          {:else if block.type === 'tags'}
            <div class="tags-wrap">
              {#each block.data.tags as tag}
                <div class="tag-pill" style={bg}>{tag}</div>
              {/each}
            </div>

          {:else if block.type === 'button'}
            <div class="btn-block" style={bg}>
              <div class="btn-icon">{block.data.icon ?? '→'}</div>
              <div class="btn-label">{block.data.label}</div>
            </div>

          {:else if block.type === 'countdown'}
            {@const cd = calcCD(block.data.targetDate)}
            <div class="cd-block" style={bg}>
              <div class="cd-label">{block.data.label}</div>
              {#if cd}
                <div class="cd-numbers">
                  <div><span class="cd-num">{cd.d}</span><span class="cd-unit">天</span></div>
                  <div><span class="cd-num">{cd.h}</span><span class="cd-unit">時</span></div>
                  <div><span class="cd-num">{cd.m}</span><span class="cd-unit">分</span></div>
                  <div><span class="cd-num">{cd.s}</span><span class="cd-unit">秒</span></div>
                </div>
              {:else}
                <div style="opacity:.5;">時間已到</div>
              {/if}
            </div>

          {:else if block.type === 'anon_box'}
            <div class="anon-block" style={bg}>
              <div class="anon-deco" aria-hidden="true">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div class="anon-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>
                {block.data.title}
              </div>
              <div class="anon-input-preview">{block.data.placeholder}</div>
              <button class="anon-submit">送出</button>
            </div>

          {:else if block.type === 'text'}
            <div class="text-block" style="{bg}text-align:{block.data.align ?? 'left'};">
              <p style="font-size:{block.data.size==='sm'?'.75rem':block.data.size==='lg'?'1.125rem':block.data.size==='xl'?'1.25rem':'.875rem'};">{block.data.content ?? '在此輸入文字...'}</p>
            </div>

          {:else if block.type === 'visitor'}
            <div class="visitor-block" style={bg}>
              <div class="visitor-label">{block.data.label ?? '歡迎光臨'}</div>
              <div class="visitor-count">{block.data.count ?? '1,234'}</div>
            </div>

          {:else if block.type === 'commission'}
            <div class="commission-block" style={bg}>
              <div class="commission-title">委託項目</div>
              <div class="commission-list">
                {#if types.length > 0}
                  {#each types as t, i}
                    <div class="commission-row" class:commission-last={i === types.length - 1}>
                      <span>{t.name}</span>
                      <span>NT$ {t.base_price.toLocaleString()} 起</span>
                    </div>
                  {/each}
                {:else}
                  <div class="commission-row commission-last commission-empty"><span>尚未設定委託項目</span></div>
                {/if}
              </div>
            </div>

          {:else if block.type === 'queue'}
            <div class="queue-block" style={bg}>
              <div class="queue-label">目前排單</div>
              <div class="queue-count">{block.data.current ?? 3} / {block.data.max ?? 10}</div>
              <div class="queue-bar-track">
                <div class="queue-bar-fill" style="width:{((block.data.current??3)/(block.data.max??10))*100}%;"></div>
              </div>
              <div class="queue-remain">剩餘 {(block.data.max??10)-(block.data.current??3)} 個名額</div>
            </div>

          {:else}
            <div class="generic-block" style={bg}>{block.type}</div>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</div>

<!-- ── 右側 FABs ── -->
<div class="fab-col" class:panel-open={!!selBlock || globalOpen}>
  <div class="device-toggle">
    <button class="dev-btn" class:dev-active={device==='desktop'} onclick={() => device='desktop'} title="桌機">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
    </button>
    <button class="dev-btn" class:dev-active={device==='mobile'} onclick={() => device='mobile'} title="手機">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
    </button>
  </div>
  <button class="fab fab-design" onclick={openGlobal} title="全局設計" class:fab-active={globalOpen}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
  </button>
  <button class="fab fab-save" onclick={saveAll} title="儲存">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
  </button>
  <button class="fab fab-add" onclick={() => addOpen = true} title="新增元件">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  </button>
</div>

<!-- ── 屬性面板 ── -->
{#if selBlock}
  {@const s      = S(selBlock.id)}
  {@const hasOvr = !!overrides[selBlock.id]}
  <div class="attr-panel panel-enter" role="complementary" aria-label="元件設定">
    <div class="attr-panel-inner">
      <div class="attr-hdr">
        <div class="attr-hdr-left">
          <div class="attr-icon">{ICONS[selBlock.type] ?? '?'}</div>
          <div>
            <div class="attr-name">{LABELS[selBlock.type] ?? selBlock.type}</div>
            <div class="attr-id">ID: {selBlock.id}</div>
          </div>
        </div>
        <button class="close-btn" onclick={closePanel} aria-label="關閉面板">✕</button>
      </div>

      <div class="attr-body">
        <!-- Per-type 設定 -->
        {#if selBlock.type === 'avatar'}
          <div class="field-group">
            <div class="p-label">頭像形狀</div>
            <div class="btn-row">
              <button class="size-btn" class:active={selBlock.data.shape==='square'} onclick={() => upd(selBlock.id,'shape','square')}>方圓角</button>
              <button class="size-btn" class:active={selBlock.data.shape==='circle'} onclick={() => upd(selBlock.id,'shape','circle')}>圓形</button>
            </div>
            <div class="p-label" style="margin-top:.4rem;">上傳頭像</div>
            <label class="upload-btn" class:uploading>
              {#if uploading}上傳中…{:else}選擇檔案{/if}
              <input type="file" accept="image/*" style="display:none;" disabled={uploading}
                onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadImage(f, selBlock.id, 'src') }} />
            </label>
            <div class="p-label" style="margin-top:.4rem;">或貼上 URL</div>
            <input class="p-input" value={selBlock.data.src} onchange={(e) => upd(selBlock.id,'src',(e.target as HTMLInputElement).value)} />
          </div>

        {:else if selBlock.type === 'profile_name'}
          <div class="field-group">
            <div class="p-label">顯示名稱</div>
            <input class="p-input" value={selBlock.data.name} oninput={(e) => upd(selBlock.id,'name',(e.target as HTMLInputElement).value)} />
            <div class="p-label" style="margin-top:.5rem;">字體大小</div>
            <div class="btn-row">
              <button class="size-btn" class:active={selBlock.data.size==='sm'}   onclick={() => upd(selBlock.id,'size','sm')}>小</button>
              <button class="size-btn" class:active={selBlock.data.size==='base'} onclick={() => upd(selBlock.id,'size','base')}>中</button>
              <button class="size-btn" class:active={!selBlock.data.size||selBlock.data.size==='lg'} onclick={() => upd(selBlock.id,'size','lg')}>大</button>
              <button class="size-btn" class:active={selBlock.data.size==='xl'}   onclick={() => upd(selBlock.id,'size','xl')}>特大</button>
            </div>
            <div class="p-label" style="margin-top:.5rem;">對齊</div>
            <div class="btn-row">
              <button class="size-btn align-btn" class:active={selBlock.data.align==='left'}   onclick={() => upd(selBlock.id,'align','left')}>左</button>
              <button class="size-btn align-btn" class:active={!selBlock.data.align||selBlock.data.align==='center'} onclick={() => upd(selBlock.id,'align','center')}>中</button>
              <button class="size-btn align-btn" class:active={selBlock.data.align==='right'}  onclick={() => upd(selBlock.id,'align','right')}>右</button>
            </div>
          </div>

        {:else if selBlock.type === 'section'}
          <div class="field-group">
            <div class="p-label">標題文字</div>
            <input class="p-input" value={selBlock.data.title} oninput={(e) => upd(selBlock.id,'title',(e.target as HTMLInputElement).value)} />
          </div>

        {:else if selBlock.type === 'image'}
          <div class="field-group">
            <div class="p-label">上傳圖片</div>
            <label class="upload-btn" class:uploading>
              {#if uploading}上傳中…{:else}選擇檔案{/if}
              <input type="file" accept="image/*" style="display:none;" disabled={uploading}
                onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadImage(f, selBlock.id, 'src') }} />
            </label>
            <div class="p-label" style="margin-top:.4rem;">或貼上 URL</div>
            <input class="p-input" value={selBlock.data.src} onchange={(e) => upd(selBlock.id,'src',(e.target as HTMLInputElement).value)} />
            <div class="p-label" style="margin-top:.5rem;">圖片寬度</div>
            <div class="btn-row">
              <button class="size-btn" class:active={selBlock.data.width==='small'}  onclick={() => upd(selBlock.id,'width','small')}>小</button>
              <button class="size-btn" class:active={selBlock.data.width==='medium'} onclick={() => upd(selBlock.id,'width','medium')}>中</button>
              <button class="size-btn" class:active={!selBlock.data.width||selBlock.data.width==='full'} onclick={() => upd(selBlock.id,'width','full')}>全寬</button>
            </div>
            <div class="p-label" style="margin-top:.5rem;">對齊</div>
            <div class="btn-row">
              <button class="size-btn align-btn" class:active={selBlock.data.align==='left'}   onclick={() => upd(selBlock.id,'align','left')}>左</button>
              <button class="size-btn align-btn" class:active={!selBlock.data.align||selBlock.data.align==='center'} onclick={() => upd(selBlock.id,'align','center')}>中</button>
              <button class="size-btn align-btn" class:active={selBlock.data.align==='right'}  onclick={() => upd(selBlock.id,'align','right')}>右</button>
            </div>
          </div>

        {:else if selBlock.type === 'text'}
          <div class="field-group">
            <div class="p-label">文字內容</div>
            <textarea class="p-textarea" oninput={(e) => upd(selBlock.id,'content',(e.target as HTMLTextAreaElement).value)}>{selBlock.data.content ?? ''}</textarea>
            <div class="p-label" style="margin-top:.5rem;">字體大小</div>
            <div class="btn-row">
              <button class="size-btn" class:active={selBlock.data.size==='sm'}   onclick={() => upd(selBlock.id,'size','sm')}>小</button>
              <button class="size-btn" class:active={selBlock.data.size==='base'} onclick={() => upd(selBlock.id,'size','base')}>中</button>
              <button class="size-btn" class:active={selBlock.data.size==='lg'}   onclick={() => upd(selBlock.id,'size','lg')}>大</button>
              <button class="size-btn" class:active={!selBlock.data.size||selBlock.data.size==='xl'} onclick={() => upd(selBlock.id,'size','xl')}>特大</button>
            </div>
            <div class="p-label" style="margin-top:.5rem;">對齊</div>
            <div class="btn-row">
              <button class="size-btn align-btn" class:active={!selBlock.data.align||selBlock.data.align==='left'}   onclick={() => upd(selBlock.id,'align','left')}>左</button>
              <button class="size-btn align-btn" class:active={selBlock.data.align==='center'} onclick={() => upd(selBlock.id,'align','center')}>中</button>
              <button class="size-btn align-btn" class:active={selBlock.data.align==='right'}  onclick={() => upd(selBlock.id,'align','right')}>右</button>
            </div>
          </div>

        {:else if selBlock.type === 'tags'}
          <div class="field-group">
            <div class="p-label">標籤（逗號分隔）</div>
            <input class="p-input"
              value={selBlock.data.tags.join(', ')}
              oninput={(e) => upd(selBlock.id,'tags',(e.target as HTMLInputElement).value.split(',').map((t:string)=>t.trim()).filter(Boolean))} />
          </div>

        {:else if selBlock.type === 'button'}
          <div class="field-group">
            <div class="p-label">按鈕文字</div>
            <input class="p-input" value={selBlock.data.label} oninput={(e) => upd(selBlock.id,'label',(e.target as HTMLInputElement).value)} />
            <div class="p-label" style="margin-top:.4rem;">連結 URL</div>
            <input class="p-input" value={selBlock.data.url ?? '#'} oninput={(e) => upd(selBlock.id,'url',(e.target as HTMLInputElement).value)} />
          </div>

        {:else if selBlock.type === 'countdown'}
          <div class="field-group">
            <div class="p-label">標籤文字</div>
            <input class="p-input" value={selBlock.data.label} oninput={(e) => upd(selBlock.id,'label',(e.target as HTMLInputElement).value)} />
            <div class="p-label" style="margin-top:.4rem;">目標日期</div>
            <input type="date" class="p-input" value={selBlock.data.targetDate} onchange={(e) => upd(selBlock.id,'targetDate',(e.target as HTMLInputElement).value)} />
          </div>

        {:else if selBlock.type === 'anon_box'}
          <div class="field-group">
            <div class="anon-status-row">
              <div class="p-label" style="margin:0;">留言板狀態</div>
              <span class="status-badge">收件中</span>
            </div>
            <div class="hint-text">如需更改狀態，請前往「回應管理」</div>
            <div class="p-label" style="margin-top:.5rem;">標題</div>
            <input class="p-input" value={selBlock.data.title} oninput={(e) => upd(selBlock.id,'title',(e.target as HTMLInputElement).value)} />
            <div class="p-label" style="margin-top:.4rem;">提示文字</div>
            <input class="p-input" value={selBlock.data.placeholder} oninput={(e) => upd(selBlock.id,'placeholder',(e.target as HTMLInputElement).value)} />
            <div class="anon-note">
              <div class="p-label" style="margin:0 0 .25rem;">說明</div>
              <ul class="anon-note-list">
                <li>收到的投稿將儲存於「回應管理」面板。</li>
                <li>發送回應後會即時顯示於元件的公開回覆。</li>
                <li>可在「回應管理」面板更改狀態關閉投稿。</li>
              </ul>
            </div>
          </div>

        {:else if selBlock.type === 'gallery'}
          <div class="field-group">
            <div class="p-label">欄數</div>
            <div class="btn-row">
              {#each [2, 3, 4] as c}
                <button class="size-btn" class:active={selBlock.data.cols===c} onclick={() => upd(selBlock.id,'cols',c)}>{c}</button>
              {/each}
            </div>
          </div>

        {:else if selBlock.type === 'visitor'}
          <div class="field-group">
            <div class="p-label">標籤文字</div>
            <input class="p-input" value={selBlock.data.label ?? '歡迎光臨'} oninput={(e) => upd(selBlock.id,'label',(e.target as HTMLInputElement).value)} />
          </div>
        {/if}

        <!-- 樣式 toggle -->
        <div class="style-toggle-row">
          <span class="style-toggle-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
            元件樣式
          </span>
          <button class="toggle-track" class:on={hasOvr} onclick={() => toggleOverride(selBlock.id)} role="switch" aria-checked={hasOvr} aria-label="自訂此元件樣式">
            <div class="toggle-thumb"></div>
          </button>
        </div>

        {#if hasOvr}
          <div class="style-section">
            <div class="style-section-note">✦ 自訂樣式（以下設定僅套用於此元件）</div>

            <div class="swatch-row">
              <div class="p-label">文字顏色</div>
              <div class="swatches">
                {#each PALETTE as p}
                  <button class="swatch" class:swatch-active={s.textColor===p.bg}
                    style="background:{p.bg};{p.bg==='#ffffff'?'border:1.5px solid rgba(0,0,0,.12);':''}"
                    onclick={() => setStyle(selBlock.id,'textColor',p.bg)} aria-label={p.label}></button>
                {/each}
              </div>
            </div>

            <div class="swatch-row">
              <div class="p-label">元件底色</div>
              <div class="swatches">
                {#each PALETTE as p}
                  <button class="swatch" class:swatch-active={s.bgColor===p.bg}
                    style="background:{p.bg};{p.bg==='#ffffff'?'border:1.5px solid rgba(0,0,0,.12);':''}"
                    onclick={() => setStyle(selBlock.id,'bgColor',p.bg)} aria-label={p.label}></button>
                {/each}
              </div>
            </div>

            <div>
              <div class="p-label">透明度</div>
              <div class="slider-row">
                <input type="range" class="p-slider" min="0" max="100" value={s.opacity}
                  style="--v:{s.opacity}%"
                  oninput={(e) => setStyle(selBlock.id,'opacity',+(e.target as HTMLInputElement).value)} />
                <span class="slider-val">{s.opacity}%</span>
              </div>
            </div>

            <div class="swatch-row">
              <div class="p-label">邊框顏色</div>
              <div class="swatches">
                {#each PALETTE as p}
                  <button class="swatch" class:swatch-active={s.borderColor===p.bg}
                    style="background:{p.bg};{p.bg==='#ffffff'?'border:1.5px solid rgba(0,0,0,.12);':''}"
                    onclick={() => setStyle(selBlock.id,'borderColor',p.bg)} aria-label={p.label}></button>
                {/each}
              </div>
            </div>

            <div class="two-col">
              <div>
                <div class="p-label">邊框粗細</div>
                <select class="p-select" value={['0px','1px','2px','3px'].includes(s.borderWidth) ? s.borderWidth : 'custom'}
                  onchange={(e) => { const v = (e.target as HTMLSelectElement).value; if (v !== 'custom') setStyle(selBlock.id,'borderWidth',v) }}>
                  <option value="0px">0px</option>
                  <option value="1px">1px</option>
                  <option value="2px">2px</option>
                  <option value="3px">3px</option>
                  <option value="custom">自訂</option>
                </select>
                {#if !['0px','1px','2px','3px'].includes(s.borderWidth)}
                  <input class="p-input-sm" type="text" value={s.borderWidth} placeholder="4px"
                    oninput={(e) => setStyle(selBlock.id,'borderWidth',(e.target as HTMLInputElement).value)} />
                {/if}
              </div>
              <div>
                <div class="p-label">邊框樣式</div>
                <select class="p-select" value={s.borderStyle} onchange={(e) => setStyle(selBlock.id,'borderStyle',(e.target as HTMLSelectElement).value)}>
                  <option value="double">雙線</option>
                  <option value="solid">實線</option>
                  <option value="dashed">虛線</option>
                </select>
              </div>
            </div>

            <div>
              <div class="p-label">圓角</div>
              <div class="slider-row">
                <input type="range" class="p-slider" min="0" max="48" value={parseInt(s.radius)||32}
                  style="--v:{(parseInt(s.radius)||32)/48*100}%"
                  oninput={(e) => setStyle(selBlock.id,'radius',(e.target as HTMLInputElement).value+'px')} />
                <span class="slider-val">{s.radius}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="attr-footer">
        <button class="delete-btn" onclick={delBlock}>刪除此元件</button>
      </div>
    </div>
  </div>
{/if}

<!-- ── 全局設計面板 ── -->
{#if globalOpen}
  <GlobalDesignPanel
    design={globalDesign}
    onpatch={(patch: Partial<GlobalDesign>) => globalDesign = { ...globalDesign, ...patch }}
    onclose={closeGlobal}
    uploading={bgUploading}
    onupload={uploadBgImage}
  />
{/if}

<!-- ── 新增元件 Panel ── -->
{#if addOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="add-overlay" onclick={() => addOpen = false} aria-hidden="true"></div>
{/if}
<div class="add-panel" class:add-open={addOpen} aria-hidden={!addOpen}>
  <div class="add-panel-hdr">
    <span>新增元件</span>
    <button class="close-btn" onclick={() => addOpen = false} aria-label="關閉">✕</button>
  </div>
  <div class="add-panel-body">
    <div class="add-section-label">一般</div>
    <div class="add-grid">
      {#each GENERAL_TYPES as [type, icon, label]}
        <button class="add-block-btn" onclick={() => addBlock(type)}>
          <div class="add-icon">{icon}</div>
          <span>{label}</span>
        </button>
      {/each}
    </div>
    <div class="add-section-label" style="margin-top:1rem;">委託專用</div>
    <div class="add-wide-col">
      <button class="add-block-btn-wide" onclick={() => addBlock('commission')}>
        <div class="add-icon-wide" style="background:color-mix(in srgb,var(--blue) 15%,transparent);color:var(--blue);">📄</div>
        <div><div class="add-wide-title">委託項目</div><div class="add-wide-sub">顯示開放中的委託</div></div>
      </button>
      <button class="add-block-btn-wide" onclick={() => addBlock('queue')}>
        <div class="add-icon-wide" style="background:color-mix(in srgb,var(--blue) 15%,transparent);color:var(--blue);">≡</div>
        <div><div class="add-wide-title">排單狀態</div><div class="add-wide-sub">顯示排單進度條</div></div>
      </button>
    </div>
  </div>
</div>

<style>
  *, *::before, *::after { box-sizing: border-box; }

  /* Toast */
  .toast-area {
    position: fixed; top: 4.5rem; left: 50%; transform: translateX(-50%);
    z-index: 99999; display: flex; flex-direction: column; align-items: center;
    gap: .5rem; pointer-events: none;
  }
  .toast {
    padding: .5rem 1.125rem; border-radius: 999px; font-size: .75rem; font-weight: 700;
    background: var(--ink); color: white;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--ink) 30%, transparent);
  }
  @keyframes toastIn  { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes toastOut { to { opacity: 0; } }
  .toast-in { animation: toastIn .2s ease, toastOut .25s ease 1.7s forwards; }

  /* Editor root */
  .editor-root {
    position: relative; min-height: calc(100vh - 60px);
    display: flex; justify-content: center; background: var(--cream);
  }
  .editor-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-size: cover; background-position: center;
    transition: filter .4s, background-color .4s;
  }

  /* Preview */
  .preview-wrap {
    position: relative; z-index: 10; width: 100%; max-width: 100%;
    padding: 5rem 1.25rem; transition: max-width .5s;
  }
  .preview-wrap.mobile { max-width: 480px; }
  .preview-wrap.full-width { max-width: 1200px; padding-left: 2rem; padding-right: 2rem; }
  .blocks-list { display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 8rem; list-style: none; margin: 0; padding-left: 0; }

  /* Block wrap */
  .block-wrap {
    position: relative; border-radius: 2.25rem; width: 100%;
    cursor: pointer; user-select: none; touch-action: pan-y; will-change: transform;
  }
  .block-wrap:global(.dragging)  { opacity: .4; }
  .block-wrap:global(.drag-over) { border-top: 2px solid var(--blue); }
  .block-wrap.selected { box-shadow: 0 0 0 2px var(--blue), 0 0 0 4px color-mix(in srgb,var(--blue) 15%,transparent); }

  /* Grip */
  .grip {
    position: absolute; left: -3rem; top: 50%; transform: translateY(-50%);
    padding: .25rem; background: white; border-radius: .75rem;
    border: 1px solid color-mix(in srgb, var(--ink) 10%, transparent);
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    display: none; flex-direction: column; align-items: center;
    z-index: 30; color: color-mix(in srgb, var(--ink) 20%, transparent);
    cursor: move; opacity: 0; transition: opacity .15s;
  }
  .block-wrap:hover .grip,
  .block-wrap.selected .grip { opacity: 1; }
  @media (min-width: 1280px) { .grip { display: flex; } }

  /* Blocks */
  .avatar-frame { width: 8rem; height: 8rem; margin: 0 auto; overflow: hidden; padding: 6px; display: block; }
  .profile-name { font-size: 1.875rem; font-weight: 900; letter-spacing: -.025em; line-height: 1.2; word-break: break-all; margin: 0; }
  .section-wrap { padding: .25rem 0; }
  .section-inner { display: flex; align-items: center; gap: .75rem; padding: 0 .75rem; }
  .section-line { flex: 1; border-top: 1px solid; opacity: .5; }
  .section-title { padding: 0 .5rem; font-size: .6875rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .gallery-grid { display: grid; gap: .5rem; width: 100%; }
  .tags-wrap { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }
  .tag-pill { display: inline-flex; align-items: center; font-weight: 500; font-size: .875rem; padding: .5rem 1rem; }
  .btn-block { width: 100%; padding: 1.25rem; display: flex; align-items: center; justify-content: center; gap: 1rem; }
  .btn-icon { width: 2.5rem; height: 2.5rem; border-radius: .875rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
  .btn-label { font-size: 1rem; font-weight: 900; }
  .cd-block { width: 100%; padding: 1.25rem; font-weight: 700; text-align: center; }
  .cd-label { font-size: .875rem; opacity: .7; margin-bottom: .75rem; }
  .cd-numbers { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem; justify-content: center; }
  .cd-num { font-size: 1.25rem; font-variant-numeric: tabular-nums; }
  .cd-unit { font-size: .875rem; opacity: .7; margin-left: .25rem; margin-right: .75rem; }
  .anon-block { width: 100%; padding: 2rem; text-align: center; position: relative; overflow: hidden; }
  .anon-deco { position: absolute; top: -2.5rem; right: -2.5rem; opacity: .1; transform: rotate(12deg); pointer-events: none; }
  .anon-title { display: flex; align-items: center; gap: .5rem; justify-content: center; font-weight: 900; font-size: 1rem; position: relative; z-index: 1; }
  .anon-input-preview { margin-top: 1rem; border-radius: .875rem; padding: .75rem 1rem; font-size: .875rem; opacity: .5; text-align: left; position: relative; z-index: 1; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.08); }
  .anon-submit { margin-top: .875rem; width: 100%; border-radius: .875rem; padding: .75rem; font-size: .875rem; font-weight: 700; position: relative; z-index: 1; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.12); color: inherit; cursor: pointer; font-family: inherit; }
  .text-block { padding: 1.25rem; }
  .text-block p { margin: 0; line-height: 1.625; }
  .visitor-block { width: 100%; padding: 1.25rem; text-align: center; font-weight: 700; }
  .visitor-label { font-size: .875rem; opacity: .7; margin-bottom: .25rem; }
  .visitor-count { font-size: 1.5rem; font-weight: 900; }
  .commission-block { width: 100%; padding: 1.25rem; }
  .commission-title { font-size: .875rem; font-weight: 900; margin-bottom: .75rem; }
  .commission-list { display: flex; flex-direction: column; gap: .25rem; }
  .commission-row { display: flex; justify-content: space-between; align-items: center; padding: .5rem 0; border-bottom: 1px solid rgba(255,255,255,.2); font-size: .875rem; }
  .commission-row span:last-child { font-weight: 900; }
  .commission-last { border-bottom: none; }
  .commission-empty { opacity: .5; justify-content: center; }
  .queue-block { width: 100%; padding: 1.25rem; text-align: center; }
  .queue-label { font-size: .75rem; font-weight: 700; opacity: .7; margin-bottom: .5rem; }
  .queue-count { font-size: 1.5rem; font-weight: 900; margin-bottom: .75rem; }
  .queue-bar-track { height: .5rem; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,.2); }
  .queue-bar-fill { height: 100%; border-radius: 999px; background: rgba(255,255,255,.8); }
  .queue-remain { font-size: .75rem; opacity: .6; margin-top: .5rem; }
  .generic-block { padding: 1.25rem; text-align: center; font-size: .875rem; opacity: .6; }

  /* FABs */
  .fab-col { position: fixed; top: 6rem; right: 1.5rem; z-index: 60; display: flex; flex-direction: column; align-items: center; gap: 1rem; transition: right .22s cubic-bezier(.25,.46,.45,.94); }
  .fab-col.panel-open { right: calc(18rem + 2rem); }
  .device-toggle { display: flex; padding: .375rem; border-radius: 999px; gap: .25rem; background: rgba(255,255,255,.75); backdrop-filter: blur(12px); border: 1px solid color-mix(in srgb,var(--ink) 10%,transparent); box-shadow: 0 2px 8px rgba(0,0,0,.08); }
  .dev-btn { padding: .625rem; border-radius: 999px; border: none; cursor: pointer; background: transparent; color: color-mix(in srgb,var(--ink) 40%,transparent); transition: all .15s; display: flex; align-items: center; justify-content: center; }
  .dev-btn.dev-active { background: var(--ink); color: white; box-shadow: 0 2px 8px color-mix(in srgb,var(--ink) 35%,transparent); }
  .fab { width: 3.5rem; height: 3.5rem; border-radius: 999px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; transition: all .15s; box-shadow: 0 8px 24px rgba(0,0,0,.15); }
  .fab:hover { transform: scale(1.05); }
  .fab:active { transform: scale(.95); }
  .fab-save   { background: var(--ink); }
  .fab-add    { background: var(--blue); }
  .fab-design { background: color-mix(in srgb,var(--ink) 75%,var(--blue)); }
  .fab-design.fab-active { background: var(--blue); box-shadow: 0 0 0 3px color-mix(in srgb,var(--blue) 30%,transparent), 0 8px 24px rgba(0,0,0,.15); }

  /* Attr panel */
  @keyframes slideLeft { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  .panel-enter { animation: slideLeft .22s cubic-bezier(.25,.46,.45,.94) both; }
  .attr-panel { position: fixed; right: 1.5rem; top: 5rem; z-index: 50; width: 18rem; max-height: calc(100vh - 6.25rem); }
  .attr-panel-inner { background: white; border-radius: 1.875rem; overflow: hidden; display: flex; flex-direction: column; max-height: calc(100vh - 6.25rem); box-shadow: 0 20px 60px color-mix(in srgb,var(--ink) 15%,transparent); }
  .attr-hdr { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.25rem 1rem; border-bottom: 1px solid color-mix(in srgb,var(--ink) 6%,transparent); flex-shrink: 0; }
  .attr-hdr-left { display: flex; align-items: center; gap: .5rem; }
  .attr-icon { width: 2rem; height: 2rem; border-radius: .75rem; display: flex; align-items: center; justify-content: center; font-size: .875rem; background: color-mix(in srgb,var(--ink) 7%,transparent); flex-shrink: 0; }
  .attr-name { font-weight: 700; font-size: .875rem; color: var(--ink); }
  .attr-id { font-size: .625rem; font-family: var(--font-mono, monospace); color: color-mix(in srgb,var(--ink) 30%,transparent); }
  .close-btn { width: 1.75rem; height: 1.75rem; border-radius: 999px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: .875rem; background: color-mix(in srgb,var(--ink) 5%,transparent); color: color-mix(in srgb,var(--ink) 30%,transparent); transition: background .15s; flex-shrink: 0; }
  .close-btn:hover { background: color-mix(in srgb,var(--ink) 10%,transparent); }
  .attr-body { overflow-y: auto; display: flex; flex-direction: column; gap: .75rem; padding: 1rem; flex: 1; }
  .attr-footer { padding: 0 1rem 1rem; flex-shrink: 0; }

  /* Panel controls */
  .field-group { display: flex; flex-direction: column; gap: .5rem; }
  .p-label { font-size: .6875rem; font-weight: 700; color: color-mix(in srgb,var(--ink) 35%,transparent); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .2rem; }
  .p-input { width: 100%; padding: .45rem .7rem; border: 1px solid color-mix(in srgb,var(--ink) 12%,transparent); border-radius: .75rem; background: color-mix(in srgb,var(--cream) 50%,transparent); font-size: .8125rem; color: var(--ink); outline: none; font-family: inherit; transition: border-color .15s, background .15s; }
  .p-input:focus { border-color: var(--blue); background: white; }
  .p-textarea { width: 100%; padding: .55rem .7rem; border: 1px solid color-mix(in srgb,var(--ink) 12%,transparent); border-radius: .875rem; background: color-mix(in srgb,var(--cream) 50%,transparent); font-size: .8125rem; color: var(--ink); outline: none; resize: none; font-family: inherit; min-height: 80px; transition: border-color .15s, background .15s; }
  .p-textarea:focus { border-color: var(--blue); background: white; }
  .p-select { width: 100%; padding: .4rem .7rem; border: 1px solid color-mix(in srgb,var(--ink) 12%,transparent); border-radius: .75rem; background: white; font-size: .78rem; color: var(--ink); outline: none; font-family: inherit; cursor: pointer; }
  .p-input-sm { margin-top: .35rem; width: 100%; padding: .35rem .7rem; border: 1px solid color-mix(in srgb,var(--ink) 12%,transparent); border-radius: .75rem; background: white; font-size: .78rem; color: var(--ink); outline: none; font-family: inherit; }
  .btn-row { display: flex; gap: .5rem; }
  .size-btn { flex: 1; padding: .4rem; border-radius: .75rem; border: 1px solid color-mix(in srgb,var(--ink) 10%,transparent); background: color-mix(in srgb,var(--cream) 60%,transparent); font-size: .75rem; font-weight: 700; color: color-mix(in srgb,var(--ink) 40%,transparent); cursor: pointer; font-family: inherit; transition: all .15s; }
  .size-btn.active { background: var(--ink); color: white; border-color: var(--ink); }

  /* Style toggle */
  .style-toggle-row { display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid color-mix(in srgb,var(--ink) 8%,transparent); border-radius: .875rem; padding: .65rem .875rem; }
  .style-toggle-label { display: flex; align-items: center; gap: .45rem; font-size: .8125rem; font-weight: 700; color: color-mix(in srgb,var(--ink) 60%,transparent); }
  .toggle-track { width: 2.25rem; height: 1.25rem; background: color-mix(in srgb,var(--ink) 15%,transparent); border-radius: 999px; position: relative; cursor: pointer; border: none; transition: background .2s; flex-shrink: 0; }
  .toggle-track.on { background: var(--ink); }
  .toggle-thumb { width: 1rem; height: 1rem; background: white; border-radius: 50%; position: absolute; top: .125rem; left: .125rem; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
  .toggle-track.on .toggle-thumb { transform: translateX(1rem); }

  /* Style section */
  .style-section { background: color-mix(in srgb,var(--cream) 40%,transparent); border-radius: 1rem; padding: .875rem; display: flex; flex-direction: column; gap: .6rem; }
  .style-section-note { font-size: .625rem; font-weight: 700; color: color-mix(in srgb,var(--ink) 30%,transparent); }
  .swatch-row { display: flex; flex-direction: column; gap: .3rem; }
  .swatches { display: flex; gap: .5rem; flex-wrap: wrap; }
  .swatch { width: 2rem; height: 2rem; border-radius: .625rem; cursor: pointer; border: 2px solid transparent; transition: all .15s; flex-shrink: 0; }
  .swatch:hover { transform: scale(1.08); }
  .swatch.swatch-active { border-color: var(--ink); transform: scale(1.1); }
  .slider-row { display: flex; align-items: center; gap: .75rem; }
  .p-slider { flex: 1; height: 4px; appearance: none; border-radius: 999px; cursor: pointer; outline: none; background: linear-gradient(to right, var(--ink) var(--v, 55%), color-mix(in srgb,var(--ink) 10%,transparent) var(--v, 55%)); }
  .p-slider::-webkit-slider-thumb { appearance: none; width: 1rem; height: 1rem; border-radius: 50%; background: white; border: 2px solid var(--ink); box-shadow: 0 1px 4px color-mix(in srgb,var(--ink) 20%,transparent); cursor: pointer; }
  .slider-val { font-size: .75rem; font-weight: 700; color: color-mix(in srgb,var(--ink) 40%,transparent); min-width: 2.5rem; text-align: right; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
  .delete-btn { width: 100%; padding: .5rem; border-radius: .75rem; border: 1px solid rgba(200,50,50,.15); background: transparent; color: rgba(200,50,50,.6); font-size: .75rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: background .15s; }
  .delete-btn:hover { background: rgba(200,50,50,.06); }

  /* Status */
  .anon-status-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: .25rem; }
  .status-badge { font-size: .625rem; font-weight: 700; padding: .25rem .5rem; border-radius: 999px; background: color-mix(in srgb,var(--blue) 15%,transparent); color: var(--blue); }
  .hint-text { font-size: .625rem; color: color-mix(in srgb,var(--ink) 40%,transparent); }
  .anon-note { background: color-mix(in srgb,var(--ink) 4%,transparent); border-radius: .75rem; padding: .6rem .75rem; margin-top: .25rem; }
  .anon-note-list { font-size: .6875rem; line-height: 1.6; list-style: disc; list-style-position: inside; color: color-mix(in srgb,var(--ink) 45%,transparent); margin: 0; padding: 0; }

  /* Add panel */
  .add-overlay { position: fixed; inset: 0; z-index: 55; background: color-mix(in srgb,var(--ink) 20%,transparent); backdrop-filter: blur(4px); pointer-events: auto; }
  .add-panel { position: fixed; top: 0; bottom: 0; left: 224px; z-index: 65; width: 16rem; display: flex; flex-direction: column; background: white; border-right: 2px solid color-mix(in srgb,var(--ink) 8%,transparent); box-shadow: 8px 0 32px rgba(0,0,0,.15); transform: translateX(-200%); transition: transform .3s cubic-bezier(.25,.46,.45,.94); pointer-events: auto; }
  .add-panel.add-open { transform: translateX(0); }

  @media (max-width: 900px) {
    .add-panel { left: 56px; }
  }

  @media (max-width: 680px) {
    .add-panel {
      left: 0; right: 0; top: auto; bottom: 0;
      width: 100%;
      height: 65vh; max-height: 85vh;
      border-right: none;
      border-top: 2px solid color-mix(in srgb,var(--ink) 8%,transparent);
      border-radius: 1.25rem 1.25rem 0 0;
      box-shadow: 0 -8px 32px rgba(0,0,0,.15);
      transform: translateY(100%);
    }
    .add-panel.add-open { transform: translateY(0); }
    .add-panel-body { overflow-y: auto; }
  }
  .add-panel-hdr { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid color-mix(in srgb,var(--ink) 6%,transparent); font-weight: 700; font-size: .875rem; color: color-mix(in srgb,var(--ink) 60%,transparent); flex-shrink: 0; }
  .add-panel-body { flex: 1; overflow-y: auto; padding: 1rem; }
  .add-section-label { font-size: .625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: color-mix(in srgb,var(--ink) 30%,transparent); margin-bottom: .75rem; }
  .add-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-bottom: 1rem; }
  .add-block-btn { display: flex; flex-direction: column; align-items: center; gap: .4rem; padding: .75rem .5rem; border-radius: 1rem; border: 1px solid color-mix(in srgb,var(--ink) 10%,transparent); background: white; cursor: pointer; font-family: inherit; transition: all .15s; }
  .add-block-btn:hover { border-color: var(--blue); background: color-mix(in srgb,var(--blue) 8%,transparent); transform: translateY(-1px); box-shadow: 0 4px 12px color-mix(in srgb,var(--ink) 8%,transparent); }
  .add-icon { width: 2.125rem; height: 2.125rem; border-radius: .75rem; background: color-mix(in srgb,var(--ink) 6%,transparent); display: flex; align-items: center; justify-content: center; font-size: .9rem; color: color-mix(in srgb,var(--ink) 40%,transparent); transition: all .15s; }
  .add-block-btn:hover .add-icon { background: color-mix(in srgb,var(--blue) 20%,transparent); color: var(--blue); }
  .add-block-btn span { font-size: .6875rem; font-weight: 700; color: color-mix(in srgb,var(--ink) 50%,transparent); }
  .add-wide-col { display: flex; flex-direction: column; gap: .5rem; }
  .add-block-btn-wide { display: flex; align-items: center; gap: .75rem; padding: .75rem 1rem; border-radius: 1rem; border: 1px solid color-mix(in srgb,var(--blue) 25%,transparent); background: color-mix(in srgb,var(--blue) 6%,transparent); cursor: pointer; font-family: inherit; transition: all .15s; width: 100%; }
  .add-block-btn-wide:hover { border-color: color-mix(in srgb,var(--blue) 50%,transparent); background: color-mix(in srgb,var(--blue) 12%,transparent); }
  .add-icon-wide { width: 2.25rem; height: 2.25rem; border-radius: .75rem; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
  .add-wide-title { font-weight: 700; font-size: .75rem; color: var(--blue); }
  .add-wide-sub { font-size: .625rem; color: color-mix(in srgb,var(--blue) 70%,transparent); }

  /* Upload button */
  .upload-btn { display: flex; align-items: center; justify-content: center; width: 100%; padding: .45rem .7rem; border: 1.5px dashed color-mix(in srgb,var(--ink) 18%,transparent); border-radius: .75rem; background: color-mix(in srgb,var(--cream) 60%,transparent); font-size: .8125rem; font-weight: 600; color: color-mix(in srgb,var(--ink) 50%,transparent); cursor: pointer; transition: border-color .15s, background .15s; }
  .upload-btn:hover { border-color: var(--blue); background: color-mix(in srgb,var(--blue) 6%,transparent); color: var(--blue); }
  .upload-btn.uploading { opacity: .6; cursor: not-allowed; }

  /* Scrollbar */
  .attr-body::-webkit-scrollbar,
  .add-panel-body::-webkit-scrollbar { width: 4px; }
  .attr-body::-webkit-scrollbar-thumb,
  .add-panel-body::-webkit-scrollbar-thumb { background: var(--blue); border-radius: 99px; }
</style>
