<script lang="ts">
  import type { ActionData } from "./$types"
  import { enhance } from "$app/forms"

  let { form }: { form: ActionData } = $props()

  const STATUS_STEPS: Record<string, number> = {
    pending: 0, accepted: 1, in_progress: 2, revision: 3, completed: 4, delivered: 5
  }
  const STATUS_LABELS: Record<string, string> = {
    pending: "待確認", accepted: "已接受", in_progress: "製作中",
    revision: "修改中", completed: "已完成", delivered: "已交付",
    rejected: "未受理", cancelled: "已取消"
  }
  const STEPS = ["待確認", "已接受", "製作中", "修改中", "已完成", "已交付"]

  function formatDate(ts: number) {
    return new Date(ts * 1000).toLocaleDateString("zh-TW", {
      year: "numeric", month: "numeric", day: "numeric"
    })
  }
</script>

<svelte:head>
  <title>委託進度查詢</title>
</svelte:head>

<div class="page">
  <div class="page-header">
    <div class="checker-row"></div>
    <div class="header-content">
      <h1 class="page-title">委託進度查詢</h1>
      <p class="subtitle">輸入申請時填寫的 Email，查詢你的所有委託</p>
    </div>
    <div class="checker-row"></div>
  </div>

  <div class="search-section">
    <form method="POST" action="?/search" use:enhance class="search-form">
      <input
        type="email"
        name="email"
        placeholder="your@email.com"
        value={form?.query ?? ""}
        required
        class="search-input"
      />
      <button type="submit" class="search-btn">查詢</button>
    </form>
    {#if form?.error}
      <p class="error-msg">{form.error}</p>
    {/if}
  </div>

  {#if form?.results !== null && form?.results !== undefined}
    {#if form.results.length === 0}
      <div class="empty-state">
        <p>找不到 <strong>{form.query}</strong> 的委託記錄。</p>
        <p class="hint">請確認 Email 是否正確，或直接聯繫繪師。</p>
      </div>
    {:else}
      <div class="results-header">
        <span class="mono">找到 {form.results.length} 筆委託</span>
      </div>
      <div class="result-list">
        {#each form.results as c}
          {@const step = STATUS_STEPS[c.status] ?? -1}
          <div class="result-card">
            <div class="result-header">
              <div>
                <span class="type-name">{c.type_name ?? "委託"}</span>
                <span class="commission-id mono">#{c.id?.slice(0, 8).toUpperCase()}</span>
              </div>
              <span class="status-pill status-{c.status}">
                {STATUS_LABELS[c.status] ?? c.status}
              </span>
            </div>

            {#if step >= 0}
              <div class="progress-strip">
                {#each STEPS as label, i}
                  <div class="progress-step"
                    class:done={i < step}
                    class:current={i === step}
                    class:future={i > step}
                  >
                    <div class="step-circle">{i + 1}</div>
                    <div class="step-label">{label}</div>
                  </div>
                {/each}
              </div>
            {/if}

            <div class="result-meta">
              <span class="mono">申請日期：{formatDate(c.created_at)}</span>
              {#if c.estimated_price > 0}
                <span class="mono price">NT$ {c.estimated_price.toLocaleString()}</span>
              {/if}
            </div>

            <a href="/track/{c.id}" class="track-link">查看詳情與草稿 →</a>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
.page { max-width: 700px; margin: 0 auto; padding: 0 1rem 4rem; }

.page-header { text-align: center; }
.header-content { padding: 2.5rem 1rem; }
.page-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--blue);
  margin-bottom: 0.75rem;
}
.subtitle { color: var(--color-text-secondary); font-size: 1rem; }

.search-section { margin: 2rem 0; }
.search-form {
  display: flex;
  gap: 0;
  border: var(--border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.search-input {
  flex: 1;
  padding: 0.9rem 1.25rem;
  border: none;
  font-family: var(--font-body);
  font-size: 1rem;
  background: var(--white);
  color: var(--ink);
  outline: none;
}
.search-btn {
  padding: 0.9rem 1.75rem;
  background: var(--blue);
  color: var(--white);
  border: none;
  border-left: var(--border);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.1s;
}
.search-btn:hover { background: #1834a0; }
.error-msg {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--red);
  margin-top: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  border: var(--border);
  box-shadow: var(--shadow-sm);
}
.empty-state p { margin-bottom: 0.5rem; }
.hint { font-size: 0.875rem; color: var(--color-text-secondary); }

.results-header {
  padding: 0.5rem 0;
  border-bottom: var(--border);
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
}

.result-list { display: flex; flex-direction: column; gap: 1rem; }
.result-card {
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: var(--blue);
  color: var(--white);
  border-bottom: var(--border);
}
.type-name { font-weight: 700; margin-right: 0.75rem; }
.commission-id {
  font-size: 11px;
  opacity: 0.7;
  letter-spacing: 0.08em;
}
.status-pill {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border: 1px solid var(--white);
  letter-spacing: 0.06em;
}
.status-pending { color: var(--gold); }
.status-accepted, .status-in_progress, .status-revision { color: #86efac; }
.status-completed, .status-delivered { color: #4ade80; }
.status-rejected, .status-cancelled { color: rgba(255,255,255,0.4); }

.progress-strip {
  display: flex;
  padding: 0.75rem 1rem;
  gap: 0;
  overflow-x: auto;
}
.progress-step {
  flex: 1;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  text-align: center;
  position: relative;
}
.progress-step::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 60%;
  width: 80%;
  height: 2px;
  background: var(--color-border-tertiary);
  z-index: 0;
}
.progress-step:last-child::after { display: none; }
.step-circle {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border-tertiary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  background: var(--white);
  position: relative;
  z-index: 1;
}
.done .step-circle { background: var(--blue); color: var(--white); border-color: var(--blue); }
.current .step-circle { background: var(--red); color: var(--white); border-color: var(--red); }
.done .step-label { color: var(--blue); font-weight: 700; }
.current .step-label { color: var(--red); font-weight: 700; }
.future .step-label { color: var(--color-text-tertiary); }
.step-label { font-family: var(--font-mono); font-size: 9px; }

.result-meta {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--color-border-tertiary);
  font-size: 12px;
  color: var(--color-text-secondary);
}
.price { color: var(--blue); font-weight: 700; }
.track-link {
  display: block;
  padding: 0.6rem 1rem;
  background: var(--ink);
  color: var(--white);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  border-top: var(--border);
  transition: background 0.1s;
}
.track-link:hover { background: var(--blue); }

.mono { font-family: var(--font-mono); }
</style>
