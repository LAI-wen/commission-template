<script lang="ts">
  import { untrack } from "svelte"
  import type { PageData } from "./$types"
  import type { Block, BlockType, GlobalTheme } from "$lib/types/editor"
  import BlockRenderer from "$lib/components/blocks/BlockRenderer.svelte"
  import BlockWrapper from "$lib/components/editor/BlockWrapper.svelte"
  import BottomSheet from "$lib/components/editor/BottomSheet.svelte"
  import InsertionPoint from "$lib/components/editor/InsertionPoint.svelte"
  import { t } from "$lib/editor-utils"

  let { data }: { data: PageData } = $props()

  const BLOCK_DEFAULTS: Record<string, any> = {
    BIO:        { title: { zh: "個人簡介", en: "Biography" }, width: 2 },
    STATUS:     { title: { zh: "接案狀態", en: "Availability" }, width: 1, queueCount: 3 },
    TOOLS:      { title: { zh: "創作工具", en: "Creative Tools" }, width: 3, tools: [{ name: "Procreate", category: "硬體", description: "主要繪圖工具", icon: "Tablet" }] },
    LINKS:      { title: { zh: "聯繫我", en: "Connect" }, width: 1, links: [{ label: "Email", url: "mailto:", icon: "Mail" }] },
    RESOURCES:  { title: { zh: "相關資源", en: "Resources" }, width: 1, resources: [{ name: "筆刷包", type: "Brushes", url: "#", isPro: true }] },
    gallery:    { title: { zh: "精選作品", en: "Featured Works" }, width: 1, limit: 6, columns: 3 },
    commission: { title: { zh: "委託項目", en: "Commissions" }, width: 3, limit: 6 },
    pricing:    { title: { zh: "價格方案", en: "Pricing" }, width: 3, plans: [{ name: { zh: "標準方案", en: "Standard Plan" }, price: "NT$ 1,000", features: [{ zh: "項目一", en: "Item 1" }], recommended: false }] },
    notice:     { text: { zh: "這是一則重要公告", en: "This is an important notice" }, icon: "📢", bgColor: "rgba(255,243,205,1)", closable: true, width: 3 },
    reactions:  { emojis: ["❤️", "🌟", "🎨", "🍵"], width: 3 },
    faq:        { items: [{ question: { zh: "問題一", en: "Question 1" }, answer: { zh: "回答一", en: "Answer 1" } }], width: 3 },
    countdown:  { targetDate: new Date(Date.now() + 86400000 * 7).toISOString(), finishText: { zh: "時間已到！", en: "Time's up!" }, style: "minimal", width: 3 },
    terms:      { content: { zh: "請輸入條款...", en: "Please enter terms..." }, collapsed: true, width: 3 },
    text:       { content: { zh: "在這裡輸入文字...", en: "Enter text here..." }, align: "left", width: 3 },
    image:      { urls: [], mode: "single", radius: 12, width: 3 },
    button:     { label: { zh: "按鈕文字", en: "Button Text" }, url: "#", style: "solid", align: "center", fullWidth: false, width: 1 },
    divider:    { style: "solid", thickness: 1, spacing: 16, width: 3 },
    spacer:     { height: 24, width: 3 }
  }

  const DEFAULT_BLOCKS: Block[] = [
    { id: "b1", type: "BIO",       visible: true, width: 2, data: { ...BLOCK_DEFAULTS.BIO } },
    { id: "b2", type: "STATUS",    visible: true, width: 1, data: { ...BLOCK_DEFAULTS.STATUS } },
    { id: "b3", type: "TOOLS",     visible: true, width: 3, data: { ...BLOCK_DEFAULTS.TOOLS } },
    { id: "b4", type: "LINKS",     visible: true, width: 1, data: { ...BLOCK_DEFAULTS.LINKS } },
    { id: "b5", type: "RESOURCES", visible: true, width: 1, data: { ...BLOCK_DEFAULTS.RESOURCES } },
    { id: "b6", type: "gallery",   visible: true, width: 1, data: { ...BLOCK_DEFAULTS.gallery } },
    { id: "b7", type: "commission",visible: true, width: 3, data: { ...BLOCK_DEFAULTS.commission } },
  ]

  const DEFAULT_THEME: GlobalTheme = {
    accentColor: "#C89B7B", bgColor: "#FBFBFA", textColor: "#37352F",
    maxWidth: 1024, fontFamily: "system", bgBlur: 0, bgFixed: false,
    supportBilingual: true, defaultLang: "zh"
  }

  const PALETTES = [
    { id: "classic", label: "經典雅緻", bg: "#FBFBFA", text: "#37352F", accent: "#C89B7B" },
    { id: "dark", label: "深夜靈感", bg: "#111111", text: "#ffffff", accent: "#ffffff" },
    { id: "sakura", label: "春日櫻花", bg: "#fff5f7", text: "#5c3d42", accent: "#ff8da1" },
    { id: "ocean", label: "靜謐海洋", bg: "#f0f9ff", text: "#1e3a8a", accent: "#3b82f6" },
  ]

  function applyPalette(p: typeof PALETTES[0]) {
    theme.bgColor = p.bg; theme.textColor = p.text; theme.accentColor = p.accent; debouncedSave()
  }

  function parseConfig(): { blocks: Block[]; theme: GlobalTheme } {
    try {
      const raw = data.creator?.page_config
      if (!raw) return { blocks: DEFAULT_BLOCKS, theme: DEFAULT_THEME }
      const p = JSON.parse(raw as string)
      return { 
        blocks: p.blocks ?? DEFAULT_BLOCKS, 
        theme: { ...DEFAULT_THEME, ...(p.theme ?? {}) } 
      }
    } catch { return { blocks: DEFAULT_BLOCKS, theme: DEFAULT_THEME } }
  }

  const cfg = parseConfig()
  let blocks = $state<Block[]>(untrack(() => cfg.blocks))
  let theme  = $state<GlobalTheme>(untrack(() => cfg.theme))

  let isEditMode = $state(false)
  let selectedId = $state<string | null>(null)
  let sheetOpen  = $state(false)
  let activeTab  = $state<"block" | "global">("global")
  let saveStatus = $state<"" | "saving" | "saved">("")
  let insertionIndex = $state<number | null>(null)
  let showPicker = $state(false)
  let visitorLang = $state<"zh" | "en">(theme.defaultLang)

  let dragSrcId = $state<string | null>(null)
  let dragOverId = $state<string | null>(null)

  const creator = $derived(data.creator)
  const works = $derived(data.works)
  const types = $derived(data.types)
  const isOpen = $derived(creator?.is_open === 1)
  const styles = $derived.by(() => { try { return JSON.parse(String(creator?.styles ?? "[]")) } catch { return [] } })
  const selectedBlock = $derived(blocks.find(b => b.id === selectedId))

  let heroSlide = $state(0)
  $effect(() => {
    if (works.length <= 1) { heroSlide = 0; return }
    const t = setInterval(() => heroSlide++, 4000)
    return () => clearInterval(t)
  })

  let saveTimer: any
  function debouncedSave() {
    saveStatus = ""
    clearTimeout(saveTimer)
    saveTimer = setTimeout(doSave, 800)
  }
  async function doSave() {
    saveStatus = "saving"
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, theme }),
      })
      saveStatus = "saved"
    } catch { saveStatus = "" }
    setTimeout(() => saveStatus = "", 2000)
  }

  function addBlockAt(type: BlockType, index: number) {
    const id = crypto.randomUUID().slice(0, 8)
    const newBlock: Block = { id, type, visible: true, width: BLOCK_DEFAULTS[type].width, data: { ...BLOCK_DEFAULTS[type] } }
    blocks.splice(index, 0, newBlock)
    blocks = [...blocks]
    selectedId = id; showPicker = false; activeTab = "block"; sheetOpen = true; debouncedSave()
  }

  function deleteBlock(id: string) {
    if (!confirm("確定要刪除此區塊嗎？")) return
    blocks = blocks.filter(b => b.id !== id); if (selectedId === id) selectedId = null; debouncedSave()
  }

  function toggleVisible(id: string) {
    blocks = blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b); debouncedSave()
  }

  function updateBlockData(key: string, val: any) {
    if (!selectedId) return
    blocks = blocks.map(b => b.id === selectedId ? { ...b, data: { ...b.data, [key]: val } } : b); debouncedSave()
  }

  function updateT(key: string, lang: "zh" | "en", val: string) {
    if (!selectedId || !selectedBlock) return
    const current = selectedBlock.data[key]
    const newVal = typeof current === 'object' ? { ...current, [lang]: val } : { zh: String(current || ""), [lang]: val }
    updateBlockData(key, newVal)
  }

  function updateBlockWidth(w: number) {
    if (!selectedId) return
    blocks = blocks.map(b => b.id === selectedId ? { ...b, width: w } : b); debouncedSave()
  }

  function handleDragStart(id: string) { dragSrcId = id }
  function handleDragOver(id: string) { if (dragSrcId !== id) dragOverId = id }
  function handleDrop(targetId: string) {
    if (!dragSrcId || dragSrcId === targetId) { dragSrcId = null; dragOverId = null; return }
    const from = blocks.findIndex(b => b.id === dragSrcId); const to = blocks.findIndex(b => b.id === targetId)
    const arr = [...blocks]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved)
    blocks = arr; dragSrcId = null; dragOverId = null; debouncedSave()
  }

  const PICKER_OPTIONS: { type: BlockType; label: string; icon: string }[] = [
    { type: "BIO", label: "簡介", icon: "📄" }, { type: "STATUS", label: "狀態", icon: "⌘" }, { type: "TOOLS", label: "工具", icon: "💻" },
    { type: "LINKS", label: "聯繫", icon: "🔗" }, { type: "RESOURCES", label: "資源", icon: "📦" }, { type: "gallery", label: "作品集", icon: "🎨" },
    { type: "commission", label: "委託", icon: "✦" }, { type: "pricing", label: "價格表", icon: "$" }, { type: "notice", label: "公告", icon: "📢" },
    { type: "reactions", label: "心情", icon: "❤️" }, { type: "anonymous_box", label: "提問箱", icon: "🍬" }, { type: "faq", label: "問答", icon: "❓" },
    { type: "countdown", label: "倒數", icon: "⏳" }, { type: "terms", label: "條款", icon: "📜" }, { type: "text", label: "文字", icon: "T" },
    { type: "image", label: "圖片", icon: "🖼" }, { type: "button", label: "按鈕", icon: "↗" }, { type: "divider", label: "分隔線", icon: "—" }, { type: "spacer", label: "間距", icon: "↕" },
  ]
