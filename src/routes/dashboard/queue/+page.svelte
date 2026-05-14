<script lang="ts">
  import { enhance } from "$app/forms"
  import type { PageData } from "./$types"
  import type { Commission } from "$lib/db"

  let { data }: { data: PageData } = $props()

  /* ── stage config ── */
  type StageKey = 'unpaid'|'queued'|'sketch'|'sketch-review'|'lineart'|'color'|'final'|'delivered'|'cancelled'

  const STAGE_LABELS: Record<StageKey, { zh: string; en: string }> = {
    'unpaid':        { zh: '待付款',   en: 'Unpaid' },
    'queued':        { zh: '排隊中',   en: 'Queued' },
    'sketch':        { zh: '草稿',     en: 'Sketch' },
    'sketch-review': { zh: '草稿審核', en: 'Sketch Review' },
    'lineart':       { zh: '線稿',     en: 'Lineart' },
    'color':         { zh: '上色',     en: 'Color' },
    'final':         { zh: '完稿',     en: 'Final' },
    'delivered':     { zh: '交付',     en: 'Delivered' },
    'cancelled':     { zh: '已取消',   en: 'Cancelled' },
  }
  const STAGES = Object.keys(STAGE_LABELS) as StageKey[]

  const STAGE_COLORS: Record<StageKey, string> = {
    'unpaid':        '#9A9085',
    'queued':        '#7A6A4F',
    'sketch':        '#3F4A2F',
    'sketch-review': '#B84A2E',
    'lineart':       '#2E4761',
    'color':         '#5A2F4A',
    'final':         '#3B342D',
    'delivered':     '#4F7A4A',
    'cancelled':     '#7A2C2C',
  }

  /* ── map DB commission to ACS stage ── */
  function toStage(c: Commission): StageKey {
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
    if (c.status === 'cancelled') return 'cancelled'
    return 'queued'
  }

  /* ── next DB status for "advance" ── */
  function nextStatus(c: Commission): { status: string; sub_stage?: string } | null {
    const stage = toStage(c)
    switch (stage) {
      case 'queued':        return { status: 'in_progress', sub_stage: 'sketch' }
      case 'sketch':        return { status: 'revision' }
      case 'sketch-review': return { status: 'in_progress', sub_stage: 'lineart' }
      case 'lineart':       return { status: 'in_progress', sub_stage: 'color' }
      case 'color':         return { status: 'completed' }
      case 'final':         return { status: 'delivered' }
      default: return null
    }
  }

  /* ── stats ── */
  const stats = $derived.by(() => {
    const q = data.commissions
    return {
      total:   q.length,
      active:  q.filter(c => c.status !== 'delivered').length,
      waiting: q.filter(c => c.is_waiting === 1).length,
      review:  q.filter(c => c.status === 'revision').length,
      revenue: q.reduce((s, c) => s + (c.estimated_price ?? 0), 0),
    }
  })

  /* ── filter ── */
  type Filter = 'all'|'active'|'waiting'|'done'|'cancelled'
  let filter = $state<Filter>('all')
  let view   = $state<'board'|'list'>('list')
  let batchDeleteMode = $state(false)
  let selectedCancelledIds = $state<string[]>([])

  const filtered = $derived.by(() => {
    const q = data.commissions
    if (filter === 'waiting') return q.filter(c => c.is_waiting === 1)
    if (filter === 'active')  return q.filter(c => c.status !== 'delivered')
    if (filter === 'done')    return q.filter(c => c.status === 'delivered')
    if (filter === 'cancelled') return q.filter(c => c.status === 'cancelled')
    return q
  })

  const cancelledCount = $derived(data.commissions.filter(c => c.status === 'cancelled').length)

  function toggleCancelledPick(id: string, checked: boolean) {
    if (checked) {
      if (!selectedCancelledIds.includes(id)) selectedCancelledIds = [...selectedCancelledIds, id]
      return
    }
    selectedCancelledIds = selectedCancelledIds.filter((v) => v !== id)
  }

  function clearBatchSelection() {
    selectedCancelledIds = []
    batchDeleteMode = false
  }

  /* ── board grouping ── */
  const grouped = $derived(
    STAGES.map(s => ({
      stage: s,
      items: filtered.filter(c => toStage(c) === s),
    }))
  )

  /* ── date formatting ── */
  function fmtDate(ts: number) {
    return new Date(ts * 1000).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
  }

  /* ── list inline edit ── */
  type EditableC = Commission & { type_name: string | null }

  let editingId = $state<string | null>(null)
  let editName  = $state('')
  let editEmail = $state('')
  let editPrice = $state(0)
  let editStage = $state<StageKey>('queued')
  let editDue   = $state('')
  let editWait  = $state(false)
  let editFormEl: HTMLFormElement

  function startEdit(c: EditableC) {
    editingId = c.id
    editName  = c.client_name
    editEmail = c.client_email
    editPrice = c.estimated_price
    editStage = toStage(c)
    editDue   = c.due_date ?? ''
    editWait  = c.is_waiting === 1
  }
  function cancelEdit() { editingId = null }
  function commitEdit() { editFormEl.requestSubmit(); editingId = null }

  function formatRevenue(n: number) {
    return 'NT$ ' + n.toLocaleString()
  }

  function confirmSubmit(e: SubmitEvent, message: string) {
    if (!confirm(message)) e.preventDefault()
  }
