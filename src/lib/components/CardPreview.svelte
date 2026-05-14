<script lang="ts">
  type Block = { id: string; type: string; data: Record<string, any> }
  type StyleMap = {
    bgColor?: string; textColor?: string; borderColor?: string
    borderStyle?: string; borderWidth?: string; radius?: string; opacity?: number
  }

  interface Props {
    blocks: Block[]
    overrides?: Record<string, StyleMap>
    device?: 'mobile' | 'desktop'
  }

  let { blocks = [], overrides = {}, device = 'desktop' }: Props = $props()

  const THEME: Required<StyleMap> = {
    bgColor: 'var(--ink)',
    textColor: '#ffffff',
    borderColor: '#ffffff',
    borderStyle: 'double',
    borderWidth: '1px',
    radius: '32px',
    opacity: 55,
  }

  function S(id: string): Required<StyleMap> {
    return { ...THEME, ...(overrides[id] ?? {}) } as Required<StyleMap>
  }

  function mix(c: string, pct: number) {
    return `color-mix(in srgb, ${c} ${pct}%, transparent)`
  }

  function blockBg(id: string) {
    const s = S(id)
    return `background-color:${mix(s.bgColor, s.opacity)};border-color:${s.borderColor};border-width:${s.borderWidth};border-style:${s.borderStyle};border-radius:${s.radius};color:${s.textColor};`
  }

  function avR(id: string, shape: string) {
    return shape === 'circle' ? '50%' : `calc(${S(id).radius} - 8px)`
  }

  function calcCD(targetDate: string) {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return null
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }

  const ICONS: Record<string, string> = {
    avatar: '👤', profile_name: '名', section: '#', image: '🖼', gallery: '⊞',
    tags: '⊙', button: '→', countdown: '⏱', anon_box: '✉', text: 'T',
    visitor: '👁', commission: '📄', queue: '≡'
  }

  // anon_box submission state keyed by block id
  let anonText = $state<Record<string, string>>({})
  let anonSent = $state<Record<string, boolean>>({})
  let anonBusy = $state<Record<string, boolean>>({})

  async function submitAnon(blockId: string) {
    const content = (anonText[blockId] ?? '').trim()
    if (!content || anonBusy[blockId]) return
    anonBusy = { ...anonBusy, [blockId]: true }
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_id: blockId, content }),
      })
      if (res.ok) {
        anonSent = { ...anonSent, [blockId]: true }
        anonText = { ...anonText, [blockId]: '' }
      }
    } finally {
      anonBusy = { ...anonBusy, [blockId]: false }
    }
  }
</script>

