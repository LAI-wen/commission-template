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

  // ── 預設值 ──────────────────────────────────────────────
  const BLOCK_DEFAULTS: Record<string, any> = {
    BIO:        { title: { zh: "個人簡介", en: "Biography" }, width: 2 },
    STATUS:     { title: { zh: "接案狀態", en: "Availability" }, width: 1, queueCount: 3 },
    TOOLS:      { title: { zh: "創作工具", en: "Creative Tools" }, width: 3, tools: [{ name: "Procreate", category: "硬體", description: "主要繪圖工具", icon: "Tablet" }] },
    LINKS:      { title: { zh: "聯繫我", en: "Connect" }, width: 1, links: [{ label: "Email", url: "mailto:", icon: "Mail" }] },
    RESOURCES:  { title: { zh: "相關資源", en: "Resources" }, width: 1, resources: [{ name: "筆刷包", type: "Brushes", url: "#", isPro: true }] },
    gallery:    { title: { zh: "精選作品", en: "Featured Works" }, limit: 6, columns: 3 },
    commission: { title: { zh: "委託項目", en: "Commissions" }, limit: 6 },
    pricing:    { title: { zh: "價格方案", en: "Pricing" }, plans: [{ name: { zh: "標準方案", en: "Standard" }, price: "NT$ 1,000", features: [{ zh: "項目一", en: "Item 1" }], recommended: false }] },
    notice:     { text: { zh: "這是一則重要公告", en: "Important notice" }, icon: "📢", bgColor: "rgba(255,243,205,1)", closable: true },
    reactions:  { emojis: ["❤️", "🌟", "🎨", "🍵"] },
    faq:        { items: [{ question: { zh: "問題一", en: "Question 1" }, answer: { zh: "回答一", en: "Answer 1" } }] },
    countdown:  { targetDate: new Date(Date.now() + 86400000 * 7).toISOString(), finishText: { zh: "時間已到！", en: "Time's up!" }, style: "minimal" },
    terms:      { content: { zh: "請輸入條款...", en: "Please enter terms..." }, collapsed: true },
    text:       { content: { zh: "在這裡輸入文字...", en: "Enter text here..." }, align: "left" },
    image:      { urls: [], mode: "single", radius: 12 },
    button:     { label: { zh: "按鈕文字", en: "Button Text" }, url: "#", style: "solid", align: "center", fullWidth: false },
    section:    { title: { zh: "區段標題", en: "Section" } },
    divider:    { style: "solid", thickness: 1, spacing: 16 },
    spacer:     { height: 24 },
    anonymous_box: { title: { zh: "匿名提問", en: "Ask Me" }, placeholder: { zh: "輸入你的問題...", en: "Type your question..." } },
  }

  const DEFAULT_BLOCKS: Block[] = [
    { id: "b1", type: "BIO",        visible: true, data: { ...BLOCK_DEFAULTS.BIO } },
    { id: "b2", type: "STATUS",     visible: true, data: { ...BLOCK_DEFAULTS.STATUS } },
    { id: "b3", type: "gallery",    visible: true, data: { ...BLOCK_DEFAULTS.gallery } },
    { id: "b4", type: "commission", visible: true, data: { ...BLOCK_DEFAULTS.commission } },
    { id: "b5", type: "LINKS",      visible: true, data: { ...BLOCK_DEFAULTS.LINKS } },
  ]

  const DEFAULT_THEME: GlobalTheme = {
    accentColor: "#276CE4",
    bgColor: "#FBF9F5",
    textColor: "#1747BB",
    maxWidth: 640,          // 單欄預設寬度
    fontFamily: "system",
    bgBlur: 0,
    bgFixed: false,
    supportBilingual: true,
    defaultLang: "zh",
  }

  function parseConfig(): { blocks: Block[]; theme: GlobalTheme } {
    try {
      const raw = data.creator?.page_config
      if (!raw) return { blocks: DEFAULT_BLOCKS, theme: DEFAULT_THEME }
      const p = JSON.parse(raw as string)
      return {
        blocks: p.blocks ?? DEFAULT_BLOCKS,
        theme: { ...DEFAULT_THEME, ...(p.theme ?? {}) },
      }
    } catch { return { blocks: DEFAULT_BLOCKS, theme: DEFAULT_THEME } }
  }

  const cfg = parseConfig()
  let blocks     = $state<Block[]>(untrack(() => cfg.blocks))
  let theme      = $state<GlobalTheme>(untrack(() => cfg.theme))

  // ── 編輯器狀態 ──────────────────────────────────────────
  let isEditMode     = $state(false)
  let selectedId     = $state<string | null>(null)
  let sheetOpen      = $state(false)
  let activeTab      = $state<"block" | "global">("global")
  let saveStatus     = $state<"" | "saving" | "saved">("")
  let insertionIndex = $state<number | null>(null)
  let showPicker     = $state(false)
  let visitorLang    = $state<"zh" | "en">(theme.defaultLang)

  let dragSrcId  = $state<string | null>(null)
  let dragOverId = $state<string | null>(null)

  // ── Derived ─────────────────────────────────────────────
  const creator       = $derived(data.creator)
  const works         = $derived(data.works)
  const types         = $derived(data.types)
  const isOpen        = $derived(creator?.is_open === 1)
  const styles        = $derived.by(() => { try { return JSON.parse(String(creator?.styles ?? "[]")) } catch { return [] } })
  const selectedBlock = $derived(blocks.find(b => b.id === selectedId))

  // Hero 輪播
  let heroSlide = $state(0)
  $effect(() => {
    if (works.length <= 1) { heroSlide = 0; return }
    const timer = setInterval(() => heroSlide++, 4000)
    return () => clearInterval(timer)
  })

  // ── 儲存 ────────────────────────────────────────────────
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
    setTimeout(() => saveStatus = "", 2500)
  }

  // ── Block 操作 ──────────────────────────────────────────
  function addBlockAt(type: BlockType, index: number) {
    const id = crypto.randomUUID().slice(0, 8)
    const newBlock: Block = {
      id, type, visible: true,
      data: { ...(BLOCK_DEFAULTS[type] ?? {}) },
    }
    blocks.splice(index, 0, newBlock)
    blocks = [...blocks]
    selectedId = id
    showPicker = false
    activeTab = "block"
    sheetOpen = true
    debouncedSave()
  }

  function deleteBlock(id: string) {
    if (!confirm("確定要刪除此區塊？")) return
    blocks = blocks.filter(b => b.id !== id)
    if (selectedId === id) selectedId = null
    debouncedSave()
  }

  function toggleVisible(id: string) {
    blocks = blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b)
    debouncedSave()
  }

  function updateBlockData(key: string, val: any) {
    if (!selectedId) return
    blocks = blocks.map(b =>
      b.id === selectedId ? { ...b, data: { ...b.data, [key]: val } } : b
    )
    debouncedSave()
  }

  function updateT(key: string, lang: "zh" | "en", val: string) {
    if (!selectedId || !selectedBlock) return
    const current = selectedBlock.data[key]
    const newVal = typeof current === "object"
      ? { ...current, [lang]: val }
      : { zh: String(current || ""), [lang]: val }
    updateBlockData(key, newVal)
  }

  // ── 拖拉 ────────────────────────────────────────────────
  function handleDragStart(id: string) { dragSrcId = id }
  function handleDragOver(id: string)  { if (dragSrcId !== id) dragOverId = id }
  function handleDrop(targetId: string) {
    if (!dragSrcId || dragSrcId === targetId) { dragSrcId = null; dragOverId = null; return }
    const from = blocks.findIndex(b => b.id === dragSrcId)
    const to   = blocks.findIndex(b => b.id === targetId)
    const arr  = [...blocks]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    blocks = arr
    dragSrcId = null; dragOverId = null
    debouncedSave()
  }

  // ── Block Picker 選項 ────────────────────────────────────
  const PICKER_OPTIONS: { type: BlockType; label: string; icon: string; group: "content" | "layout" | "special" }[] = [
    { type: "BIO",           label: "個人簡介",  icon: "📄", group: "content" },
    { type: "STATUS",        label: "接案狀態",  icon: "⌘",  group: "content" },
    { type: "gallery",       label: "作品集",    icon: "🎨", group: "content" },
    { type: "commission",    label: "委託項目",  icon: "✦",  group: "content" },
    { type: "LINKS",         label: "聯繫方式",  icon: "🔗", group: "content" },
    { type: "TOOLS",         label: "創作工具",  icon: "💻", group: "content" },
    { type: "RESOURCES",     label: "相關資源",  icon: "📦", group: "content" },
    { type: "pricing",       label: "價格方案",  icon: "$",  group: "content" },
    { type: "notice",        label: "公告",      icon: "📢", group: "content" },
    { type: "anonymous_box", label: "提問箱",    icon: "🍬", group: "content" },
    { type: "reactions",     label: "心情",      icon: "❤️", group: "content" },
    { type: "faq",           label: "問答",      icon: "❓", group: "content" },
    { type: "countdown",     label: "倒數計時",  icon: "⏳", group: "content" },
    { type: "terms",         label: "委託條款",  icon: "📜", group: "content" },
    { type: "text",          label: "文字段落",  icon: "T",  group: "layout" },
    { type: "image",         label: "圖片",      icon: "🖼", group: "layout" },
    { type: "button",        label: "按鈕",      icon: "↗",  group: "layout" },
    { type: "section",       label: "區段標題",  icon: "#",  group: "layout" },
    { type: "divider",       label: "分隔線",    icon: "—",  group: "layout" },
    { type: "spacer",        label: "間距",      icon: "↕",  group: "layout" },
  ]
