<script lang="ts">
  import { enhance } from "$app/forms"
  import type { PageData } from "./$types"
  import { compressForUpload } from "$lib/utils/image-compress"

  let { data }: { data: PageData } = $props()

  const commission = $derived(data.commission)
  const revisions  = $derived(data.revisions as any[])
  const typeName   = $derived(data.typeName as string | null)
   const discussion = $derived(data.discussion as any)
   const messages   = $derived(data.messages as any[])

  /* ── ACS 8-stage mapping ── */
  type StageKey = 'unpaid'|'queued'|'sketch'|'sketch-review'|'lineart'|'color'|'final'|'delivered'

  const STAGE_LABELS: Record<StageKey, { zh: string; en: string }> = {
    'unpaid':        { zh: '待付款',   en: 'Unpaid' },
    'queued':        { zh: '排隊中',   en: 'Queued' },
    'sketch':        { zh: '草稿',     en: 'Sketch' },
    'sketch-review': { zh: '草稿審核', en: 'Sketch Review' },
    'lineart':       { zh: '線稿',     en: 'Lineart' },
    'color':         { zh: '上色',     en: 'Color' },
    'final':         { zh: '完稿',     en: 'Final' },
    'delivered':     { zh: '交付',     en: 'Delivered' },
  }

  function toStage(c: typeof commission): StageKey {
    if (c.status === 'accepted' && c.is_paid === 0) return 'unpaid'
    if (c.status === 'accepted' && c.is_paid === 1) return 'queued'
    if (c.status === 'in_progress') {
      if (c.sub_stage === 'lineart') return 'lineart'
      if (c.sub_stage === 'color')   return 'color'
      return 'sketch'
    }
    if (c.status === 'revision')  return 'sketch-review'
    if (c.status === 'completed') return 'final'
    if (c.status === 'delivered') return 'delivered'
    return 'queued'
  }

  /* Next stage advance mapping */
  function nextStageAction(stage: StageKey): { status: string; sub_stage?: string; label: string } | null {
    switch (stage) {
      case 'unpaid':        return { status: 'accepted', label: '確認付款' }
      case 'queued':        return { status: 'in_progress', sub_stage: 'sketch', label: '開始草稿' }
      case 'sketch':        return { status: 'revision', label: '送出草稿審核' }
      case 'sketch-review': return { status: 'in_progress', sub_stage: 'lineart', label: '確認草稿，開始線稿' }
      case 'lineart':       return { status: 'in_progress', sub_stage: 'color', label: '開始上色' }
      case 'color':         return { status: 'completed', label: '完稿' }
      case 'final':         return { status: 'delivered', label: '標記已交付' }
      default: return null
    }
  }

  function prevStageAction(stage: StageKey): { status: string; sub_stage?: string; label: string } | null {
    switch (stage) {
      case 'queued':        return { status: 'accepted', label: '返回待付款' }
      case 'sketch':        return { status: 'accepted', label: '返回排隊中' }
      case 'sketch-review': return { status: 'in_progress', sub_stage: 'sketch', label: '返回草稿階段' }
      case 'lineart':       return { status: 'revision', label: '返回草稿審核' }
      case 'color':         return { status: 'in_progress', sub_stage: 'lineart', label: '返回線稿階段' }
      case 'final':         return { status: 'in_progress', sub_stage: 'color', label: '返回上色階段' }
      case 'delivered':     return { status: 'completed', label: '返回完稿未交付' }
      default: return null
    }
  }

  /* 5-step progress display */
  const PROGRESS_STEPS = ['確認', '草稿', '線稿', '上色', '完稿']
  function stageToProgressIdx(stage: StageKey): number {
    if (stage === 'unpaid' || stage === 'queued') return 0
    if (stage === 'sketch' || stage === 'sketch-review') return 1
    if (stage === 'lineart') return 2
    if (stage === 'color')   return 3
    if (stage === 'final' || stage === 'delivered') return 4
    return 0
  }

  const stage       = $derived(toStage(commission))
  const progressIdx = $derived(stageToProgressIdx(stage))
  const nextAction  = $derived(nextStageAction(stage))
  const prevAction  = $derived(prevStageAction(stage))
  const latestRev   = $derived(revisions[revisions.length - 1] ?? null)

  /* Short CMS ID */
  const year   = $derived(new Date(commission.created_at * 1000).getFullYear())
  const shortId = $derived(commission.id.slice(0, 6).toUpperCase())
  const cmsId  = $derived(`CMS-${year}-${shortId}`)

  const unresolvedCount = $derived(
    revisions.flatMap(r => r.comments).filter((c: any) => c.is_resolved === 0 && c.author_role === 'client').length
  )

  const selectedOptions = $derived(JSON.parse(commission.selected_options || "[]"))

  function fmtDate(ts: number) {
    return new Date(ts * 1000).toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' })
  }

   function fmtTime(ts: number) {
     return new Date(ts * 1000).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
   }

  /* Delivery upload (fetch-based for signed URL) */
  let deliveryFile = $state<File | null>(null)
  let delivering   = $state(false)
  let deliveryUrl  = $state<string | null>(null)

  async function handleDeliver() {
    if (!deliveryFile) return
    if (!confirm("確定要上傳完稿並標記為已交付嗎？此動作會改變委託狀態。")) return
    delivering = true
    const fd = new FormData()
    fd.append("file", deliveryFile)
    const res = await fetch(`/api/delivery/${commission.id}`, { method: "POST", body: fd })
    delivering = false
    if (!res.ok) { alert("上傳失敗"); return }
    const { downloadUrl } = await res.json() as { downloadUrl: string }
    deliveryUrl = downloadUrl
  }

  function confirmSubmit(e: SubmitEvent, message: string) {
    if (!confirm(message)) e.preventDefault()
  }
