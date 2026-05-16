<script lang="ts">
  import { marked } from 'marked'
  import type { GlobalDesign } from '$lib/components/editor/globalDesign'
  import type { CommissionType } from '$lib/db'

  type Block = { id: string; type: string; data: Record<string, any> }
  type StyleMap = {
    bgColor?: string; textColor?: string; borderColor?: string
    borderStyle?: string; borderWidth?: string; radius?: string; opacity?: number
  }

  interface Props {
    blocks: Block[]
    overrides?: Record<string, StyleMap>
    device?: 'mobile' | 'desktop'
    globalDesign?: GlobalDesign | null
    types?: CommissionType[]
    queueData?: { current: number; max: number }
  }

  let { blocks = [], overrides = {}, device = 'desktop', globalDesign = null, types = [], queueData }: Props = $props()

  function renderMd(text: string): string {
    return marked.parse(text ?? '', { async: false }) as string
  }

  const THEME = $derived<Required<StyleMap>>({
    bgColor:     globalDesign?.bgBlockColor  ?? 'var(--ink)',
    textColor:   globalDesign?.textColor     ?? '#ffffff',
    borderColor: globalDesign?.borderColor   ?? '#ffffff',
    borderStyle: globalDesign?.borderStyle   ?? 'double',
    borderWidth: globalDesign?.borderWidth   ?? '1px',
    radius:      globalDesign?.radius        ?? '32px',
    opacity:     globalDesign?.bgBlockOpacity ?? 55,
  })

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

  let dismissedNotices = $state<Set<string>>(new Set())
  let reactionCounts = $state<Record<string, number[]>>({})
  let reactionVoted = $state<Record<string, number | null>>({})

  $effect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('reaction_votes') ?? '{}')
      reactionVoted = saved
    } catch {}
    fetch('/api/reactions')
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, number[]>) => { reactionCounts = data })
      .catch(() => {})
  })

  function apiReaction(blockId: string, emojiIndex: number, delta: number) {
    fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_id: blockId, emoji_index: emojiIndex, delta }),
    })
      .then(r => r.ok ? r.json() : null)
      .then((res: { count: number } | null) => {
        if (res == null) return
        const updated = [...(reactionCounts[blockId] ?? [])]
        updated[emojiIndex] = res.count
        reactionCounts = { ...reactionCounts, [blockId]: updated }
      })
      .catch(() => {})
  }

  function voteReaction(blockId: string, idx: number, total: number) {
    const prev = reactionVoted[blockId] ?? null
    const counts = [...(reactionCounts[blockId] ?? Array.from({ length: total }, () => 0))]
    if (prev === idx) {
      counts[idx] = Math.max(0, counts[idx] - 1)
      reactionVoted = { ...reactionVoted, [blockId]: null }
      apiReaction(blockId, idx, -1)
    } else {
      if (prev !== null && prev < counts.length) {
        counts[prev] = Math.max(0, counts[prev] - 1)
        apiReaction(blockId, prev, -1)
      }
      counts[idx]++
      reactionVoted = { ...reactionVoted, [blockId]: idx }
      apiReaction(blockId, idx, 1)
    }
    reactionCounts = { ...reactionCounts, [blockId]: counts }
    try { localStorage.setItem('reaction_votes', JSON.stringify(reactionVoted)) } catch {}
  }

  function outerStyle(block: Block): string {
    if (block.type === 'spacer') return `height:${block.data.height ?? 32}px;padding:0;background:transparent;border:none;`
    if (block.type === 'divider') return `padding:${block.data.spacing ?? 16}px 0;background:transparent;border:none;`
    return blockBg(block.id)
  }
</script>