</script>

<svelte:head>
  <title>{t(creator?.display_name, visitorLang)}</title>
</svelte:head>

<!-- ── 根容器 ── -->
<div
  class="page-root"
  style="
    background-color: {theme.bgColor};
    color: {theme.textColor};
    --accent: {theme.accentColor};
    --page-max-w: {theme.maxWidth}px;
  "
>

  <!-- ── 編輯模式頂部 Bar ── -->
  {#if isEditMode}
    <div class="edit-bar">
      <div class="edit-bar-left">
        <span class="edit-tag">編輯模式</span>
        <span class="edit-status">
          {#if saveStatus === "saving"}
            <span class="status-dot saving"></span>儲存中...
          {:else if saveStatus === "saved"}
            <span class="status-dot saved"></span>已儲存
          {:else}
            <span class="status-dot idle"></span>未儲存變更
          {/if}
        </span>
      </div>
      <div class="edit-bar-right">
        <!-- 寬度調整 -->
        <div class="width-control">
          <span class="width-label">寬度</span>
          <button
            class="width-btn"
            class:active={theme.maxWidth <= 480}
            onclick={() => { theme.maxWidth = 480; debouncedSave() }}
            title="手機（480px）"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
          </button>
          <button
            class="width-btn"
            class:active={theme.maxWidth > 480 && theme.maxWidth <= 768}
            onclick={() => { theme.maxWidth = 640; debouncedSave() }}
            title="平板（640px）"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="20" x="3" y="2" rx="2"/><path d="M12 18h.01"/></svg>
          </button>
          <button
            class="width-btn"
            class:active={theme.maxWidth > 768}
            onclick={() => { theme.maxWidth = 1024; debouncedSave() }}
            title="桌機（1024px）"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
          </button>
        </div>
        <button
          class="btn-done"
          onclick={() => { isEditMode = false; selectedId = null; sheetOpen = false }}
        >
          完成
        </button>
      </div>
    </div>
  {/if}

  <!-- ── 背景圖 ── -->
  {#if theme.bgImage}
    <div
      class="bg-layer"
      style="
        background-image: url('{theme.bgImage}');
        filter: blur({theme.bgBlur}px);
        background-attachment: {theme.bgFixed ? 'fixed' : 'scroll'};
      "
    ></div>
  {/if}

  <!-- ── 主內容 ── -->
  <div class="page-inner" style="max-width: var(--page-max-w);">

    <!-- Hero：頭像 + 名稱 + 狀態 -->
    <header class="hero">
      <!-- 封面輪播 -->
      {#if works.length > 0}
        <div class="hero-cover">
          <img
            src={works[heroSlide % works.length].preview_url}
            alt="cover"
            class="cover-img"
          />
          <!-- 輪播點 -->
          {#if works.length > 1}
            <div class="cover-dots">
              {#each works as _, i}
                <button
                  class="cover-dot"
                  class:active={heroSlide % works.length === i}
                  onclick={() => heroSlide = i}
                  aria-label="作品 {i + 1}"
                ></button>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <div class="hero-cover hero-cover-empty"></div>
      {/if}

      <!-- 頭像 -->
      <div class="hero-avatar-wrap">
        <img
          src={creator?.avatar_url || "/avatar.jpg"}
          alt={t(creator?.display_name, visitorLang)}
          class="hero-avatar"
        />
      </div>

      <!-- 名稱 + 狀態 badge -->
      <div class="hero-meta">
        <div class="hero-name-row">
          <h1 class="hero-name">{t(creator?.display_name, visitorLang)}</h1>
          <span class="open-badge" class:is-open={isOpen}>
            <span class="badge-dot"></span>
            {isOpen
              ? (visitorLang === "zh" ? "開放委託中" : "Open for Commission")
              : (visitorLang === "zh" ? "暫停委託" : "Closed")}
          </span>
        </div>

        {#if creator?.bio}
          <p class="hero-bio">{creator.bio}</p>
        {/if}

        <!-- 風格標籤 -->
        {#if styles.length > 0}
          <div class="hero-tags">
            {#each styles as s}
              <span class="style-tag">{s}</span>
            {/each}
          </div>
        {/if}

        <!-- 雙語切換 -->
        {#if theme.supportBilingual}
          <div class="lang-toggle">
            <button
              class="lang-btn"
              class:active={visitorLang === "zh"}
              onclick={() => visitorLang = "zh"}
            >繁中</button>
            <button
              class="lang-btn"
              class:active={visitorLang === "en"}
              onclick={() => visitorLang = "en"}
            >EN</button>
          </div>
        {/if}
      </div>
    </header>

    <!-- ── Block 列表 ── -->
    <main class="block-list" class:editing={isEditMode}>

      {#each blocks as block, i (block.id)}

        <!-- 插入點 -->
        {#if isEditMode}
          <InsertionPoint onAdd={() => { insertionIndex = i; showPicker = true }} />
        {/if}

        {#if block.visible || isEditMode}
          <div class="block-row" class:hidden-block={!block.visible && isEditMode}>
            <BlockWrapper
              id={block.id}
              type={block.type}
              editing={isEditMode}
              selected={selectedId === block.id}
              visible={block.visible}
              dragOver={dragOverId === block.id}
              onSelect={() => { selectedId = block.id; activeTab = "block" }}
              onAction={(action) => {
                if (action === "edit")          { selectedId = block.id; activeTab = "block"; sheetOpen = true }
                if (action === "delete")        deleteBlock(block.id)
                if (action === "toggle-visible") toggleVisible(block.id)
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
          </div>
        {/if}

      {/each}

      <!-- 最後一個插入點 -->
      {#if isEditMode}
        <InsertionPoint onAdd={() => { insertionIndex = blocks.length; showPicker = true }} />
        <button
          class="btn-add-block"
          onclick={() => { insertionIndex = blocks.length; showPicker = true }}
        >
          + 新增區塊
        </button>
      {/if}

    </main>

    <!-- ── Footer ── -->
    <footer class="page-footer">
      <span class="footer-copy">
        © 2026 {t(creator?.display_name, visitorLang)}
      </span>
      <div class="footer-actions">
        {#if data.isArtist && !isEditMode}
          <button class="footer-edit-btn" onclick={() => isEditMode = true}>
            ✎ 編輯名片
          </button>
        {/if}
      </div>
    </footer>

  </div><!-- /page-inner -->

  <!-- ── 編輯模式 FAB（右下角） ── -->
  {#if data.isArtist && !isEditMode}
    <button class="fab-edit" onclick={() => isEditMode = true} title="編輯名片">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
    </button>
  {/if}

  <!-- ── Block Picker Modal ── -->
  {#if showPicker}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="picker-overlay" onclick={() => showPicker = false}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div class="picker-modal" onclick={(e) => e.stopPropagation()}>
        <div class="picker-header">
          <h3 class="picker-title">選擇區塊</h3>
          <button class="picker-close" onclick={() => showPicker = false}>✕</button>
        </div>

        <div class="picker-section">
          <div class="picker-section-label">內容區塊</div>
          <div class="picker-grid">
            {#each PICKER_OPTIONS.filter(o => o.group === "content") as opt}
              <button
                class="picker-item"
                onclick={() => addBlockAt(opt.type, insertionIndex ?? blocks.length)}
              >
                <span class="picker-icon">{opt.icon}</span>
                <span class="picker-label">{opt.label}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="picker-section">
          <div class="picker-section-label">版面元素</div>
          <div class="picker-grid">
            {#each PICKER_OPTIONS.filter(o => o.group === "layout") as opt}
              <button
                class="picker-item"
                onclick={() => addBlockAt(opt.type, insertionIndex ?? blocks.length)}
              >
                <span class="picker-icon">{opt.icon}</span>
                <span class="picker-label">{opt.label}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- ── Bottom Sheet（設定面板） ── -->
  <BottomSheet
    bind:open={sheetOpen}
    onClose={() => {}}
    tabs={[
      { id: "block",  label: "區塊設定" },
      { id: "global", label: "全域外觀" },
    ]}
    bind:activeTab
  >

    <!-- 區塊設定 Tab -->
    {#if activeTab === "block"}
      {#if selectedBlock}
        <div class="settings">

          <!-- 各 block 類型的設定 -->
          {#if ["BIO","STATUS","gallery","commission","pricing","LINKS","RESOURCES","section"].includes(selectedBlock.type)}
            <div class="field">
              <label class="field-label">標題（繁中）</label>
              <input
                type="text"
                value={t(selectedBlock.data.title, "zh")}
                oninput={e => updateT("title", "zh", (e.target as HTMLInputElement).value)}
              />
              {#if theme.supportBilingual}
                <label class="field-label" style="margin-top:8px">Title (English)</label>
                <input
                  type="text"
                  value={t(selectedBlock.data.title, "en")}
                  oninput={e => updateT("title", "en", (e.target as HTMLInputElement).value)}
                />
              {/if}
            </div>
          {/if}

          {#if selectedBlock.type === "STATUS"}
            <div class="field">
              <label class="field-label">排單量</label>
              <input
                type="number"
                value={selectedBlock.data.queueCount}
                oninput={e => updateBlockData("queueCount", Number((e.target as HTMLInputElement).value))}
              />
            </div>

          {:else if selectedBlock.type === "text"}
            <div class="field">
              <label class="field-label">文字內容（繁中）</label>
              <textarea
                rows="5"
                oninput={e => updateT("content", "zh", (e.target as HTMLTextAreaElement).value)}
              >{t(selectedBlock.data.content, "zh")}</textarea>
              {#if theme.supportBilingual}
                <label class="field-label" style="margin-top:8px">Content (English)</label>
                <textarea
                  rows="5"
                  oninput={e => updateT("content", "en", (e.target as HTMLTextAreaElement).value)}
                >{t(selectedBlock.data.content, "en")}</textarea>
              {/if}
            </div>
            <div class="field">
              <label class="field-label">對齊</label>
              <div class="choice-group">
                {#each ["left","center","right"] as a}
                  <button
                    class:active={selectedBlock.data.align === a}
                    onclick={() => updateBlockData("align", a)}
                  >{a === "left" ? "靠左" : a === "center" ? "置中" : "靠右"}</button>
                {/each}
              </div>
            </div>

          {:else if selectedBlock.type === "button"}
            <div class="field">
              <label class="field-label">標籤（繁中）</label>
              <input type="text" value={t(selectedBlock.data.label, "zh")} oninput={e => updateT("label","zh",(e.target as HTMLInputElement).value)} />
              {#if theme.supportBilingual}
                <label class="field-label" style="margin-top:8px">Label (English)</label>
                <input type="text" value={t(selectedBlock.data.label, "en")} oninput={e => updateT("label","en",(e.target as HTMLInputElement).value)} />
              {/if}
            </div>
            <div class="field">
              <label class="field-label">連結 URL</label>
              <input type="url" value={selectedBlock.data.url} oninput={e => updateBlockData("url",(e.target as HTMLInputElement).value)} />
            </div>
            <div class="field">
              <label class="field-label">樣式</label>
              <div class="choice-group">
                <button class:active={selectedBlock.data.style==="solid"}   onclick={() => updateBlockData("style","solid")}>實心</button>
                <button class:active={selectedBlock.data.style==="outline"} onclick={() => updateBlockData("style","outline")}>外框</button>
              </div>
            </div>

          {:else if selectedBlock.type === "notice"}
            <div class="field">
              <label class="field-label">公告文字（繁中）</label>
              <textarea rows="3" oninput={e => updateT("text","zh",(e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.text,"zh")}</textarea>
              {#if theme.supportBilingual}
                <label class="field-label" style="margin-top:8px">Notice (English)</label>
                <textarea rows="3" oninput={e => updateT("text","en",(e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.text,"en")}</textarea>
              {/if}
            </div>

          {:else if selectedBlock.type === "faq"}
            {#each selectedBlock.data.items as item, i}
              <div class="plan-card">
                <input type="text" placeholder="問題（繁中）" value={t(item.question,"zh")}
                  oninput={e => { const arr=[...selectedBlock.data.items]; arr[i].question={...arr[i].question, zh:(e.target as HTMLInputElement).value}; updateBlockData("items",arr) }} />
                <textarea rows="2" placeholder="回答（繁中）"
                  oninput={e => { const arr=[...selectedBlock.data.items]; arr[i].answer={...arr[i].answer, zh:(e.target as HTMLTextAreaElement).value}; updateBlockData("items",arr) }}
                >{t(item.answer,"zh")}</textarea>
              </div>
            {/each}

          {:else if selectedBlock.type === "countdown"}
            <div class="field">
              <label class="field-label">目標日期</label>
              <input type="datetime-local" value={selectedBlock.data.targetDate?.slice(0,16)}
                onchange={e => updateBlockData("targetDate", new Date((e.target as HTMLInputElement).value).toISOString())} />
            </div>

          {:else if selectedBlock.type === "terms"}
            <div class="field">
              <label class="field-label">條款內容（繁中）</label>
              <textarea rows="6" oninput={e => updateT("content","zh",(e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.content,"zh")}</textarea>
              {#if theme.supportBilingual}
                <label class="field-label" style="margin-top:8px">Terms (English)</label>
                <textarea rows="6" oninput={e => updateT("content","en",(e.target as HTMLTextAreaElement).value)}>{t(selectedBlock.data.content,"en")}</textarea>
              {/if}
            </div>
          {/if}

        </div>
      {:else}
        <p class="empty-hint">選取一個區塊以編輯設定</p>
      {/if}

    <!-- 全域外觀 Tab -->
    {:else if activeTab === "global"}
      <div class="settings">

        <div class="field">
          <label class="field-label">頁面寬度</label>
          <div class="choice-group">
            <button class:active={theme.maxWidth <= 480}  onclick={() => { theme.maxWidth = 480;  debouncedSave() }}>手機</button>
            <button class:active={theme.maxWidth === 640}  onclick={() => { theme.maxWidth = 640;  debouncedSave() }}>窄版</button>
            <button class:active={theme.maxWidth === 768}  onclick={() => { theme.maxWidth = 768;  debouncedSave() }}>中版</button>
            <button class:active={theme.maxWidth >= 1024} onclick={() => { theme.maxWidth = 1024; debouncedSave() }}>全寬</button>
          </div>
        </div>

        <div class="field">
          <label class="field-label">背景顏色</label>
          <input type="color" bind:value={theme.bgColor} oninput={debouncedSave} />
        </div>

        <div class="field">
          <label class="field-label">強調色</label>
          <input type="color" bind:value={theme.accentColor} oninput={debouncedSave} />
        </div>

        <div class="field">
          <label class="field-label">字型</label>
          <select bind:value={theme.fontFamily} onchange={debouncedSave}>
            <option value="system">系統字型</option>
            <option value="serif">襯線體</option>
            <option value="rounded">圓體</option>
          </select>
        </div>

        <label class="checkbox-label">
          <input type="checkbox" bind:checked={theme.supportBilingual} onchange={debouncedSave} />
          啟用繁中 / English 雙語
        </label>

        {#if theme.supportBilingual}
          <div class="field">
            <label class="field-label">預設語系</label>
            <select bind:value={theme.defaultLang} onchange={debouncedSave}>
              <option value="zh">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
        {/if}

      </div>
    {/if}

  </BottomSheet>

</div><!-- /page-root -->

<style>
/* ────────────────────────────────────────────────────
   根容器
──────────────────────────────────────────────────── */
.page-root {
  min-height: 100vh;
  position: relative;
  font-family: var(--font-body);
}

/* ────────────────────────────────────────────────────
   背景圖
──────────────────────────────────────────────────── */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  pointer-events: none;
}

/* ────────────────────────────────────────────────────
   編輯模式頂部 Bar
──────────────────────────────────────────────────── */
.edit-bar {
  position: sticky;
  top: 0;
  z-index: 200;
  height: 48px;
  background: var(--ink);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 2px solid var(--blue);
  font-family: var(--font-body);
}

.edit-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 2px 8px;
  background: var(--red);
  color: var(--white);
}

.edit-status {
  font-family: var(--font-mono);
  font-size: 11px;
  opacity: 0.6;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-dot.saving { background: var(--gold); }
.status-dot.saved  { background: #4ade80; }
.status-dot.idle   { background: rgba(255,255,255,.3); }

.edit-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 寬度控制 */
.width-control {
  display: flex;
  align-items: center;
  gap: 4px;
}
.width-label {
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: 0.5;
  margin-right: 4px;
}
.width-btn {
  width: 30px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.2);
  color: rgba(255,255,255,.6);
  cursor: pointer;
  transition: all .15s;
}
.width-btn:hover { background: rgba(255,255,255,.2); color: white; }
.width-btn.active { background: var(--blue); border-color: var(--blue); color: white; }

.btn-done {
  padding: 5px 16px;
  background: var(--white);
  color: var(--ink);
  border: none;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform .08s;
}
.btn-done:hover { transform: translate(-1px,-1px); }

/* ────────────────────────────────────────────────────
   頁面主容器
──────────────────────────────────────────────────── */
.page-inner {
  position: relative;
  z-index: 1;
  margin: 0 auto;
  padding: 0 16px 80px;
  transition: max-width .3s ease;
}

/* ────────────────────────────────────────────────────
   Hero
──────────────────────────────────────────────────── */
.hero {
  margin-bottom: 24px;
}

.hero-cover {
  height: 200px;
  overflow: hidden;
  position: relative;
  background: var(--blue);
  border: var(--border);
  border-top: none;
  margin: 0 -16px;
}

.hero-cover-empty {
  background: color-mix(in srgb, var(--blue) 20%, var(--cream));
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(.85);
}

.cover-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.cover-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,.4);
  cursor: pointer;
  padding: 0;
  transition: background .2s;
}
.cover-dot.active { background: var(--white); }

.hero-avatar-wrap {
  margin-top: -40px;
  padding-left: 16px;
}

.hero-avatar {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border: 3px solid var(--white);
  box-shadow: var(--shadow-md);
  background: var(--cream);
}

.hero-meta {
  padding: 12px 0 0;
}

.hero-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.hero-name {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  color: var(--ink);
  margin: 0;
  line-height: 1.1;
}

/* 開放狀態 badge */
.open-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: 1px solid currentColor;
  color: var(--ink);
  opacity: .5;
}
.open-badge.is-open {
  color: var(--blue);
  background: color-mix(in srgb, var(--blue) 8%, transparent);
  opacity: 1;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.hero-bio {
  font-size: .9rem;
  color: var(--ink);
  opacity: .7;
  line-height: 1.65;
  margin: 0 0 12px;
  max-width: 56ch;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.style-tag {
  padding: 2px 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  background: var(--white);
  border: 1px solid var(--ink);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
}

/* 雙語切換 */
.lang-toggle {
  display: inline-flex;
  border: 1px solid var(--ink);
  overflow: hidden;
}
.lang-btn {
  padding: 3px 12px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  background: var(--white);
  color: var(--ink);
  border: none;
  cursor: pointer;
  opacity: .45;
  transition: all .15s;
}
.lang-btn.active {
  background: var(--blue);
  color: var(--white);
  opacity: 1;
}

/* ────────────────────────────────────────────────────
   Block 列表
──────────────────────────────────────────────────── */
.block-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.block-row {
  /* BlockWrapper 在編輯模式下自己有 margin */
}

.block-row.hidden-block {
  opacity: .4;
}

/* 新增按鈕 */
.btn-add-block {
  width: 100%;
  margin-top: 8px;
  padding: 14px;
  border: 2px dashed color-mix(in srgb, var(--ink) 20%, transparent);
  background: transparent;
  color: color-mix(in srgb, var(--ink) 35%, transparent);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}
.btn-add-block:hover {
  border-color: var(--blue);
  color: var(--blue);
  border-style: solid;
}

/* ────────────────────────────────────────────────────
   FAB 編輯按鈕
──────────────────────────────────────────────────── */
.fab-edit {
  position: fixed;
  bottom: 24px;
  right: 20px;
  z-index: 100;
  width: 48px;
  height: 48px;
  border-radius: 0;
  background: var(--ink);
  color: var(--white);
  border: 2px solid var(--blue);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .1s, box-shadow .1s;
}
.fab-edit:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--blue);
}

/* ────────────────────────────────────────────────────
   Block Picker Modal
──────────────────────────────────────────────────── */
.picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: color-mix(in srgb, var(--ink) 65%, transparent);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.picker-modal {
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 520px;
  max-height: 75vh;
  overflow-y: auto;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: var(--border);
  position: sticky;
  top: 0;
  background: var(--white);
  z-index: 1;
}

.picker-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink);
  margin: 0;
}

.picker-close {
  background: none;
  border: 1px solid var(--ink);
  width: 28px;
  height: 28px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  transition: all .1s;
}
.picker-close:hover { background: var(--ink); color: var(--white); }

.picker-section {
  padding: 16px 20px;
}
.picker-section + .picker-section {
  border-top: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
}

.picker-section-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--ink);
  opacity: .4;
  margin-bottom: 10px;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform .08s, box-shadow .08s, background .08s;
  font-family: var(--font-body);
}
.picker-item:hover {
  transform: translate(-2px,-2px);
  box-shadow: var(--shadow-md);
  background: var(--blue);
  color: var(--white);
}

.picker-icon { font-size: 22px; }
.picker-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .06em;
  text-align: center;
}

/* ────────────────────────────────────────────────────
   Footer
──────────────────────────────────────────────────── */
.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0 0;
  border-top: var(--border);
  margin-top: 24px;
}

.footer-copy {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .1em;
  color: var(--ink);
  opacity: .4;
}

.footer-edit-btn {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--blue);
  background: none;
  border: 1px solid var(--blue);
  padding: 4px 12px;
  cursor: pointer;
  transition: all .1s;
}
.footer-edit-btn:hover { background: var(--blue); color: var(--white); }

/* ────────────────────────────────────────────────────
   BottomSheet 內 Settings
──────────────────────────────────────────────────── */
.settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--ink);
  opacity: .5;
}

.field input,
.field select,
.field textarea {
  padding: 9px 12px;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 14px;
  background: var(--white);
  color: var(--ink);
  width: 100%;
  outline: none;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  box-shadow: 0 0 0 2px var(--blue);
}

.field input[type="color"] {
  height: 44px;
  cursor: pointer;
  padding: 4px;
}

.choice-group {
  display: flex;
  gap: 6px;
}
.choice-group button {
  flex: 1;
  padding: 8px;
  border: var(--border);
  background: var(--white);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .08s;
}
.choice-group button.active {
  background: var(--blue);
  color: var(--white);
  border-color: var(--blue);
}

.plan-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  background: color-mix(in srgb, var(--ink) 2%, var(--white));
  margin-bottom: 8px;
}
.plan-card input,
.plan-card textarea {
  padding: 6px 10px;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 13px;
  background: var(--white);
  color: var(--ink);
  outline: none;
  width: 100%;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: var(--ink);
}

.empty-hint {
  text-align: center;
  padding: 48px 20px;
  font-style: italic;
  color: var(--ink);
  opacity: .4;
  font-size: 13px;
}

/* ────────────────────────────────────────────────────
   RWD
──────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .edit-bar { padding: 0 10px; }
  .width-control { display: none; }
  .picker-grid { grid-template-columns: repeat(3, 1fr); }
  .hero-cover { height: 160px; }
  .hero-avatar { width: 68px; height: 68px; }
  .hero-name { font-size: 1.5rem; }
}
</style>