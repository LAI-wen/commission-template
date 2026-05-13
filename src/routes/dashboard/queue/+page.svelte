<script lang="ts">
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
  const { pendingPayment, inProgress, revision, completed, delivered } = $derived(data)

  function formatDate(ts: number) {
    return new Date(ts * 1000).toLocaleDateString("zh-TW", {
      month: "numeric", day: "numeric",
    })
  }
</script>

<div class="queue-header">
  <h2 class="queue-title">排單管理</h2>
</div>

<div class="kanban">
  <!-- 待付款 -->
  <div class="kanban-col pending-payment">
    <div class="col-header">
      <span class="col-title">待付款</span>
      <span class="col-count">{pendingPayment.length}</span>
    </div>
    {#each pendingPayment as c}
      <div class="kanban-card">
        <a href="/dashboard/commission/{c.id}" class="kanban-card-name">{c.client_name}</a>
        <p class="kanban-card-meta">{formatDate(c.created_at)}</p>
        <p class="kanban-card-price">NT$ {c.estimated_price.toLocaleString()}</p>
        <span class="unpaid-badge">未付款</span>
        <div class="card-actions">
          <form method="POST" action="?/markPaid">
            <input type="hidden" name="id" value={c.id} />
            <button class="mark-paid-btn" type="submit">已收款</button>
          </form>
          <a class="detail-link" href="/dashboard/commission/{c.id}">詳情</a>
        </div>
      </div>
    {/each}
    {#if pendingPayment.length === 0}
      <p class="col-empty">沒有項目</p>
    {/if}
  </div>

  <!-- 製作中 -->
  <div class="kanban-col">
    <div class="col-header">
      <span class="col-title">製作中</span>
      <span class="col-count">{inProgress.length}</span>
    </div>
    {#each inProgress as c}
      <div class="kanban-card">
        <a href="/dashboard/commission/{c.id}" class="kanban-card-name">{c.client_name}</a>
        <p class="kanban-card-meta">{formatDate(c.created_at)}</p>
        <p class="kanban-card-price">NT$ {c.estimated_price.toLocaleString()}</p>
        {#if c.is_paid === 1}<span class="paid-badge">已收款</span>{/if}
        <div class="card-actions">
          <form method="POST" action="?/updateStatus">
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="note" value="" />
            <select
              class="status-select"
              name="status"
              onchange={(e) => (e.target as HTMLSelectElement).form?.requestSubmit()}
            >
              <option value="in_progress" selected={c.status === "in_progress"}>製作中</option>
              <option value="revision" selected={c.status === "revision"}>修改中</option>
              <option value="completed" selected={c.status === "completed"}>已完成</option>
            </select>
          </form>
          <a class="detail-link" href="/dashboard/commission/{c.id}">詳情</a>
        </div>
      </div>
    {/each}
    {#if inProgress.length === 0}
      <p class="col-empty">沒有項目</p>
    {/if}
  </div>

  <!-- 修改中 -->
  <div class="kanban-col">
    <div class="col-header">
      <span class="col-title">修改中</span>
      <span class="col-count">{revision.length}</span>
    </div>
    {#each revision as c}
      <div class="kanban-card">
        <a href="/dashboard/commission/{c.id}" class="kanban-card-name">{c.client_name}</a>
        <p class="kanban-card-meta">{formatDate(c.created_at)}</p>
        <p class="kanban-card-price">NT$ {c.estimated_price.toLocaleString()}</p>
        <div class="card-actions">
          <form method="POST" action="?/updateStatus">
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="note" value="" />
            <select
              class="status-select"
              name="status"
              onchange={(e) => (e.target as HTMLSelectElement).form?.requestSubmit()}
            >
              <option value="revision" selected={c.status === "revision"}>修改中</option>
              <option value="in_progress" selected={c.status === "in_progress"}>製作中</option>
              <option value="completed" selected={c.status === "completed"}>已完成</option>
            </select>
          </form>
          <a class="detail-link" href="/dashboard/commission/{c.id}">詳情</a>
        </div>
      </div>
    {/each}
    {#if revision.length === 0}
      <p class="col-empty">沒有項目</p>
    {/if}
  </div>

  <!-- 已完成 -->
  <div class="kanban-col">
    <div class="col-header">
      <span class="col-title">已完成</span>
      <span class="col-count">{completed.length}</span>
    </div>
    {#each completed as c}
      <div class="kanban-card">
        <a href="/dashboard/commission/{c.id}" class="kanban-card-name">{c.client_name}</a>
        <p class="kanban-card-meta">{formatDate(c.created_at)}</p>
        <p class="kanban-card-price">NT$ {c.estimated_price.toLocaleString()}</p>
        {#if c.is_paid === 1}<span class="paid-badge">已收款</span>{/if}
        <div class="card-actions">
          <form method="POST" action="?/updateStatus">
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="note" value="" />
            <input type="hidden" name="status" value="delivered" />
            <button class="mark-paid-btn" type="submit">標記已交付</button>
          </form>
          <a class="detail-link" href="/dashboard/commission/{c.id}">詳情</a>
        </div>
      </div>
    {/each}
    {#if completed.length === 0}
      <p class="col-empty">沒有項目</p>
    {/if}
  </div>

  <!-- 已交付 -->
  <div class="kanban-col delivered">
    <div class="col-header">
      <span class="col-title">已交付</span>
      <span class="col-count">{delivered.length}</span>
    </div>
    {#each delivered as c}
      <div class="kanban-card">
        <a href="/dashboard/commission/{c.id}" class="kanban-card-name">{c.client_name}</a>
        <p class="kanban-card-meta">{formatDate(c.created_at)}</p>
        <p class="kanban-card-price">NT$ {c.estimated_price.toLocaleString()}</p>
        {#if c.is_paid === 1}<span class="paid-badge">已收款</span>{/if}
      </div>
    {/each}
    {#if delivered.length === 0}
      <p class="col-empty">沒有項目</p>
    {/if}
  </div>
</div>

<style>
.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.queue-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--blue);
}

.kanban {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  align-items: start;
  min-height: 60vh;
}
.kanban-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.col-header {
  background: var(--blue);
  color: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-sm);
  padding: 0.6rem 0.875rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.col-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.col-count {
  font-family: var(--font-mono);
  font-size: 11px;
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 7px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 待付款欄 - 金色 */
.kanban-col.pending-payment .col-header { background: var(--gold); color: var(--ink); }
/* 已交付欄 - 綠色 */
.kanban-col.delivered .col-header { background: #16a34a; }

.kanban-card {
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-sm);
  padding: 0.875rem;
  font-size: 0.875rem;
  transition: transform 0.08s, box-shadow 0.08s;
}
.kanban-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}
.kanban-card-name {
  display: block;
  font-weight: 700;
  text-decoration: none;
  color: var(--ink);
  margin-bottom: 4px;
}
.kanban-card-name:hover { color: var(--blue); }
.kanban-card-meta {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem;
}
.kanban-card-price {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--blue);
  font-weight: 700;
  margin: 0 0 0.5rem;
}
.paid-badge {
  display: inline-block;
  padding: 1px 6px;
  background: var(--blue);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  border: 1px solid var(--ink);
  margin-bottom: 0.5rem;
}
.unpaid-badge {
  display: inline-block;
  padding: 1px 6px;
  background: var(--gold);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  border: 1px solid var(--ink);
  margin-bottom: 0.5rem;
}
.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
.mark-paid-btn {
  padding: 3px 10px;
  background: var(--white);
  color: var(--blue);
  border: 1.5px solid var(--blue);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.08s;
}
.mark-paid-btn:hover { background: var(--blue); color: var(--white); }
.status-select {
  border: 1px solid var(--color-border-tertiary);
  padding: 3px 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  background: var(--white);
  cursor: pointer;
  flex: 1;
}
.detail-link {
  padding: 3px 10px;
  background: var(--ink);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid var(--ink);
}

.col-empty {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 1.5rem 0;
  border: 1px dashed var(--color-border-tertiary);
}

@media (max-width: 1200px) {
  .kanban { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .kanban { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .kanban { grid-template-columns: 1fr; }
}
</style>