</script>

<svelte:head>
  <title>{cmsId} · {commission.client_name}</title>
</svelte:head>

<div class="detail">

  <!-- ── Dark ACS Header ── -->
  <header class="det-header">
    <div class="det-header-left">
      <a href="/dashboard/queue" class="back-link">← 排單</a>
      <div class="det-id">{cmsId}</div>
      <div class="det-sub">
        <span>{commission.client_name}</span>
        <span class="sep">·</span>
        <span>{typeName ?? '—'}</span>
        <span class="sep">·</span>
        <span class="stage-chip">{STAGE_LABELS[stage].zh}</span>
      </div>
    </div>
    <div class="det-header-right">
      {#if unresolvedCount > 0}
        <span class="badge-unresolved">{unresolvedCount} 未解決</span>
      {/if}
      {#if commission.is_paid === 0}
        <form method="POST" action="?/markPaid" use:enhance onsubmit={(e) => confirmSubmit(e, '確定要標記為已收款嗎？')}>
          <button class="hdr-btn hdr-btn-pay">標記已收款</button>
        </form>
      {:else}
        <span class="badge-paid">✓ 已收款</span>
        <form method="POST" action="?/markUnpaid" use:enhance onsubmit={(e) => confirmSubmit(e, '確定要取消已收款狀態嗎？')}>
          <button class="hdr-btn">取消已收款</button>
        </form>
      {/if}
      <form method="POST" action="?/notifyRevision" use:enhance onsubmit={(e) => confirmSubmit(e, '確定要寄送審稿連結 Email 給委託人嗎？')}>
        <button class="hdr-btn">寄送審稿連結</button>
      </form>
    </div>
  </header>

  <!-- ── Body ── -->
  <div class="det-body">

    <!-- LEFT COLUMN -->
    <div class="det-left">

      <!-- CLIENT BRIEF -->
      <section class="det-block">
        <div class="block-head">CLIENT BRIEF</div>
        <div class="block-body">
          <div class="brief-grid">
            <div class="brief-row">
              <span class="brief-label">委託人</span>
              <span class="brief-val">{commission.client_name}</span>
            </div>
            <div class="brief-row">
              <span class="brief-label">Email</span>
              <a class="brief-val link" href="mailto:{commission.client_email}">{commission.client_email}</a>
            </div>
            <div class="brief-row">
              <span class="brief-label">類型</span>
              <span class="brief-val">{typeName ?? '—'}</span>
            </div>
            {#if selectedOptions.length > 0}
              <div class="brief-row">
                <span class="brief-label">加購</span>
                <span class="brief-val">{selectedOptions.map((o: any) => o.label).join('、')}</span>
              </div>
            {/if}
            <div class="brief-row">
              <span class="brief-label">金額</span>
              <span class="brief-val mono">NT$ {commission.estimated_price.toLocaleString()}</span>
            </div>
            {#if commission.due_date}
              <div class="brief-row">
                <span class="brief-label">截止日</span>
                <span class="brief-val mono">{commission.due_date}</span>
              </div>
            {/if}
          </div>
          {#if commission.detail}
            <div class="brief-detail">{commission.detail}</div>
          {/if}
        </div>
      </section>

      <!-- DRAFT VERSIONS -->
      <section class="det-block">
        <div class="block-head">
          <span>DRAFT VERSIONS</span>
          <label class="btn-sm" style="cursor:pointer">
            + 上傳版本
            <form method="POST" action="?/uploadRevision" enctype="multipart/form-data"
            use:enhance={async ({ formData }) => {
              const f = formData.get('file') as File | null
              if (f && f.size > 0) formData.set('file', await compressForUpload(f))
            }}>
              <input
                type="file"
                name="file"
                accept="image/*"
                style="display:none"
                onchange={e => e.currentTarget.form?.requestSubmit()}
              />
            </form>
          </label>
        </div>
        <div class="block-body">
          {#if revisions.length === 0}
            <p class="placeholder">尚未上傳任何草稿</p>
          {:else}
            <div class="versions-list">
              {#each revisions as rev, i}
                {@const isCurrent = i === revisions.length - 1}
                <div class="version-row" class:current={isCurrent}>
                  <div class="ver-left">
                    <span class="ver-num">V{rev.version_number}</span>
                    <span class="ver-date mono">{fmtDate(rev.uploaded_at)}</span>
                  </div>
                  <span class="ver-status" class:current={isCurrent}>
                    {isCurrent ? 'CURRENT' : 'SUPERSEDED'}
                  </span>
                  {#if isCurrent}
                    <div class="ver-thumb">
                      <img src={rev.image_url} alt="V{rev.version_number}" />
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </section>

      <!-- EMAIL LOG (stub) -->
      <section class="det-block">
        <div class="block-head">EMAIL LOG</div>
        <div class="block-body">
          <p class="placeholder">郵件記錄功能即將開放</p>
        </div>
      </section>

    </div>

    <!-- RIGHT COLUMN -->
    <div class="det-right">

      <!-- STATUS & PAYMENT -->
      <section class="det-block">
        <div class="block-head">STATUS &amp; PAYMENT</div>
        <div class="block-body">
          <div class="status-row">
            <span class="stage-pill" data-stage={stage}>{STAGE_LABELS[stage].zh} · {STAGE_LABELS[stage].en}</span>
            <span class="pay-badge" class:paid={commission.is_paid === 1}>
              {commission.is_paid === 1 ? '✓ 已付款' : '⚠ 未付款'}
            </span>
          </div>

          <!-- 5-step progress bar -->
          <div class="progress-bar">
            {#each PROGRESS_STEPS as step, i}
              <div class="prog-step" class:done={i <= progressIdx} class:active={i === progressIdx}>
                <div class="prog-dot"></div>
                <div class="prog-label">{step}</div>
              </div>
              {#if i < PROGRESS_STEPS.length - 1}
                <div class="prog-line" class:done={i < progressIdx}></div>
              {/if}
            {/each}
          </div>

          {#if nextAction || prevAction}
            <div class="stage-actions">
            {#if prevAction}
            <form method="POST" action="?/rollbackStage" use:enhance onsubmit={(e) => confirmSubmit(e, `確定要回退流程到「${prevAction.label.replace('返回', '')}」嗎？`)}>
              <input type="hidden" name="status"    value={prevAction.status} />
              <input type="hidden" name="sub_stage" value={prevAction.sub_stage ?? ''} />
              <button class="advance-btn" type="submit">← {prevAction.label}</button>
            </form>
            {/if}
            {#if nextAction}
            <form method="POST" action="?/advanceStage" use:enhance onsubmit={(e) => confirmSubmit(e, `確定要推進流程：${nextAction.label}？`)}>
              <input type="hidden" name="status"    value={nextAction.status} />
              <input type="hidden" name="sub_stage" value={nextAction.sub_stage ?? ''} />
              <button class="advance-btn">→ {nextAction.label}</button>
            </form>
            {/if}
            </div>
          {:else if stage === 'delivered'}
            <div class="delivered-badge">✓ 委託已完成交付</div>
          {/if}
        </div>
      </section>

      <!-- REVISION FEEDBACK -->
       <section class="det-block">
         <div class="block-head">QUEUE DISCUSSION ROOM</div>
         <div class="block-body">
           <div class="discussion-status">
             <span class="agree-pill" class:ok={discussion?.client_confirmed === 1}>委託人共識確認：{discussion?.client_confirmed === 1 ? '已確認' : '未確認'}</span>
             <span class="agree-pill" class:ok={discussion?.artist_confirmed === 1}>繪師共識確認：{discussion?.artist_confirmed === 1 ? '已確認' : '未確認'}</span>
           </div>

           <div class="cmp-grid">
             <div class="cmp-col">
               <div class="cmp-title">委託人填寫模板</div>
               <div class="cmp-box">{discussion?.client_template || '委託人尚未填寫模板。'}</div>
             </div>
             <div class="cmp-col">
               <div class="cmp-title">繪師整理重點</div>
               <form method="POST" action="?/updateDiscussion" use:enhance class="discussion-form" onsubmit={(e) => confirmSubmit(e, '確定儲存目前共識資訊嗎？')}>
                 <textarea name="artist_summary" rows="5" placeholder="整理需求重點：用途、尺寸、角色、截止日、交付格式、可修改次數...">{discussion?.artist_summary ?? ''}</textarea>
                 <textarea name="alignment_notes" rows="3" placeholder="共識比對：請列出雙方都已確認的項目">{discussion?.alignment_notes ?? ''}</textarea>
                 <label class="checkline">
                   <input type="checkbox" name="artist_confirmed" value="1" checked={discussion?.artist_confirmed === 1} />
                   我已確認上述內容可作為正式製作依據
                 </label>
                 <button class="btn-sm" type="submit">儲存共識資訊</button>
               </form>
             </div>
           </div>

           <div class="cmp-title" style="margin-top:0.8rem">聊天室（繪師傳訊息會寄信通知委託人）</div>
           <div class="msg-list">
             {#if messages.length === 0}
               <p class="placeholder">尚無訊息</p>
             {:else}
               {#each messages as msg}
                 <div class="msg-row" class:artist={msg.author_role === 'artist'}>
                   <div class="msg-meta">{msg.author_role === 'artist' ? '我' : '委託人'} · {fmtTime(msg.created_at)}</div>
                   <div class="msg-content">{msg.content}</div>
                 </div>
               {/each}
             {/if}
           </div>
           <form method="POST" action="?/sendDiscussionMessage" use:enhance class="reply-form" style="margin-top:0.65rem" onsubmit={(e) => confirmSubmit(e, '確定送出訊息並寄送 Email 通知給委託人嗎？')}>
             <input class="reply-input" type="text" name="content" placeholder="輸入訊息給委託人（送出後會寄信通知）" required />
             <button class="btn-sm">送出</button>
           </form>
         </div>
       </section>

      <section class="det-block">
        <div class="block-head">REVISION FEEDBACK</div>
        <div class="block-body">
          {#if !latestRev}
            <p class="placeholder">尚未上傳草稿</p>
          {:else}
            <div class="img-wrap">
              <img src={latestRev.image_url} alt="Latest draft" class="rev-img" />
              {#each latestRev.comments as comment}
                {#if comment.x_percent !== null && comment.y_percent !== null}
                  <div

                    class="dot"
                    class:resolved={comment.is_resolved === 1}
                    style="left:{comment.x_percent}%;top:{comment.y_percent}%"
                    title={comment.content}
                  ></div>
                {/if}
              {/each}
            </div>

            <div class="comments-list">
              {#each latestRev.comments as cm}
                <div class="cm-row" class:artist-cm={cm.author_role === 'artist'} class:resolved={cm.is_resolved === 1}>
                  <span class="cm-author">{cm.author_role === 'artist' ? '我' : '委託人'}</span>
                  <p class="cm-text">{cm.content}</p>
                  {#if cm.author_role === 'client' && cm.is_resolved === 0}
                    <form method="POST" action="?/resolveComment" use:enhance>
                      <input type="hidden" name="comment_id" value={cm.id} />
                      <button class="resolve-btn">標記已處理</button>
                    </form>
                  {/if}
                </div>
              {/each}
            </div>

            <form method="POST" action="?/addComment" use:enhance class="reply-form">
              <input type="hidden" name="version_id" value={latestRev.id} />
              <input class="reply-input" type="text" name="content" placeholder="新增留言…" required />
              <button class="btn-sm">送出</button>
            </form>
          {/if}
        </div>
      </section>

      <!-- FINAL DELIVERY -->
      <section class="det-block">
        <div class="block-head">FINAL DELIVERY</div>
        <div class="block-body">
          {#if commission.status === 'delivered' && commission.delivery_expires}
            <div class="delivered-done">
              ✓ 已交付。有效至 {new Date(commission.delivery_expires * 1000).toLocaleDateString('zh-TW')}
            </div>
          {:else}
            <label class="dropzone">
              <input
                type="file"
                accept="image/*,.zip,.psd,.clip"
                style="display:none"
                onchange={e => deliveryFile = (e.currentTarget as HTMLInputElement).files?.[0] ?? null}
              />
              <div class="dropzone-inner">
                {#if deliveryFile}
                  <span class="mono">{deliveryFile.name}</span>
                {:else}
                  <span>點擊選擇完稿檔案</span>
                  <span class="sub">image / zip / psd / clip</span>
                {/if}
              </div>
            </label>
            <button
              class="deliver-btn"
              onclick={handleDeliver}
              disabled={!deliveryFile || delivering}
            >
              {delivering ? '上傳中…' : '上傳完稿並標記已交付'}
            </button>
            {#if deliveryUrl}
              <div class="dl-box">
                <span class="mono">客戶下載連結：</span>
                <a href={deliveryUrl} class="dl-link mono" target="_blank">{deliveryUrl}</a>
                <button onclick={() => navigator.clipboard.writeText(deliveryUrl!)} class="copy-btn">複製</button>
              </div>
            {/if}
          {/if}
        </div>
      </section>

    </div>
  </div>
</div>

<style>
.detail {
  --hdr-bg:   #15162D;
  --hdr-c:    #ffffff;
  --gold:     #C9A84C;
  --blue:     #1F3FB8;
  --red:      #E33D2C;
  --ink:      #15162D;
  --paper:    #F5F1EA;
  --mono:     'JetBrains Mono', monospace;
  min-height: 100%;
}

/* ── Header ── */
.det-header {
  background: var(--hdr-bg);
  color: var(--hdr-c);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-bottom: 3px solid var(--blue);
}
.det-header-left { display: flex; flex-direction: column; gap: 0.25rem; }
.back-link {
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  margin-bottom: 0.25rem;
}
.back-link:hover { color: var(--gold); }
.det-id {
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--gold);
}
.det-sub {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.sep { color: rgba(255,255,255,0.3); }
.stage-chip {
  background: var(--blue);
  color: #fff;

  @media (max-width: 900px) {
    .shell { padding: 16px; gap: 16px; }
    .hero, .stage-grid, .info-grid, .panel-grid { grid-template-columns: 1fr; }
    .hero-actions, .cta-row, .toolbar { flex-wrap: wrap; }
    .panel, .hero, .section { padding: 16px; }
  }

  @media (max-width: 640px) {
    .hero-title { font-size: 1.5rem; }
    .hero-meta, .status-row { flex-direction: column; align-items: flex-start; }
    .stage-switch { grid-template-columns: 1fr; }
    .actions-row { flex-direction: column; }
    .actions-row .btn, .actions-row form { width: 100%; }
  }
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 2px 8px;
  letter-spacing: 0.06em;
}

.det-header-right { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.hdr-btn {
  padding: 0.4rem 0.9rem;
  background: rgba(255,255,255,0.08);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.1s;
}
.hdr-btn:hover { background: rgba(255,255,255,0.15); }
.hdr-btn-pay { background: var(--gold); color: var(--ink); border-color: var(--gold); }
.hdr-btn-pay:hover { background: #b8973f; }
.badge-unresolved {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--red);
  color: #fff;
  padding: 3px 10px;
}
.badge-paid {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #4ade80;
  padding: 3px 8px;
  border: 1px solid #4ade80;
}

/* ── Body layout ── */
.det-body {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 0;
  align-items: start;
}
@media (max-width: 900px) {
  .det-body { grid-template-columns: 1fr; }
}

/* ── Blocks ── */
.det-block {
  border-bottom: var(--border);
  border-right: var(--border);
}
.det-right .det-block { border-right: none; }

.block-head {
  background: var(--ink);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: var(--border);
}
.block-body { padding: 1rem 1.25rem; }

/* ── Brief ── */
.brief-grid { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.brief-row { display: flex; gap: 1rem; font-size: 0.875rem; }
.brief-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(21,22,45,0.5);
  width: 60px;
  flex-shrink: 0;
  padding-top: 1px;
}
.brief-val { color: var(--ink); }
.brief-val.link { color: var(--blue); text-decoration: none; }
.brief-val.link:hover { text-decoration: underline; }
.brief-val.mono { font-family: var(--font-mono); font-size: 13px; }
.brief-detail {
  font-size: 0.875rem;
  line-height: 1.65;
  white-space: pre-wrap;
  color: var(--ink);
  padding: 0.75rem;
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.08);
}

/* ── Versions ── */
.versions-list { display: flex; flex-direction: column; gap: 0; }
.version-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  flex-wrap: wrap;
}
.version-row:last-child { border-bottom: none; }
.ver-left { display: flex; align-items: center; gap: 0.6rem; }
.ver-num { font-family: var(--font-mono); font-size: 13px; font-weight: 700; }
.ver-date { font-size: 11px; color: rgba(0,0,0,0.45); }
.ver-status {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(0,0,0,0.35);
  margin-left: auto;
}
.ver-status.current { color: var(--blue); }
.ver-thumb { width: 100%; margin-top: 0.5rem; }
.ver-thumb img { width: 100%; max-height: 200px; object-fit: cover; border: var(--border); }

/* ── Status & Payment ── */
.status-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.stage-pill {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  background: var(--blue);
  color: #fff;
  letter-spacing: 0.05em;
}
.pay-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid rgba(227,61,44,0.4);
  color: var(--red);
}
.pay-badge.paid { border-color: #4ade80; color: #16a34a; }

/* 5-step progress */
.progress-bar {
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
}
.prog-step { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.prog-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.2);
  background: transparent;
}
.prog-step.done .prog-dot { background: var(--blue); border-color: var(--blue); }
.prog-step.active .prog-dot { background: var(--blue); border-color: var(--blue); box-shadow: 0 0 0 3px rgba(31,63,184,0.25); }
.prog-label { font-family: var(--font-mono); font-size: 9px; color: rgba(0,0,0,0.4); }
.prog-step.done .prog-label, .prog-step.active .prog-label { color: var(--blue); font-weight: 700; }
.prog-line {
  flex: 1;
  height: 2px;
  background: rgba(0,0,0,0.1);
  margin-bottom: 14px;
}
.prog-line.done { background: var(--blue); }

.advance-btn {
  width: 100%;
  padding: 0.65rem;
  background: var(--blue);
  color: #fff;
  border: none;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(0,0,0,0.15);
  transition: transform 0.08s, box-shadow 0.08s;
}
.advance-btn:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 rgba(0,0,0,0.15); }
.delivered-badge {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #16a34a;
  font-weight: 700;
  text-align: center;
  padding: 0.5rem;
  border: 1px solid #4ade80;
}

/* ── Comments ── */
.img-wrap { position: relative; margin-bottom: 0.75rem; }
.rev-img { width: 100%; display: block; border: var(--border); }
.dot {
  position: absolute;
  width: 10px; height: 10px;
  background: var(--red);
  border: 1.5px solid #fff;
  border-radius: 50%;
  transform: translate(-50%,-50%);
}
.dot.resolved { background: #4ade80; opacity: 0.7; }

.comments-list { display: flex; flex-direction: column; gap: 0; margin-bottom: 0.75rem; }
.cm-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  font-size: 0.85rem;
}
.cm-row:last-child { border-bottom: none; }
.cm-row.resolved { opacity: 0.5; }
.cm-author { font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: rgba(0,0,0,0.4); display: block; margin-bottom: 2px; }
.cm-row.artist-cm .cm-author { color: var(--blue); }
.cm-text { margin: 0 0 4px; }
.resolve-btn {
  font-size: 10px;
  font-family: var(--font-mono);
  padding: 2px 6px;
  background: none;
  border: 1px solid rgba(0,0,0,0.2);
  cursor: pointer;
  color: rgba(0,0,0,0.5);
}
.resolve-btn:hover { border-color: var(--ink); color: var(--ink); }

.reply-form { display: flex; gap: 0.5rem; }
.reply-input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: var(--border);
  font-size: 0.85rem;
  font-family: var(--font-body);
}

/* ── Delivery ── */
.dropzone {
  display: block;
  border: 2px dashed rgba(0,0,0,0.15);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  margin-bottom: 0.75rem;
  transition: border-color 0.1s;
}
.dropzone:hover { border-color: var(--blue); }
.dropzone-inner { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; color: rgba(0,0,0,0.5); }
.dropzone-inner .sub { font-size: 11px; color: rgba(0,0,0,0.3); }
.deliver-btn {
  width: 100%;
  padding: 0.65rem;
  background: var(--ink);
  color: #fff;
  border: var(--border);
  font-family: var(--font-body);
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.08s;
}
.deliver-btn:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: var(--shadow-md); }
.deliver-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.delivered-done { font-family: var(--font-mono); font-size: 12px; color: #16a34a; font-weight: 700; }
.dl-box {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--ink);
  color: #fff;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}
.dl-link { color: var(--gold); word-break: break-all; flex: 1; text-decoration: none; font-size: 12px; }
.copy-btn {
  padding: 2px 8px;
  background: none;
  border: 1px solid var(--gold);
  color: var(--gold);
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
}
.copy-btn:hover { background: var(--gold); color: var(--ink); }

/* ── Utils ── */
.btn-sm {
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 3px 10px;
  background: none;
  border: 1px solid rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.8);
  cursor: pointer;
}
.btn-sm:hover { border-color: rgba(255,255,255,0.7); color: #fff; }
.mono { font-family: var(--font-mono); }
.placeholder { font-size: 0.85rem; color: rgba(0,0,0,0.35); text-align: center; padding: 1.5rem 0; margin: 0; }
</style>
