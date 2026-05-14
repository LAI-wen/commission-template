<script lang="ts">
  import type { Commission } from "$lib/db"

  let {
    commission,
    showActions = false,
    typeName = null,
    acceptTemplate = null,
    rejectTemplate = null,
  }: {
    commission: Commission
    showActions?: boolean
    typeName?: string | null
    acceptTemplate?: string | null
    rejectTemplate?: string | null
  } = $props()

  /* ── modal state ── */
  type ModalMode = 'accept' | 'reject' | null
  let modal = $state<ModalMode>(null)
  let noteText = $state("")

  function openModal(mode: ModalMode) {
    modal = mode
    if (mode === 'accept') {
      noteText = acceptTemplate ?? defaultAcceptNote()
    } else if (mode === 'reject') {
      noteText = rejectTemplate ?? defaultRejectNote()
    }
  }

  function defaultAcceptNote() {
    return `親愛的 ${commission.client_name}，

感謝您的委託申請！很開心能夠接受您的委託。

我會盡快聯繫您確認細節，並在開始作業後通知您進度。如有任何問題，請隨時回覆此郵件。

期待與您合作！`
  }

  function defaultRejectNote() {
    return `親愛的 ${commission.client_name}，

感謝您對我作品的支持與委託申請。

很遺憾目前無法接受您的委託，可能原因包括檔期已滿或委託類型不符合目前的創作方向。

歡迎未來持續關注，期待下次有機會合作。謝謝！`
  }

  let formEl = $state<HTMLFormElement | null>(null)

  const statusLabel: Record<string, string> = {
    pending: "待確認",
    accepted: "進行中",
    rejected: "未受理",
    in_progress: "製作中",
    revision: "修改中",
    completed: "已完成",
    cancelled: "已取消",
  }

  function formatDate(ts: number) {
    return new Date(ts * 1000).toLocaleDateString("zh-TW", {
      month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }
</script>

<div class="card">
  <div class="card-header">
    <div class="header-left">
      <a href="/dashboard/commission/{commission.id}" class="client-name">
        {commission.client_name}
      </a>
      <span class="date">{formatDate(commission.created_at)}</span>
    </div>
    <span class="status status-{commission.status}">
      {statusLabel[commission.status] ?? commission.status}
    </span>
  </div>

  <div class="card-body">
    {#if commission.estimated_price > 0}
      <span class="price">NT$ {commission.estimated_price.toLocaleString()}</span>
    {/if}
    <p class="detail">{commission.detail?.slice(0, 80)}...</p>
    <span class="email">{commission.client_email}</span>
  </div>

  {#if showActions && commission.status === "pending"}
    <div class="actions">
      <button class="btn-accept" onclick={() => openModal('accept')}>接受委託</button>
      <button class="btn-reject-toggle" onclick={() => openModal('reject')}>拒絕</button>
    </div>
  {/if}
</div>

<!-- ── Email Modal ── -->
{#if modal !== null}
  <div
    class="modal-backdrop"
    role="button"
    tabindex="0"
    aria-label="關閉郵件預覽視窗"
    onclick={e => e.target === e.currentTarget && (modal = null)}
    onkeydown={(e) => {
      if (e.key === "Escape") {
        modal = null
      }
      if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
        e.preventDefault()
        modal = null
      }
    }}
  >
    <div class="modal">
      <div class="modal-head" class:accept={modal === 'accept'} class:reject={modal === 'reject'}>
        <span class="modal-title">
          {modal === 'accept' ? '✓ 寄送接受通知' : '✕ 寄送拒絕通知'}
        </span>
        <button class="modal-close" onclick={() => modal = null}>✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-to">
          <span class="to-label">收件人</span>
          <span class="to-val mono">{commission.client_name} &lt;{commission.client_email}&gt;</span>
        </div>
        {#if typeName}
          <div class="modal-to">
            <span class="to-label">委託類型</span>
            <span class="to-val">{typeName}</span>
          </div>
        {/if}
        <div class="modal-to">
          <span class="to-label">金額</span>
          <span class="to-val mono">NT$ {commission.estimated_price.toLocaleString()}</span>
        </div>
        <div class="field-label">郵件內容</div>
        <textarea
          class="modal-textarea"
          bind:value={noteText}
          rows="8"
        ></textarea>
        <p class="modal-hint">此內容將附在系統通知郵件中寄送給委託人，並附上追蹤連結。</p>
      </div>
      <div class="modal-footer">
        <form
          method="POST"
          action={modal === 'accept' ? '?/accept' : '?/reject'}
          bind:this={formEl}
        >
          <input type="hidden" name="id"   value={commission.id} />
          <input type="hidden" name="note" value={noteText} />
          <button type="submit" class="modal-send" class:accept={modal === 'accept'} class:reject={modal === 'reject'}>
            {modal === 'accept' ? '確認接受並寄出通知' : '確認拒絕並寄出通知'}
          </button>
        </form>
        <button class="modal-cancel" onclick={() => modal = null}>取消</button>
      </div>
    </div>
  </div>
{/if}

<style>
.card {
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  transition: transform 0.08s, box-shadow 0.08s;
}
.card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--blue);
  color: var(--white);
  border-bottom: var(--border);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}
.client-name {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  color: var(--white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.date {
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: 0.7;
  white-space: nowrap;
  flex-shrink: 0;
}
.status {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border: 1px solid currentColor;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}
.status-pending { color: var(--gold); }
.status-accepted, .status-in_progress { color: #4ade80; }
.status-completed { color: #34d399; }
.status-rejected, .status-cancelled { color: rgba(255,255,255,0.4); }
.status-revision { color: var(--gold); }

.card-body {
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.price {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  color: var(--blue);
}
.detail {
  font-size: 0.83rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}
.email {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.actions {
  display: flex;
  gap: 0;
  border-top: var(--border);
}
.btn-accept {
  flex: 1;
  padding: 0.6rem;
  background: var(--blue);
  color: var(--white);
  border: none;
  border-right: var(--border);
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.1s;
}
.btn-accept:hover { background: #1834a0; }
.btn-reject-toggle {
  flex: 1;
  padding: 0.6rem;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--red);
  transition: background 0.1s;
}
.btn-reject-toggle:hover { background: #fff0ef; }

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(21,22,45,0.6);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal {
  background: var(--white);
  border: var(--border);
  box-shadow: 6px 6px 0 var(--ink);
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: var(--border);
}
.modal-head.accept { background: var(--blue); color: #fff; }
.modal-head.reject { background: var(--red); color: #fff; }
.modal-title { font-family: var(--font-mono); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
.modal-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.7;
  padding: 0;
}
.modal-close:hover { opacity: 1; }

.modal-body { padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
.modal-to {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-size: 0.85rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.to-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(0,0,0,0.4);
  width: 60px;
  flex-shrink: 0;
}
.to-val { color: var(--ink); }
.to-val.mono { font-family: var(--font-mono); font-size: 12px; }
.field-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(0,0,0,0.5);
  margin-top: 0.5rem;
}
.modal-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.65rem 0.75rem;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.6;
  resize: vertical;
  background: #fafaf8;
  color: var(--ink);
  outline: none;
}
.modal-textarea:focus { border-color: var(--blue); background: #fff; }
.modal-hint {
  font-size: 11px;
  color: rgba(0,0,0,0.35);
  margin: 0;
  font-family: var(--font-mono);
}

.modal-footer {
  padding: 0.75rem 1rem;
  border-top: var(--border);
  display: flex;
  gap: 0.5rem;
  background: #f9f8f4;
}
.modal-send {
  flex: 1;
  padding: 0.6rem 1rem;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.08s;
}
.modal-send.accept { background: var(--blue); color: #fff; }
.modal-send.reject { background: var(--red); color: #fff; }
.modal-send:hover { transform: translate(-1px,-1px); box-shadow: var(--shadow-md); }
.modal-cancel {
  padding: 0.6rem 1rem;
  background: none;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--color-text-secondary);
}
.modal-cancel:hover { background: rgba(0,0,0,0.04); }
</style>