<div class="card-preview" class:mobile={device === 'mobile'}>
  {#each blocks as block (block.id)}
    <div class="block-wrap" style={blockBg(block.id)}>
      {#if block.type === 'avatar'}
        <img
          src={block.data.src}
          alt="avatar"
          class="avatar-frame"
          style={`border-radius: ${avR(block.id, block.data.shape)}`}
        />
      {:else if block.type === 'profile_name'}
        <h1 class="profile-name">{block.data.name}</h1>
      {:else if block.type === 'section'}
        <div class="section-wrap">
          <div class="section-inner">
            <div class="section-line"></div>
            <div class="section-title">{block.data.title}</div>
            <div class="section-line"></div>
          </div>
        </div>
      {:else if block.type === 'image'}
        <img src={block.data.src} alt={block.data.alt} style="width: 100%; height: auto; border-radius: inherit;" />
      {:else if block.type === 'gallery'}
        <div class="gallery-grid" style={`grid-template-columns: repeat(${block.data.cols}, 1fr)`}>
          {#each block.data.images as img}
            <img src={img} alt="gallery" style="width: 100%; height: auto; border-radius: 0.5rem;" />
          {/each}
        </div>
      {:else if block.type === 'tags'}
        <div class="tags-wrap">
          {#each block.data.tags as tag}
            <span class="tag-pill">{tag}</span>
          {/each}
        </div>
      {:else if block.type === 'button'}
        <button class="btn-block">
          <div class="btn-icon">{block.data.icon}</div>
          <span class="btn-label">{block.data.label}</span>
        </button>
      {:else if block.type === 'countdown'}
        {@const cd = calcCD(block.data.targetDate)}
        <div class="cd-block">
          <div class="cd-label">{block.data.label}</div>
          <div class="cd-numbers">
            {#if cd}
              <span class="cd-num">{cd.d}</span><span class="cd-unit">天</span>
              <span class="cd-num">{cd.h}</span><span class="cd-unit">時</span>
              <span class="cd-num">{cd.m}</span><span class="cd-unit">分</span>
              <span class="cd-num">{cd.s}</span><span class="cd-unit">秒</span>
            {:else}
              <span style="font-size: 0.875rem; opacity: 0.7;">時間已到</span>
            {/if}
          </div>
        </div>
      {:else if block.type === 'anon_box'}
        <div class="anon-block">
          <div class="anon-title">
            <span>{block.data.title}</span>
          </div>
          {#if anonSent[block.id]}
            <div class="anon-sent">已送出，感謝你的留言 ✦</div>
            <button class="anon-submit" onclick={() => anonSent = { ...anonSent, [block.id]: false }}>再送一則</button>
          {:else}
            <textarea
              class="anon-textarea"
              placeholder={block.data.placeholder}
              maxlength="500"
              value={anonText[block.id] ?? ''}
              oninput={(e) => anonText = { ...anonText, [block.id]: (e.target as HTMLTextAreaElement).value }}
            ></textarea>
            <button class="anon-submit" disabled={anonBusy[block.id] || !(anonText[block.id] ?? '').trim()}
              onclick={() => submitAnon(block.id)}>
              {anonBusy[block.id] ? '送出中…' : '送出'}
            </button>
          {/if}
        </div>
      {:else if block.type === 'text'}
        <div class="text-block">
          <p>{block.data.text}</p>
        </div>
      {:else if block.type === 'visitor'}
        <div class="visitor-block">
          <div class="visitor-label">訪客計數</div>
          <div class="visitor-count">42</div>
        </div>
      {:else if block.type === 'commission'}
        <div class="commission-block">
          <div class="commission-title">委託項目</div>
          <div class="commission-list">
            <div class="commission-row">
              <span>基本方案</span>
              <span>洽詢</span>
            </div>
            <div class="commission-row">
              <span>加急方案</span>
              <span>洽詢</span>
            </div>
          </div>
        </div>
      {:else if block.type === 'queue'}
        <div class="queue-block">
          <div class="queue-label">排單進度</div>
          <div class="queue-count">2/5</div>
          <div class="queue-bar-track">
            <div class="queue-bar-fill" style="width: 40%;"></div>
          </div>
          <div class="queue-remain">還有 3 個位置</div>
        </div>
      {:else}
        <div class="generic-block">{ICONS[block.type] ?? '▢'} {block.type}</div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .card-preview {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }

  .card-preview.mobile {
    max-width: 480px;
    margin: 0 auto;
  }

  .block-wrap {
    border-radius: 2.25rem;
    padding: 1.25rem;
    width: 100%;
  }

  .avatar-frame {
    width: 8rem;
    height: 8rem;
    margin: 0 auto;
    overflow: hidden;
    display: block;
  }

  .profile-name {
    font-size: 1.875rem;
    font-weight: 900;
    letter-spacing: -0.025em;
    line-height: 1.2;
    word-break: break-all;
    margin: 0;
  }

  .section-wrap { padding: 0.25rem 0; }
  .section-inner { display: flex; align-items: center; gap: 0.75rem; padding: 0 0.75rem; }
  .section-line { flex: 1; border-top: 1px solid; opacity: 0.5; }
  .section-title { padding: 0 0.5rem; font-size: 0.6875rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }

  .gallery-grid { display: grid; gap: 0.5rem; width: 100%; }

  .tags-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
  .tag-pill { display: inline-flex; align-items: center; font-weight: 500; font-size: 0.875rem; padding: 0.5rem 1rem; }

  .btn-block { width: 100%; padding: 1.25rem; display: flex; align-items: center; justify-content: center; gap: 1rem; border: none; cursor: pointer; font-family: inherit; background: transparent; color: inherit; }
  .btn-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.875rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
  .btn-label { font-size: 1rem; font-weight: 900; }

  .cd-block { width: 100%; padding: 1.25rem; font-weight: 700; text-align: center; }
  .cd-label { font-size: 0.875rem; opacity: 0.7; margin-bottom: 0.75rem; }
  .cd-numbers { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; justify-content: center; }
  .cd-num { font-size: 1.25rem; font-variant-numeric: tabular-nums; }
  .cd-unit { font-size: 0.875rem; opacity: 0.7; margin-left: 0.25rem; margin-right: 0.75rem; }

  .anon-block { width: 100%; padding: 2rem; text-align: center; }
  .anon-title { font-weight: 900; font-size: 1rem; margin-bottom: 1rem; }
  .anon-textarea { width: 100%; border-radius: 0.875rem; padding: 0.75rem 1rem; font-size: 0.875rem; text-align: left; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.08); color: inherit; font-family: inherit; resize: none; min-height: 6rem; outline: none; }
  .anon-textarea::placeholder { opacity: 0.5; }
  .anon-textarea:focus { border-color: rgba(255,255,255,.6); }
  .anon-submit { margin-top: 0.875rem; width: 100%; border-radius: 0.875rem; padding: 0.75rem; font-size: 0.875rem; font-weight: 700; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.12); color: inherit; cursor: pointer; font-family: inherit; transition: background .15s; }
  .anon-submit:hover:not(:disabled) { background: rgba(255,255,255,.22); }
  .anon-submit:disabled { opacity: 0.45; cursor: not-allowed; }
  .anon-sent { font-size: 0.875rem; opacity: 0.8; padding: 1rem 0; font-weight: 700; }

  .text-block { padding: 1.25rem; text-align: center; }
  .text-block p { margin: 0; line-height: 1.625; }

  .visitor-block { width: 100%; padding: 1.25rem; text-align: center; font-weight: 700; }
  .visitor-label { font-size: 0.875rem; opacity: 0.7; margin-bottom: 0.25rem; }
  .visitor-count { font-size: 1.5rem; font-weight: 900; }

  .commission-block { width: 100%; padding: 1.25rem; }
  .commission-title { font-size: 0.875rem; font-weight: 900; margin-bottom: 0.75rem; }
  .commission-list { display: flex; flex-direction: column; gap: 0.25rem; }
  .commission-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,.2); font-size: 0.875rem; }
  .commission-row span:last-child { font-weight: 900; }

  .queue-block { width: 100%; padding: 1.25rem; text-align: center; }
  .queue-label { font-size: 0.75rem; font-weight: 700; opacity: 0.7; margin-bottom: 0.5rem; }
  .queue-count { font-size: 1.5rem; font-weight: 900; margin-bottom: 0.75rem; }
  .queue-bar-track { height: 0.5rem; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,.2); }
  .queue-bar-fill { height: 100%; border-radius: 999px; background: rgba(255,255,255,.8); }
  .queue-remain { font-size: 0.75rem; opacity: 0.6; margin-top: 0.5rem; }

  .generic-block { padding: 1.25rem; text-align: center; font-size: 0.875rem; opacity: 0.6; }
</style>
