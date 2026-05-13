<script lang="ts">
  import type { Commission } from "$lib/db"

  let { commission, showActions = false }: {
    commission: Commission
    showActions?: boolean
  } = $props()

  let showRejectForm = $state(false)
  let note = $state("")

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
      {#if !showRejectForm}
        <form method="POST" action="?/accept" class="inline-form">
          <input type="hidden" name="id" value={commission.id} />
          <input type="hidden" name="note" value="" />
          <button type="submit" class="btn-accept">接受委託</button>
        </form>
        <button
          class="btn-reject-toggle"
          onclick={() => (showRejectForm = true)}
        >
          拒絕
        </button>
      {:else}
        <form method="POST" action="?/reject" class="reject-form">
          <input type="hidden" name="id" value={commission.id} />
          <textarea
            name="note"
            bind:value={note}
            placeholder="拒絕原因（會寄給委託人）"
            rows="2"
          ></textarea>
          <div class="reject-actions">
            <button type="submit" class="btn-reject">確認拒絕</button>
            <button
              type="button"
              class="btn-cancel"
              onclick={() => (showRejectForm = false)}
            >
              取消
            </button>
          </div>
        </form>
      {/if}
    </div>
  {/if}
</div>

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
.inline-form { display: contents; }
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
.reject-form { flex: 1; display: flex; flex-direction: column; gap: 0; }
textarea {
  padding: 0.6rem 0.875rem;
  border: none;
  border-top: var(--border);
  font-family: var(--font-body);
  font-size: 0.85rem;
  resize: none;
  background: var(--white);
  color: var(--ink);
  width: 100%;
  outline: none;
}
textarea:focus { background: #fff8f8; }
.reject-actions { display: flex; }
.btn-reject {
  flex: 1;
  padding: 0.55rem;
  background: var(--red);
  color: var(--white);
  border: none;
  border-top: var(--border);
  border-right: var(--border);
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-cancel {
  flex: 1;
  padding: 0.55rem;
  background: none;
  border: none;
  border-top: var(--border);
  font-family: var(--font-body);
  font-size: 0.82rem;
  cursor: pointer;
  color: var(--color-text-secondary);
}
</style>