</script>

<svelte:head>
  <title>{t(creator?.display_name, visitorLang)}</title>
</svelte:head>

<div 
  class="root" 
  class:editing={isEditMode}
  style="
    background-color: {theme.bgColor}; 
    color: {theme.textColor}; 
    --accent: {theme.accentColor};
    --max-w: {theme.maxWidth}px;
    font-family: {theme.fontFamily === 'serif' ? 'Georgia, serif' : theme.fontFamily === 'rounded' ? 'ui-rounded, system-ui, sans-serif' : 'system-ui, sans-serif'}
  "
>
  <!-- Language Switcher -->
  {#if theme.supportBilingual}
    <div class="lang-switcher">
      <button class:active={visitorLang === 'zh'} onclick={() => visitorLang = 'zh'}>繁中</button>
      <button class:active={visitorLang === 'en'} onclick={() => visitorLang = 'en'}>EN</button>
    </div>
  {/if}

  {#if isEditMode}
    <div class="top-bar">
      <div class="save-info">
        <span class="mode-tag">編輯模式</span>
        <span class="status-text">
          {#if saveStatus === "saving"}儲存中...{:else if saveStatus === "saved"}已儲存 ✓{/if}
        </span>
      </div>
      <button class="btn-done" onclick={() => { isEditMode = false; selectedId = null; sheetOpen = false }}>完成</button>
    </div>
  {/if}

  <div class="notion-header">
    <div class="cover-area">
      {#if works.length > 0}
        <img src={works[heroSlide % works.length].preview_url} alt="Cover" class="cover-img" />
      {:else}
        <div class="cover-placeholder" style="background: {theme.accentColor}22"></div>
      {/if}
    </div>
    <div class="header-content" style="max-width: var(--max-w)">
      <div class="avatar-overlap">
        <img src={creator?.avatar_url || "/avatar.jpg"} alt={creator?.display_name} class="avatar-img" />
      </div>
      <div class="creator-info">
        <h1 class="display-name">{t(creator?.display_name, visitorLang)}</h1>
        <div class="badges">
          <span class="badge"><span class="icon">📍</span> {visitorLang === 'zh' ? '台灣' : 'Taiwan'}</span>
          <span class="badge"><span class="icon">✨</span> {visitorLang === 'zh' ? '專業創作者' : 'Professional Artist'}</span>
          <span class="badge"><span class="icon">🌐</span> {visitorLang === 'zh' ? '繁體中文, English' : 'Traditional Chinese, English'}</span>
        </div>
      </div>
    </div>
  </div>

  <main class="canvas" style="max-width: var(--max-w)">
    <div class="bento-grid">
      {#each blocks as block, i (block.id)}
        <div class="bento-item col-span-{block.width || 1}">
          {#if isEditMode}
            <InsertionPoint onAdd={() => { insertionIndex = i; showPicker = true }} />
          {/if}

          {#if block.visible || isEditMode}
            <BlockWrapper
              id={block.id}
              type={block.type}
              editing={isEditMode}
              selected={selectedId === block.id}
              visible={block.visible}
              dragOver={dragOverId === block.id}
              onSelect={() => { selectedId = block.id; activeTab = "block" }}
              onAction={(action) => {
                if (action === 'edit') { selectedId = block.id; activeTab = "block"; sheetOpen = true }
                if (action === 'delete') deleteBlock(block.id)
                if (action === 'toggle-visible') toggleVisible(block.id)
              }}
              onDragStart={() => handleDragStart(block.id)}
              onDragOver={(e) => { e.preventDefault(); handleDragOver(block.id) }}
              onDrop={() => handleDrop(block.id)}
              onDragEnd={() => { dragSrcId = null; dragOverId = null }}
            >
              <BlockRenderer 
                {block} {creator} {works} {isOpen} {styles} 
                accentColor={theme.accentColor} 
                {heroSlide} {types} 
                lang={visitorLang}
              />
            </BlockWrapper>
          {/if}
        </div>
      {/each}
    </div>

    {#if isEditMode}
      <div class="footer-insertion">
        <InsertionPoint onAdd={() => { insertionIndex = blocks.length; showPicker = true }} />
      </div>
      <div class="footer-actions">
        <button class="btn-add-large" onclick={() => { insertionIndex = blocks.length; showPicker = true }}>
          + 新增區塊
        </button>
      </div>
    {/if}
  </main>

  <footer class="page-footer" style="max-width: var(--max-w)">
    <div class="footer-left">
      <div class="footer-logo">A</div>
      <p class="copyright">© 2026 {t(creator?.display_name, visitorLang)}. Crafted for artists.</p>
    </div>
    <div class="footer-links">
      {#if data.isArtist && !isEditMode}
        <button class="footer-btn" onclick={() => isEditMode = true}>編輯名片 / Edit Card</button>
      {/if}
      <a href="#" class="footer-link">服務條款 / Terms</a>
    </div>
  </footer>

  {#if showPicker}
    <div class="picker-overlay" onclick={() => showPicker = false}>
      <div class="picker-card" onclick={e => e.stopPropagation()}>
        <h3>選擇要加入的區塊 / Select Block</h3>
        <div class="picker-grid">
          {#each PICKER_OPTIONS as opt}
            <button class="picker-item" onclick={() => addBlockAt(opt.type, insertionIndex ?? blocks.length)}>
              <div class="icon">{opt.icon}</div>
              <div class="label">{opt.label}</div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <BottomSheet 
    bind:open={sheetOpen} 
    onClose={() => {}}
    tabs={[
      { id: "block", label: "區塊設定" },
      { id: "global", label: "全域外觀" }
    ]}
    bind:activeTab
  >
    {#if activeTab === "block"}
      {#if selectedBlock}
        <div class="settings">
          <div class="field">
            <label>顯示寬度 (Bento Grid)</label>
            <div class="choice-group">
              <button class:active={selectedBlock.width === 1} onclick={() => updateBlockWidth(1)}>1 欄</button>
              <button class:active={selectedBlock.width === 2} onclick={() => updateBlockWidth(2)}>2 欄</button>
              <button class:active={selectedBlock.width === 3} onclick={() => updateBlockWidth(3)}>全寬</button>
            </div>
          </div>

          {#if selectedBlock.type === "BIO" || selectedBlock.type === "STATUS" || selectedBlock.type === "gallery" || selectedBlock.type === "commission" || selectedBlock.type === "pricing" || selectedBlock.type === "LINKS" || selectedBlock.type === "RESOURCES" || selectedBlock.type === "section"}
            <div class="field">
              <label>標題 (繁中)</label>
              <input type="text" value={t(selectedBlock.data.title, 'zh')} oninput={e => updateT("title", 'zh', (e.target as HTMLInputElement).value)} />
              {#if theme.supportBilingual}
                <label style="margin-top: 8px">標題 (English)</label>
                <input type="text" value={t(selectedBlock.data.title, 'en')} oninput={e => updateT("title", 'en', (e.target as HTMLInputElement).value)} />
              {/if}
            </div>
          {/if}

          {#if selectedBlock.type === "STATUS"}
            <div class="field">
              <label>目前排單量</label>
              <input type="number" value={selectedBlock.data.queueCount} oninput={e => updateBlockData("queueCount", Number((e.target as HTMLInputElement).value))} />
            </div>

          {:else if selectedBlock.type === "TOOLS"}
            <div class="field">
              <label>工具清單 (JSON 格式暫代)</label>
              <textarea rows="5" oninput={e => {
                try { updateBlockData("tools", JSON.parse((e.target as HTMLTextAreaElement).value)) } catch {}
              }}>{JSON.stringify(selectedBlock.data.tools, null, 2)}</textarea>
            </div>

          {:else if selectedBlock.type === "LINKS"}
            {#each selectedBlock.data.links as link, i}
              <div class="input-row">
                <input type="text" value={link.label} oninput={e => {
                  const newLinks = [...selectedBlock.data.links]; newLinks[i].label = (e.target as HTMLInputElement).value; updateBlockData("links", newLinks)
                }} placeholder="標籤" />
                <input type="text" value={link.url} oninput={e => {
                  const newLinks = [...selectedBlock.data.links]; newLinks[i].url = (e.target as HTMLInputElement).value; updateBlockData("links", newLinks)
                }} placeholder="網址" />
              </div>
            {/each}

          {:else if selectedBlock.type === "text"}
            <div class="field">
              <label>文字內容 (繁中)</label>
              <textarea rows="6" oninput={e => updateT("content", 'zh', (e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.content, 'zh')}</textarea>
              {#if theme.supportBilingual}
                <label style="margin-top: 8px">文字內容 (English)</label>
                <textarea rows="6" oninput={e => updateT("content", 'en', (e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.content, 'en')}</textarea>
              {/if}
            </div>

          {:else if selectedBlock.type === "button"}
             <div class="field">
              <label>標籤 (繁中)</label>
              <input type="text" value={t(selectedBlock.data.label, 'zh')} oninput={e => updateT("label", 'zh', (e.target as HTMLInputElement).value)} />
              {#if theme.supportBilingual}
                <label style="margin-top: 8px">標籤 (English)</label>
                <input type="text" value={t(selectedBlock.data.label, 'en')} oninput={e => updateT("label", 'en', (e.target as HTMLInputElement).value)} />
              {/if}
            </div>
            <div class="field">
              <label>網址 (URL)</label>
              <input type="text" value={selectedBlock.data.url} oninput={e => updateBlockData("url", (e.target as HTMLInputElement).value)} />
            </div>

          {:else if selectedBlock.type === "notice"}
            <div class="field">
              <label>公告文字 (繁中)</label>
              <textarea rows="3" oninput={e => updateT("text", 'zh', (e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.text, 'zh')}</textarea>
              {#if theme.supportBilingual}
                <label style="margin-top: 8px">公告文字 (English)</label>
                <textarea rows="3" oninput={e => updateT("text", 'en', (e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.text, 'en')}</textarea>
              {/if}
            </div>

          {:else if selectedBlock.type === "faq"}
            {#each selectedBlock.data.items as item, i}
              <div class="plan-edit-card">
                <input type="text" value={t(item.question, 'zh')} oninput={e => {
                  const newItems = [...selectedBlock.data.items]; item.question = typeof item.question === 'object' ? { ...item.question, zh: (e.target as HTMLInputElement).value } : { zh: (e.target as HTMLInputElement).value, en: "" }; updateBlockData("items", newItems)
                }} placeholder="問題 (繁中)" />
                <textarea rows="2" oninput={e => {
                  const newItems = [...selectedBlock.data.items]; item.answer = typeof item.answer === 'object' ? { ...item.answer, zh: (e.target as HTMLTextAreaElement).value } : { zh: (e.target as HTMLTextAreaElement).value, en: "" }; updateBlockData("items", newItems)
                }}>{t(item.answer, 'zh')}</textarea>
                {#if theme.supportBilingual}
                   <input type="text" value={t(item.question, 'en')} oninput={e => {
                    const newItems = [...selectedBlock.data.items]; item.question = typeof item.question === 'object' ? { ...item.question, en: (e.target as HTMLInputElement).value } : { zh: "", en: (e.target as HTMLInputElement).value }; updateBlockData("items", newItems)
                  }} placeholder="Question (English)" />
                  <textarea rows="2" oninput={e => {
                    const newItems = [...selectedBlock.data.items]; item.answer = typeof item.answer === 'object' ? { ...item.answer, en: (e.target as HTMLTextAreaElement).value } : { zh: "", en: (e.target as HTMLTextAreaElement).value }; updateBlockData("items", newItems)
                  }}>{t(item.answer, 'en')}</textarea>
                {/if}
              </div>
            {/each}

          {:else if selectedBlock.type === "terms"}
            <div class="field">
              <label>條款內容 (繁中)</label>
              <textarea rows="6" oninput={e => updateT("content", 'zh', (e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.content, 'zh')}</textarea>
              {#if theme.supportBilingual}
                <label style="margin-top: 8px">條款內容 (English)</label>
                <textarea rows="6" oninput={e => updateT("content", 'en', (e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.content, 'en')}</textarea>
              {/if}
            </div>
          {/if}
        </div>
      {:else}
        <p class="empty-hint">選取區塊以進行編輯</p>
      {/if}

    {:else if activeTab === "global"}
      <div class="settings">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={theme.supportBilingual} onchange={debouncedSave} />
          啟用雙語支援 (繁中/EN)
        </label>
        
        <div class="field">
          <label>預設語系</label>
          <select bind:value={theme.defaultLang} onchange={debouncedSave}>
            <option value="zh">繁體中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <div class="field">
          <label>快速配色方案</label>
          <div class="palette-grid">
            {#each PALETTES as p}
              <button class="palette-btn" style="background: {p.bg}; border-color: {p.accent}" onclick={() => applyPalette(p)}>
                <div class="palette-dot" style="background: {p.accent}"></div>
                <span style="color: {p.text}">{p.label}</span>
              </button>
            {/each}
          </div>
        </div>
        <div class="field">
          <label>背景顏色</label>
          <input type="color" bind:value={theme.bgColor} oninput={debouncedSave} />
        </div>
        <div class="field">
          <label>字型樣式</label>
          <select bind:value={theme.fontFamily} onchange={debouncedSave}>
            <option value="system">系統字型</option>
            <option value="serif">襯線體</option>
            <option value="rounded">圓體</option>
          </select>
        </div>
        <div class="field">
          <label>頁面最大寬度 ({theme.maxWidth}px)</label>
          <input type="range" min="600" max="1280" step="40" bind:value={theme.maxWidth} oninput={debouncedSave} />
        </div>
      </div>
    {/if}
  </BottomSheet>
</div>

<style>
/* ── Root ── */
.root {
  min-height: 100vh;
  position: relative;
  transition: background 0.3s;
  padding-bottom: 80px;
  font-family: var(--font-body);
}

/* ── Language switcher ── */
.lang-switcher {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.lang-switcher button {
  padding: 5px 14px;
  border: none;
  background: var(--white);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  color: var(--ink);
  transition: background 0.15s;
}
.lang-switcher button.active {
  background: var(--blue);
  color: var(--white);
}

/* ── Edit mode toolbar ── */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 500;
  height: 52px;
  padding: 0 20px;
  background: var(--ink);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 3px solid var(--blue);
}
.mode-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 3px 10px;
  background: var(--red);
  color: var(--white);
  border: 1px solid var(--white);
  margin-right: 12px;
}
.status-text {
  font-family: var(--font-mono);
  font-size: 11px;
  opacity: 0.6;
}
.btn-done {
  padding: 6px 20px;
  background: var(--white);
  color: var(--ink);
  border: 2px solid var(--white);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.08s;
}
.btn-done:hover { transform: translate(-1px, -1px); }

/* ── Cover / Header ── */
.notion-header { margin-bottom: 2rem; }
.cover-area {
  height: 240px;
  width: 100%;
  overflow: hidden;
  background: var(--blue);
  border-bottom: 3px solid var(--ink);
  position: relative;
}
.cover-area::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  width: 120px;
  height: 100%;
  background-image:
    repeating-linear-gradient(
      0deg,
      var(--white) 0px, var(--white) 12px,
      var(--blue) 12px, var(--blue) 24px
    );
  opacity: 0.15;
  pointer-events: none;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.8);
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  background: var(--blue);
}
.header-content {
  margin: 0 auto;
  padding: 0 48px;
  position: relative;
}
.avatar-overlap {
  position: absolute;
  top: -56px;
  left: 48px;
  width: 112px;
  height: 112px;
  border: 3px solid var(--ink);
  box-shadow: var(--shadow-md);
  background: var(--white);
  padding: 3px;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.creator-info { padding-top: 72px; }
.display-name {
  font-family: var(--font-display);
  font-size: 44px;
  color: var(--ink);
  margin: 0 0 14px;
  line-height: 1.1;
  letter-spacing: 0.01em;
}
.badges { display: flex; flex-wrap: wrap; gap: 10px; }
.badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: var(--white);
  border: 1px solid var(--ink);
  box-shadow: var(--shadow-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
}

/* ── Bento Grid ── */
.canvas { margin: 0 auto; padding: 32px 48px 120px; }
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.bento-item { min-width: 0; }
.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }

/* ── Add block button ── */
.footer-actions {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}
.btn-add-large {
  padding: 14px 48px;
  border: 2px dashed var(--color-border-secondary);
  background: transparent;
  color: var(--color-text-tertiary);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-add-large:hover {
  border-color: var(--blue);
  color: var(--blue);
  border-style: solid;
  box-shadow: var(--shadow-sm);
}

/* ── Footer ── */
.page-footer {
  margin: 0 auto;
  padding: 32px 48px;
  border-top: var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer-left { display: flex; align-items: center; gap: 14px; }
.footer-logo {
  width: 32px;
  height: 32px;
  background: var(--blue);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 18px;
  border: 2px solid var(--ink);
}
.copyright {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-tertiary);
}
.footer-links { display: flex; gap: 24px; align-items: center; }
.footer-link {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-tertiary);
  text-decoration: none;
}
.footer-btn {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--blue);
  background: none;
  border: 1px solid var(--blue);
  padding: 4px 12px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

/* ── Block Picker Overlay ── */
.picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(21, 22, 45, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.picker-card {
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-lg);
  padding: 32px;
  width: 100%;
  max-width: 560px;
}
.picker-card h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin: 0 0 24px;
  text-align: center;
  color: var(--blue);
}
.picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 4px;
}
.picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 8px;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.08s, box-shadow 0.08s, background 0.08s, color 0.08s;
}
.picker-item:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
  background: var(--blue);
  color: var(--white);
}
.picker-item .icon { font-size: 26px; }
.picker-item .label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; font-family: var(--font-mono); }

/* ── Settings panel (BottomSheet content) ── */
.settings { display: flex; flex-direction: column; gap: 20px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.08em;
  opacity: 0.5;
}
.field input, .field select, .field textarea {
  padding: 10px 14px;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 14px;
  background: var(--white);
  color: var(--ink);
  width: 100%;
  outline: none;
}
.field input:focus, .field select:focus, .field textarea:focus {
  box-shadow: var(--shadow-sm);
}
.field input[type="color"] {
  width: 100%;
  height: 44px;
  border: var(--border);
  cursor: pointer;
  padding: 4px;
}
.choice-group { display: flex; gap: 8px; }
.choice-group button {
  flex: 1;
  padding: 8px;
  border: var(--border);
  background: var(--white);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.08s;
  box-shadow: var(--shadow-sm);
}
.choice-group button.active {
  background: var(--blue);
  color: var(--white);
  box-shadow: none;
  transform: translate(2px, 2px);
}
.input-row { display: flex; gap: 8px; align-items: center; }
.palette-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.palette-btn {
  padding: 10px;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: transform 0.08s;
}
.palette-btn:hover { transform: translate(-1px, -1px); box-shadow: var(--shadow-md); }
.palette-dot { width: 14px; height: 14px; border: 1px solid var(--ink); }
.empty-hint {
  text-align: center;
  padding: 60px;
  color: var(--color-text-tertiary);
  font-style: italic;
  font-size: 14px;
}
.plan-edit-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--color-border-tertiary);
  background: #f9f9f9;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.footer-insertion { margin-top: 16px; }

@media (max-width: 768px) {
  .bento-grid { grid-template-columns: 1fr; }
  .col-span-1, .col-span-2, .col-span-3 { grid-column: span 1; }
  .header-content { padding: 0 20px; }
  .avatar-overlap { left: 20px; width: 88px; height: 88px; top: -44px; }
  .display-name { font-size: 30px; }
  .canvas { padding: 32px 20px; }
  .picker-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