<div class="card-preview" class:mobile={device === 'mobile'}>
  {#each blocks as block (block.id)}
    <div class="block-wrap" style={outerStyle(block)} style:display={block.type === 'notice' && dismissedNotices.has(block.id) ? 'none' : undefined}>
      {#if block.type === 'avatar'}
        <img
          src={block.data.src}
          alt="avatar"
          class="avatar-frame"
          style={`border-radius: ${avR(block.id, block.data.shape)}`}
        />
      {:else if block.type === 'profile_name'}
        {@const nameSize = block.data.size === 'sm' ? '1.125rem' : block.data.size === 'base' ? '1.5rem' : block.data.size === 'xl' ? '2.5rem' : '1.875rem'}
        <div style="text-align:{block.data.align ?? 'center'};">
          <h1 class="profile-name" style="font-size:{nameSize};">{block.data.name}</h1>
        </div>
      {:else if block.type === 'section'}
        <div class="section-wrap">
          <div class="section-inner">
            <div class="section-line"></div>
            <div class="section-title">{block.data.title}</div>
            <div class="section-line"></div>
          </div>
        </div>
      {:else if block.type === 'image'}
        {@const imgW = block.data.width === '1/4' ? '25%' : block.data.width === '1/2' ? '50%' : block.data.width === '3/4' ? '75%' : '100%'}
        {@const imgJ = block.data.align === 'left' ? 'flex-start' : block.data.align === 'right' ? 'flex-end' : 'center'}
        <div style="display:flex;justify-content:{imgJ};">
          <img src={block.data.src} alt={block.data.alt ?? ''} style="width:{imgW};height:auto;object-fit:cover;border-radius:inherit;" />
        </div>
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
        <a href={block.data.url ?? '#'} class="btn-block" target="_blank" rel="noopener noreferrer">
          <div class="btn-icon">{block.data.icon}</div>
          <span class="btn-label">{block.data.label}</span>
        </a>
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
        <div class="text-block" style="text-align:{block.data.align ?? 'left'};font-size:{block.data.size==='sm'?'.75rem':block.data.size==='lg'?'1.125rem':block.data.size==='xl'?'1.25rem':'.875rem'};">
          {#if block.data.format === 'md'}
            {@html renderMd(block.data.content ?? '')}
          {:else}
            <p style="margin:0;line-height:1.625;">{block.data.content ?? ''}</p>
          {/if}
        </div>
      {:else if block.type === 'visitor'}
        <div class="visitor-block">
          <div class="visitor-label">{block.data.label ?? '訪客計數'}</div>
          <div class="visitor-count">{block.data.count ?? 0}</div>
        </div>
      {:else if block.type === 'commission'}
        <div class="commission-block">
          <div class="commission-title">委託項目</div>
          <div class="commission-list">
            {#if types.length > 0}
              {#each types as t, i}
                <div class="commission-row" style={i === types.length - 1 ? 'border-bottom:none;' : ''}>
                  <span>{t.name}</span>
                  <span>NT$ {t.base_price.toLocaleString()} 起</span>
                </div>
              {/each}
            {:else}
              <div class="commission-row" style="border-bottom:none;opacity:.5;justify-content:center;">
                <span>尚未設定委託項目</span>
              </div>
            {/if}
          </div>
        </div>
      {:else if block.type === 'queue'}
        {@const qMax = queueData?.max ?? block.data.max ?? 10}
        {@const qCur = queueData?.current ?? block.data.current ?? 0}
        <div class="queue-block">
          <div class="queue-label">{block.data.label ?? '排單進度'}</div>
          <div class="queue-count">{qCur} / {qMax}</div>
          <div class="queue-bar-track">
            <div class="queue-bar-fill" style="width:{(qCur / Math.max(qMax, 1)) * 100}%;"></div>
          </div>
          <div class="queue-remain">剩餘 {Math.max(qMax - qCur, 0)} 個名額</div>
        </div>
      {:else if block.type === 'notice'}
        <div class="notice-block notice-{block.data.type ?? 'info'}">
          <span class="notice-icon">{block.data.type === 'warn' ? '⚠' : block.data.type === 'error' ? '✕' : 'ℹ'}</span>
          <span class="notice-content">{block.data.content ?? ''}</span>
          {#if block.data.closeable !== false}
            <button class="notice-close" onclick={() => dismissedNotices = new Set([...dismissedNotices, block.id])}>✕</button>
          {/if}
        </div>

      {:else if block.type === 'social'}
        <div class="social-block">
          {#each (block.data.links ?? []) as link}
            <a href={link.url} class="social-link" target="_blank" rel="noopener noreferrer">{link.platform}</a>
          {/each}
        </div>

      {:else if block.type === 'faq'}
        <div class="faq-block">
          {#each (block.data.items ?? []) as item}
            <details class="faq-item">
              <summary class="faq-q">{item.q}</summary>
              <div class="faq-a">{item.a}</div>
            </details>
          {/each}
        </div>

      {:else if block.type === 'terms'}
        <div class="terms-block">
          <div class="terms-title">{block.data.title ?? '委託條款'}</div>
          <div class="terms-content">{@html renderMd(block.data.content ?? '')}</div>
        </div>

      {:else if block.type === 'pricing'}
        <div class="pricing-block">
          {#each (block.data.plans ?? []) as plan}
            <div class="pricing-plan" class:pricing-recommended={plan.recommended}>
              {#if plan.recommended}<span class="pricing-badge">推薦</span>{/if}
              <div class="pricing-name">{plan.name}</div>
              <div class="pricing-price">{plan.price}</div>
              <ul class="pricing-features">
                {#each (plan.features ?? []) as feat}
                  <li>{feat}</li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>

      {:else if block.type === 'reactions'}
        {@const emojis = block.data.emojis ?? []}
        {@const rcounts = reactionCounts[block.id] ?? emojis.map(() => 0)}
        <div class="reactions-block">
          {#each emojis as emoji, i}
            <button class="reaction-btn" class:reaction-voted={reactionVoted[block.id] === i}
              onclick={() => voteReaction(block.id, i, emojis.length)}>
              <span class="reaction-emoji">{emoji}</span>
              <span class="reaction-count">{rcounts[i] ?? 0}</span>
            </button>
          {/each}
        </div>

      {:else if block.type === 'divider'}
        <hr class="divider-line" style="border-top-width:{block.data.thickness ?? 1}px;border-top-style:{block.data.style ?? 'solid'};" />

      {:else if block.type === 'spacer'}

      {:else if block.type === 'columns'}
        {@const numCols = block.data.numCols ?? 2}
        {@const widths  = (block.data.widths ?? Array.from({ length: numCols }, () => 100 / numCols)) as number[]}
        {@const cols    = (block.data.cols   ?? Array.from({ length: numCols }, () => [])) as any[][]}
        <div class="columns-grid" style="grid-template-columns:{widths.map(w => `${w}fr`).join(' ')}">
          {#each cols as colBlocks}
            <div class="column-cell">
              {#each (colBlocks as any[]) as ib}
                {#if ib.type === 'text'}
                  <div class="text-block" style="font-size:{ib.data.size==='sm'?'.75rem':ib.data.size==='lg'?'1.125rem':ib.data.size==='xl'?'1.25rem':'.875rem'};text-align:{ib.data.align??'left'};padding:.5rem 0;">
                    {#if ib.data.format === 'md'}{@html renderMd(ib.data.content ?? '')}{:else}<p style="margin:0;line-height:1.625;">{ib.data.content ?? ''}</p>{/if}
                  </div>
                {:else if ib.type === 'image'}
                  <img src={ib.data.src} alt={ib.data.alt ?? ''} style="width:100%;height:auto;border-radius:8px;display:block;" />
                {:else if ib.type === 'section'}
                  <div class="section-inner" style="margin:.25rem 0;">
                    <div class="section-line"></div>
                    <div class="section-title">{ib.data.title ?? ''}</div>
                    <div class="section-line"></div>
                  </div>
                {:else if ib.type === 'divider'}
                  <div style="padding:{ib.data.spacing??8}px 0;"><hr style="border-top:{ib.data.thickness??1}px {ib.data.style??'solid'} currentColor;margin:0;opacity:0.3;" /></div>
                {:else if ib.type === 'button'}
                  <a href={ib.data.url ?? '#'} class="btn-block" target="_blank" rel="noopener noreferrer">
                    <span class="btn-icon">{ib.data.icon ?? '→'}</span>
                    <span class="btn-label">{ib.data.label}</span>
                  </a>
                {:else if ib.type === 'notice'}
                  <div class="notice-block notice-{ib.data.type ?? 'info'}">
                    <span class="notice-icon">{ib.data.type === 'warn' ? '⚠' : ib.data.type === 'error' ? '✕' : 'ℹ'}</span>
                    <span class="notice-content">{ib.data.content ?? ''}</span>
                  </div>
                {:else}
                  <div class="generic-block">{ICONS[ib.type] ?? '▢'} {ib.type}</div>
                {/if}
              {/each}
            </div>
          {/each}
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

  .notice-block { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; }
  .notice-info { background: rgba(59,130,246,.15); border-left: 3px solid #3b82f6; }
  .notice-warn { background: rgba(245,158,11,.15); border-left: 3px solid #f59e0b; }
  .notice-error { background: rgba(239,68,68,.15); border-left: 3px solid #ef4444; }
  .notice-icon { font-size: 1rem; flex-shrink: 0; }
  .notice-content { flex: 1; line-height: 1.5; }
  .notice-close { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; opacity: 0.6; font-size: 1rem; padding: 0; flex-shrink: 0; }
  .notice-close:hover { opacity: 1; }

  .social-block { display: flex; flex-wrap: wrap; gap: 0.625rem; justify-content: center; padding: 0.75rem; }
  .social-link { display: inline-block; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 700; background: rgba(255,255,255,.12); color: inherit; text-decoration: none; transition: background .15s; }
  .social-link:hover { background: rgba(255,255,255,.22); }

  .faq-block { display: flex; flex-direction: column; }
  .faq-item { border-bottom: 1px solid rgba(255,255,255,.15); }
  .faq-item:last-child { border-bottom: none; }
  .faq-q { font-weight: 700; font-size: 0.9rem; cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; }
  .faq-q::-webkit-details-marker { display: none; }
  .faq-q::after { content: '▾'; font-size: 0.75rem; opacity: 0.6; transition: transform 0.2s; }
  .faq-item[open] .faq-q::after { transform: rotate(180deg); }
  .faq-a { font-size: 0.85rem; line-height: 1.6; opacity: 0.85; padding: 0 0 0.75rem; }

  .terms-block { padding: 0.25rem 0; }
  .terms-title { font-weight: 900; font-size: 0.9rem; margin-bottom: 0.75rem; }
  .terms-content { font-size: 0.8rem; line-height: 1.7; opacity: 0.85; }
  .terms-content :global(p) { margin: 0.5em 0; }
  .terms-content :global(ul) { padding-left: 1.5em; margin: 0.5em 0; }
  .terms-content :global(ol) { padding-left: 1.5em; margin: 0.5em 0; }
  .terms-content :global(h1) { font-size: 0.9em; font-weight: 700; margin: 0.75em 0 0.25em; }
  .terms-content :global(h2) { font-size: 0.9em; font-weight: 700; margin: 0.75em 0 0.25em; }
  .terms-content :global(h3) { font-size: 0.9em; font-weight: 700; margin: 0.75em 0 0.25em; }

  .pricing-block { display: flex; flex-wrap: wrap; gap: 0.75rem; }
  .pricing-plan { flex: 1; min-width: 130px; padding: 1rem; border-radius: 0.875rem; background: rgba(255,255,255,.08); position: relative; }
  .pricing-recommended { background: rgba(255,255,255,.18); outline: 2px solid rgba(255,255,255,.4); }
  .pricing-badge { position: absolute; top: -0.5rem; right: 0.75rem; font-size: 0.65rem; font-weight: 900; background: white; color: black; padding: 0.15rem 0.5rem; border-radius: 99px; letter-spacing: 0.05em; }
  .pricing-name { font-weight: 900; font-size: 0.9rem; margin-bottom: 0.35rem; }
  .pricing-price { font-size: 1.125rem; font-weight: 900; margin-bottom: 0.5rem; }
  .pricing-features { font-size: 0.78rem; opacity: 0.8; padding-left: 1.25rem; margin: 0; display: flex; flex-direction: column; gap: 0.2rem; }

  .reactions-block { display: flex; flex-wrap: wrap; gap: 0.625rem; justify-content: center; padding: 0.5rem; }
  .reaction-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.875rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: inherit; cursor: pointer; font-family: inherit; transition: all .15s; }
  .reaction-btn:hover { background: rgba(255,255,255,.18); }
  .reaction-voted { background: rgba(255,255,255,.25); border-color: rgba(255,255,255,.5); }
  .reaction-emoji { font-size: 1.25rem; }
  .reaction-count { font-size: 0.8rem; font-weight: 700; font-variant-numeric: tabular-nums; }

  .divider-line { width: 100%; margin: 0; border: none; border-top: 1px solid currentColor; opacity: 0.3; }

  .columns-grid { display: grid; gap: 0.75rem; width: 100%; }
  .column-cell { display: flex; flex-direction: column; gap: 0.5rem; }
</style>