</script>

<div class="queue">

  <!-- ── Header ── -->
  <header class="queue-head">
    <div class="queue-head-left">
      <div class="queue-head-title">
        <span class="eyebrow">Queue Dashboard</span>
        <h1>排單面板</h1>
      </div>
      <div class="queue-stats">
        <div class="q-stat">
          <div class="q-stat-v">{stats.active}</div>
          <div class="q-stat-l">進行中 Active</div>
        </div>
        <div class="q-stat" class:hot={stats.waiting > 0}>
          <div class="q-stat-v">{stats.waiting}</div>
          <div class="q-stat-l">等待回覆 Waiting</div>
        </div>
        <div class="q-stat" class:hot={stats.review > 0}>
          <div class="q-stat-v">{stats.review}</div>
          <div class="q-stat-l">待審核 Review</div>
        </div>
        <div class="q-stat">
          <div class="q-stat-v">{formatRevenue(stats.revenue)}</div>
          <div class="q-stat-l">本月委託總額</div>
        </div>
      </div>
    </div>
    <div class="queue-head-actions">
      <div class="segmented">
        {#each [['board','Board'],['list','List']] as [k,l]}
          <button class:active={view === k} onclick={() => view = k as 'board'|'list'}>{l}</button>
        {/each}
      </div>
    </div>
  </header>

  <!-- ── Filters ── -->
  <div class="queue-filters">
    {#each [
      ['all',     '全部 All',           data.commissions.length],
      ['active',  '進行中 Active',       stats.active],
      ['waiting', '等待回覆 Waiting',    stats.waiting],
      ['done',    '已交付 Delivered',    data.commissions.filter(c => c.status === 'delivered').length],
      ['cancelled', '已取消 Cancelled',  cancelledCount],
    ] as [k,l,n]}
      <button
        class="queue-filter"
        class:active={filter === k}
        onclick={() => {
          filter = k as Filter
          if (k !== 'cancelled') clearBatchSelection()
        }}
      >{l} <span class="num">{n}</span></button>
    {/each}
  </div>

  {#if view === 'list' && filter === 'cancelled' && cancelledCount > 0}
    <div class="batch-toolbar">
      <button class="btn" onclick={() => {
        batchDeleteMode = !batchDeleteMode
        if (!batchDeleteMode) selectedCancelledIds = []
      }}>
        {batchDeleteMode ? '結束批次刪除' : '進入批次刪除'}
      </button>

      {#if batchDeleteMode}
        <span class="batch-count">已選取 {selectedCancelledIds.length} 筆</span>
        <form method="POST" action="?/batchDeleteCancelled" use:enhance onsubmit={(e) => confirmSubmit(e, `確定永久刪除 ${selectedCancelledIds.length} 筆已取消委託嗎？此動作無法復原。`)}>
          <input type="hidden" name="ids" value={selectedCancelledIds.join(',')} />
          <button class="btn danger" disabled={selectedCancelledIds.length === 0}>批次刪除</button>
        </form>
      {/if}
    </div>
  {/if}

  <!-- hidden form for inline list edit -->
  <form method="POST" action="?/updateRow" use:enhance bind:this={editFormEl} style="display:none" onsubmit={(e) => confirmSubmit(e, '確定要儲存這筆委託變更嗎？')}>
    <input type="hidden" name="id"              value={editingId ?? ''} />
    <input type="hidden" name="client_name"     value={editName} />
    <input type="hidden" name="client_email"    value={editEmail} />
    <input type="hidden" name="estimated_price" value={editPrice} />
    <input type="hidden" name="stage"           value={editStage} />
    <input type="hidden" name="due_date"        value={editDue} />
    <input type="hidden" name="is_waiting"      value={editWait ? '1' : '0'} />
  </form>

  <!-- ── Board view ── -->
  {#if view === 'board'}
    <div class="board-scroll">
      <div class="board">
        {#each grouped as g}
          <div class="board-col">
            <header class="board-col-head">
              <div>
                <div class="board-col-zh">{STAGE_LABELS[g.stage].zh}</div>
                <div class="board-col-en">{STAGE_LABELS[g.stage].en}</div>
              </div>
              <span class="board-col-count">{g.items.length}</span>
            </header>
            <div class="board-col-body">
              {#each g.items as c (c.id)}
                {@const stage = toStage(c)}
                {@const stageIdx = STAGES.indexOf(stage)}
                {@const next = nextStatus(c)}
                <div class="qcard" class:waiting={c.is_waiting === 1}>
                  <header class="qcard-head">
                    <div class="qcard-client">
                      <div class="qcard-avatar">{c.client_name[0]}</div>
                      <div>
                        <div class="qcard-name">{c.client_name}</div>
                        <div class="qcard-handle">{c.client_email}</div>
                      </div>
                    </div>
                    {#if c.is_waiting === 1}
                      <span class="qcard-waiting" title="等待委託人回覆">●</span>
                    {/if}
                  </header>

                  <div class="qcard-body">
                    <div class="qcard-row">
                      <span class="qcard-item">{(c as any).type_name ?? '—'}</span>
                      <span class="qcard-amount">NT$ {(c.estimated_price ?? 0).toLocaleString()}</span>
                    </div>
                    {#if c.detail}
                      <div class="qcard-char">{c.detail.slice(0, 40)}{c.detail.length > 40 ? '…' : ''}</div>
                    {/if}
                  </div>

                  <!-- Stage progress -->
                  <div class="stage-progress" title={STAGE_LABELS[stage].zh}>
                    {#each STAGES as s, i}
                      <div
                        class="stage-tick"
                        class:done={i <= stageIdx}
                        class:active={i === stageIdx}
                        style="--c: {STAGE_COLORS[s]}"
                      ></div>
                    {/each}
                  </div>

                  <div class="qcard-meta">
                    <span class="qcard-due">
                      <span class="dim">建立</span> {fmtDate(c.created_at)}
                    </span>
                    {#if c.due_date}
                      <span class="qcard-due"><span class="dim">due</span> {c.due_date}</span>
                    {/if}
                  </div>

                  <footer class="qcard-actions" role="group">
                    {#if stage === 'unpaid'}
                      <form method="POST" action="?/markPaid" use:enhance onsubmit={(e) => confirmSubmit(e, '確定標記此委託為已付款嗎？')}>
                        <input type="hidden" name="id" value={c.id} />
                        <button class="btn primary">標記已付款</button>
                      </form>
                      <form method="POST" action="?/toggleWaiting" use:enhance onsubmit={(e) => confirmSubmit(e, c.is_waiting ? '確定取消等待回覆旗標嗎？' : '確定標記為等待回覆嗎？')}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="current" value={c.is_waiting} />
                        <button class="btn">{c.is_waiting ? '取消等待' : '等待中'}</button>
                      </form>
                    {:else if stage === 'sketch-review'}
                      <a class="btn accent breathe" href="/dashboard/commission/{c.id}">🔵 開啟 Review Room</a>
                    {:else if stage === 'sketch'}
                      <a class="btn primary" href="/dashboard/commission/{c.id}">發送草稿審核</a>
                    {:else if stage === 'final'}
                      <form method="POST" action="?/updateStatus" use:enhance onsubmit={(e) => confirmSubmit(e, '確定標記此委託為已交付嗎？')}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value="delivered" />
                        <button class="btn primary">標記交付 Deliver</button>
                      </form>
                    {:else if stage === 'delivered'}
                      <button class="btn" disabled>✓ 已交付</button>
                    {:else if next}
                      <form method="POST" action="?/updateStatus" use:enhance onsubmit={(e) => confirmSubmit(e, '確定推進到下一階段嗎？')}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value={next.status} />
                        <button class="btn primary">下一階段 →</button>
                      </form>
                      <a class="btn" href="/dashboard/commission/{c.id}">詳情</a>
                    {:else}
                      <a class="btn" href="/dashboard/commission/{c.id}">詳情</a>
                    {/if}
                    {#if stage !== 'delivered' && stage !== 'cancelled'}
                      <form method="POST" action="?/cancelCommission" use:enhance onsubmit={(e) => confirmSubmit(e, '確定要棄單嗎？此動作會將委託標記為取消。')}>
                        <input type="hidden" name="id" value={c.id} />
                        <button class="btn danger">棄單</button>
                      </form>
                    {/if}
                    <form method="POST" action="?/toggleWaiting" use:enhance style="display:contents" onsubmit={(e) => confirmSubmit(e, c.is_waiting ? '確定取消等待回覆旗標嗎？' : '確定標記為等待回覆嗎？')}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="current" value={c.is_waiting} />
                      {#if stage !== 'unpaid'}
                        <button class="btn ghost-sm" title={c.is_waiting ? '取消等待旗標' : '標記等待回覆'}>
                          {c.is_waiting ? '⏳' : '⌛'}
                        </button>
                      {/if}
                    </form>
                  </footer>
                </div>
              {/each}
              {#if g.items.length === 0}
                <div class="board-empty">—</div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

  <!-- ── List view ── -->
  {:else}
    <div class="qlist-wrap">
      <div class="qlist">
        <div class="qlist-head">
          <span>委託人</span>
          <span>品項</span>
          <span>金額</span>
          <span>階段</span>
          <span>截止日</span>
          <span>狀態</span>
          <span>動作</span>
        </div>
        {#each filtered as c (c.id)}
          {@const stage = toStage(c)}
          {@const isEditing = editingId === c.id}
          <div
            class="qlist-row"
            class:waiting={c.is_waiting === 1}
            class:editing={isEditing}
            ondblclick={() => !isEditing && startEdit(c as EditableC)}
            title={!isEditing ? '雙擊編輯' : ''}
          >
            <!-- 委託人 -->
            <div class="qlist-cell">
              <div class="qcard-avatar small">{c.client_name[0]}</div>
              {#if isEditing}
                <div class="edit-stack">
                  <input class="iedit" bind:value={editName} placeholder="姓名" onkeydown={e => e.key === 'Escape' && cancelEdit()} />
                  <input class="iedit sub" bind:value={editEmail} placeholder="Email" />
                </div>
              {:else}
                <div>
                  <div class="qcard-name">{c.client_name}</div>
                  <div class="qcard-handle">{c.client_email}</div>
                </div>
              {/if}
            </div>

            <!-- 品項 (read-only) -->
            <span class="cell-clip">{(c as any).type_name ?? '—'}</span>

            <!-- 金額 -->
            {#if isEditing}
              <input class="iedit mono" type="number" bind:value={editPrice} />
            {:else}
              <span class="mono">NT$ {(c.estimated_price ?? 0).toLocaleString()}</span>
            {/if}

            <!-- 階段 -->
            {#if isEditing}
              <select class="iedit" bind:value={editStage}>
                {#each STAGES as s}
                  <option value={s}>{STAGE_LABELS[s].zh}</option>
                {/each}
              </select>
            {:else}
              <span>
                <span class="chip" style="background:{STAGE_COLORS[stage]};color:#fff;border-color:transparent">
                  {STAGE_LABELS[stage].zh}
                </span>
              </span>
            {/if}

            <!-- 截止日 -->
            {#if isEditing}
              <input class="iedit mono" bind:value={editDue} placeholder="YYYY-MM-DD" />
            {:else}
              <span class="mono">{c.due_date ?? '—'}</span>
            {/if}

            <!-- 狀態 / 等待 -->
            {#if isEditing}
              <label class="edit-wait-label">
                <input type="checkbox" bind:checked={editWait} />
                待回覆
              </label>
            {:else}
              <span>
                {#if c.is_waiting === 1}
                  <span class="chip accent">●&nbsp;待回覆</span>
                {:else if c.status === 'cancelled'}
                  <span class="chip cancelled">已取消</span>
                {:else if stage !== 'delivered'}
                  <span class="chip">進行中</span>
                {:else}
                  <span class="chip">已交付</span>
                {/if}
              </span>
            {/if}

            <!-- 動作 -->
            <span class="qlist-actions">
              {#if isEditing}
                <button class="btn primary tiny" onclick={commitEdit}>儲存</button>
                <button class="btn tiny" onclick={cancelEdit}>取消</button>
              {:else if c.status === 'cancelled'}
                {#if batchDeleteMode}
                  <label class="batch-pick">
                    <input
                      type="checkbox"
                      checked={selectedCancelledIds.includes(c.id)}
                      onchange={(e) => toggleCancelledPick(c.id, (e.target as HTMLInputElement).checked)}
                    />
                    選取刪除
                  </label>
                {:else}
                  <button class="btn tiny" disabled>已取消</button>
                {/if}
              {:else if stage === 'sketch-review' || stage === 'sketch'}
                <a class="btn accent tiny" href="/dashboard/commission/{c.id}">Review →</a>
                <form method="POST" action="?/cancelCommission" use:enhance onsubmit={(e) => confirmSubmit(e, '確定要棄單嗎？此動作會將委託標記為取消。')}>
                  <input type="hidden" name="id" value={c.id} />
                  <button class="btn tiny danger">棄單</button>
                </form>
              {:else if stage !== 'delivered'}
                <a class="btn tiny" href="/dashboard/commission/{c.id}">詳情</a>
                <form method="POST" action="?/cancelCommission" use:enhance onsubmit={(e) => confirmSubmit(e, '確定要棄單嗎？此動作會將委託標記為取消。')}>
                  <input type="hidden" name="id" value={c.id} />
                  <button class="btn tiny danger">棄單</button>
                </form>
              {:else}
                <button class="btn tiny" disabled>—</button>
              {/if}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  /* ── CSS vars from ACS design ── */
  .queue {
    --paper:   #F5F1EA;
    --ink-acs: #1A1714;
    --serif:   'Georgia', serif;
    --hairline: rgba(0,0,0,0.1);
    --mono-acs: 'JetBrains Mono', monospace;
    --accent:  #B84A2E;

    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--color-background-secondary);
  }

  /* ── Header ── */
  .queue-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    padding: 28px 32px 20px;
    border-bottom: 1px solid var(--hairline);
    flex-wrap: wrap;
  }
  .queue-head-left { display: flex; align-items: flex-end; gap: 36px; flex-wrap: wrap; }
  .queue-head-title .eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
  }
  .queue-head-title h1 {
    font-family: var(--font-display);
    font-size: 2rem;
    color: var(--ink);
    margin: 4px 0 0;
    letter-spacing: 0.01em;
  }

  .queue-stats { display: flex; gap: 24px; margin-bottom: 4px; flex-wrap: wrap; }
  .q-stat {
    display: flex; flex-direction: column; gap: 2px;
    padding-left: 14px;
    border-left: 1px solid var(--hairline);
  }
  .q-stat-v {
    font-family: var(--font-display);
    font-size: 1.25rem;
    color: var(--ink);
  }
  .q-stat-l { font-family: var(--font-mono); font-size: 10px; color: var(--color-text-tertiary); letter-spacing: 0.06em; }
  .q-stat.hot .q-stat-v { color: var(--red); }

  .queue-head-actions { display: flex; align-items: center; gap: 12px; }

  /* segmented */
  .segmented { display: flex; border: var(--border); overflow: hidden; }
  .segmented button {
    padding: 6px 14px;
    background: var(--white);
    border: none;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    color: var(--color-text-secondary);
    border-right: 1px solid var(--color-border-tertiary);
  }
  .segmented button:last-child { border-right: none; }
  .segmented button.active { background: var(--ink); color: var(--white); }

  /* ── Filters ── */
  .queue-filters {
    display: flex;
    gap: 0;
    padding: 0 32px;
    border-bottom: 1px solid var(--hairline);
    background: var(--white);
  }
  .queue-filter {
    padding: 10px 18px;
    background: none;
    border: none;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.1s, border-color 0.1s;
  }
  .queue-filter:hover { color: var(--ink); }
  .queue-filter.active { color: var(--ink); border-bottom-color: var(--ink); }
  .queue-filter .num {
    display: inline-block;
    background: var(--color-background-secondary);
    border-radius: 20px;
    padding: 1px 7px;
    font-size: 10px;
    margin-left: 4px;
  }
  .queue-filter.active .num { background: var(--ink); color: var(--white); }

  /* ── Board ── */
  .board-scroll { flex: 1; overflow-x: auto; padding: 20px 24px; }
  .board {
    display: flex;
    gap: 14px;
    min-width: max-content;
    align-items: flex-start;
  }
  .board-col {
    width: 240px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--white);
    border: var(--border);
  }
  .board-col-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 8px;
    border-bottom: var(--border);
    background: var(--ink);
  }
  .board-col-zh { font-family: var(--font-display); font-size: 13px; color: var(--white); }
  .board-col-en { font-family: var(--font-mono); font-size: 9px; color: rgba(255,255,255,0.5); letter-spacing: 0.08em; margin-top: 2px; }
  .board-col-count {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    background: rgba(255,255,255,0.1);
    padding: 2px 7px;
  }
  .board-col-body { padding: 8px; display: flex; flex-direction: column; gap: 8px; min-height: 60px; }
  .board-empty { text-align: center; color: var(--color-text-tertiary); font-size: 18px; padding: 16px; }

  /* ── Queue card ── */
  .qcard {
    background: var(--white);
    border: var(--border);
    padding: 12px;
    cursor: default;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: box-shadow 0.1s;
  }
  .qcard:hover { box-shadow: var(--shadow-sm); }
  .qcard.waiting { border-left: 3px solid var(--red); }

  .qcard-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .qcard-client { display: flex; align-items: center; gap: 8px; }
  .qcard-avatar {
    width: 28px; height: 28px;
    background: var(--ink);
    color: var(--white);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-size: 12px;
    flex-shrink: 0;
  }
  .qcard-avatar.small { width: 22px; height: 22px; font-size: 10px; }
  .qcard-name { font-weight: 700; font-size: 13px; color: var(--ink); }
  .qcard-handle { font-family: var(--font-mono); font-size: 10px; color: var(--color-text-tertiary); margin-top: 1px; }
  .qcard-waiting { color: var(--red); font-size: 8px; }

  .qcard-body { display: flex; flex-direction: column; gap: 4px; }
  .qcard-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
  .qcard-item { font-size: 12px; font-weight: 700; color: var(--ink); }
  .qcard-amount { font-family: var(--font-mono); font-size: 11px; color: var(--blue); font-weight: 700; }
  .qcard-char { font-size: 11px; color: var(--color-text-secondary); line-height: 1.4; }

  /* Stage progress */
  .stage-progress { display: flex; gap: 2px; }
  .stage-tick {
    flex: 1; height: 4px;
    background: var(--color-border-tertiary);
    transition: background 0.2s;
  }
  .stage-tick.done  { background: var(--color-text-tertiary); }
  .stage-tick.active { background: var(--c, var(--ink)); }

  .qcard-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .qcard-due { font-family: var(--font-mono); font-size: 10px; color: var(--color-text-tertiary); }
  .dim { opacity: 0.6; }

  .qcard-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }

  /* ── Buttons (ACS style, scoped) ── */
  .btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 10px;
    background: var(--white);
    border: var(--border);
    font-family: var(--font-mono);
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
    cursor: pointer; text-decoration: none; color: var(--ink);
    transition: background 0.1s;
    white-space: nowrap;
  }
  .btn:hover:not(:disabled) { background: var(--color-background-secondary); }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn.primary { background: var(--blue); color: var(--white); border-color: var(--blue); }
  .btn.primary:hover { filter: brightness(1.1); }
  .btn.accent { background: var(--red); color: var(--white); border-color: var(--red); }
  .btn.accent:hover { filter: brightness(1.1); }
  .btn.danger { background: var(--red); color: var(--white); border-color: var(--red); }
  .btn.danger:hover { filter: brightness(1.1); }
  .btn.ghost-sm { padding: 4px 6px; background: none; border-color: transparent; font-size: 12px; }
  .btn.tiny { padding: 3px 8px; font-size: 9px; }
  .btn.breathe { animation: breathe 2s ease-in-out infinite; }
  @keyframes breathe {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.65; }
  }

  /* chip */
  .chip {
    display: inline-block;
    padding: 2px 7px;
    border: 1px solid var(--color-border-secondary);
    font-family: var(--font-mono);
    font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
    color: var(--ink); background: var(--white);
  }
  .chip.accent { background: rgba(227,61,44,0.1); border-color: var(--red); color: var(--red); }
  .chip.cancelled { background: rgba(122,44,44,0.1); border-color: #7A2C2C; color: #7A2C2C; }

  .batch-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 24px;
    border-bottom: 1px solid var(--hairline);
    background: var(--white);
  }
  .batch-count {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
  }
  .batch-pick {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--ink);
  }

  /* mono */
  .mono { font-family: var(--font-mono); font-size: 12px; }

  /* ── List view ── */
  .qlist-wrap { flex: 1; overflow: auto; padding: 16px 24px; }
  .qlist { min-width: 720px; border: var(--border); background: var(--white); }
  .qlist-head {
    display: grid;
    grid-template-columns: 200px 140px 110px 120px 90px 90px 100px;
    gap: 0;
    background: var(--ink);
    padding: 8px 12px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.7);
  }
  .qlist-row {
    display: grid;
    grid-template-columns: 200px 140px 110px 120px 90px 90px 100px;
    gap: 0;
    padding: 10px 12px;
    border-bottom: 1px solid var(--hairline);
    align-items: center;
    font-size: 12px;
    color: var(--ink);
    transition: background 0.1s;
  }
  .qlist-row:last-child { border-bottom: none; }
  .qlist-row:hover:not(.editing) { background: var(--color-background-secondary); }
  .qlist-row:not(.editing) { cursor: default; }
  .qlist-row.waiting { border-left: 3px solid var(--red); }
  .qlist-row.editing { background: #fffbf0; border-left: 3px solid var(--gold); cursor: default; }
  .qlist-cell { display: flex; align-items: center; gap: 8px; }
  .stage-actions,
  .qcard-actions,
  .qlist-actions { display: flex; gap: 4px; flex-wrap: wrap; }
  .cell-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* inline edit inputs */
  .edit-stack { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
  .iedit {
    width: 100%;
    padding: 3px 6px;
    font-size: 11px;
    font-family: var(--font-body);
    border: 1px solid rgba(21,22,45,0.2);
    background: var(--white);
    color: var(--ink);
    outline: none;
    border-radius: 3px;
    box-sizing: border-box;
  }
  .iedit:focus { border-color: var(--blue); box-shadow: 0 0 0 2px rgba(31,63,184,0.15); }
  .iedit.sub { font-size: 10px; opacity: 0.7; }
  .iedit.mono { font-family: var(--font-mono); }
  select.iedit { cursor: pointer; }
  .edit-wait-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    cursor: pointer;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .queue-head { padding: 20px 16px 16px; }
    .queue-filters { padding: 0 16px; overflow-x: auto; }
    .board-scroll, .qlist-wrap { padding: 0 16px 16px; }
    .board { min-width: 880px; }
    .qlist-head { display: none; }
    .qlist { min-width: 0; }
    .qlist-row {
      grid-template-columns: 1fr;
      gap: 0.75rem;
      align-items: start;
    }
    .qlist-cell { min-width: 0; }
  }

  @media (max-width: 640px) {
    .queue-head-left, .queue-head-actions, .queue-stats { width: 100%; }
    .segmented { width: 100%; display: grid; grid-template-columns: 1fr 1fr; }
    .qcard { padding: 0.85rem; }
    .qcard-actions,
    .stage-actions { flex-direction: column; align-items: stretch; }
    .qcard-actions .btn,
    .qcard-actions form,
    .stage-actions form,
    .qlist-actions form { width: 100%; }
    .qlist-actions { justify-content: flex-start; }
  }

  /* ── Eyebrow ── */
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    display: block;
  }
</style>
