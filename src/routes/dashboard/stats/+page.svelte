<script lang="ts">
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  const monthly = $derived(data.monthly)
  const overall = $derived(data.overall)
  const topTypes = $derived(data.topTypes)

  function formatMonth(ym: string) {
    const [, m] = ym.split("-")
    return `${m}月`
  }

  const maxTotal = $derived(Math.max(...monthly.map(m => m.total), 1))
  const maxRevenue = $derived(Math.max(...monthly.map(m => m.revenue), 1))

  const currentYear = new Date().getFullYear()
  const yearRevenue = $derived(
    monthly
      .filter(m => m.month.startsWith(String(currentYear)))
      .reduce((sum, m) => sum + m.revenue, 0)
  )
</script>

<div class="page">
  <h1>統計</h1>

  <!-- 總覽卡片 -->
  <div class="overview-grid">
    <div class="stat-card">
      <span class="stat-label">總委託數</span>
      <span class="stat-value">{overall?.total ?? 0}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">接受率</span>
      <span class="stat-value">
        {overall?.accept_rate != null ? `${overall.accept_rate}%` : "—"}
      </span>
    </div>
    <div class="stat-card">
      <span class="stat-label">已完成</span>
      <span class="stat-value">{overall?.completed ?? 0}</span>
    </div>
    <div class="stat-card highlight">
      <span class="stat-label">累計收入（已收款）</span>
      <span class="stat-value">NT$ {(overall?.total_revenue ?? 0).toLocaleString()}</span>
    </div>
  </div>

  <!-- 狀態分佈 -->
  <section class="section">
    <h2>委託狀態分佈</h2>
    <div class="status-bars">
      {#each [
        { label: "待確認", value: overall?.pending ?? 0, cls: "warning" },
        { label: "進行中", value: overall?.accepted ?? 0, cls: "info" },
        { label: "已完成", value: overall?.completed ?? 0, cls: "success" },
        { label: "已拒絕", value: overall?.rejected ?? 0, cls: "muted" },
      ] as item}
        <div class="status-row">
          <span class="status-label">{item.label}</span>
          <div class="status-bar-wrap">
            <div
              class="status-bar-fill color-{item.cls}"
              style="width: {overall?.total ? (item.value / overall.total * 100).toFixed(1) : 0}%"
            ></div>
          </div>
          <span class="status-count">{item.value}</span>
        </div>
      {/each}
    </div>
  </section>

  {#if monthly.length > 0}
    <!-- 近 6 個月委託數 -->
    <section class="section">
      <h2>近 6 個月委託數</h2>
      <div class="bar-chart">
        {#each monthly as m}
          <div class="bar-col">
            <div class="bar-wrap">
              <div
                class="bar completed"
                style="height: {(m.completed / maxTotal * 100).toFixed(1)}%"
                title="已完成 {m.completed}"
              ></div>
              <div
                class="bar accepted"
                style="height: {((m.accepted - m.completed) / maxTotal * 100).toFixed(1)}%"
                title="進行中 {m.accepted - m.completed}"
              ></div>
            </div>
            <span class="bar-label">{formatMonth(m.month)}</span>
            <span class="bar-value">{m.total}</span>
          </div>
        {/each}
      </div>
      <div class="chart-legend">
        <span class="legend completed">■ 已完成</span>
        <span class="legend accepted">■ 進行中</span>
      </div>
    </section>

    <!-- 近 6 個月收入 -->
    <section class="section">
      <div class="section-header">
        <h2>近 6 個月收入（已收款）</h2>
        {#if yearRevenue > 0}
          <span class="year-total">{currentYear} 年累計 NT$ {yearRevenue.toLocaleString()}</span>
        {/if}
      </div>
      <div class="bar-chart">
        {#each monthly as m}
          <div class="bar-col">
            <div class="bar-wrap">
              <div
                class="bar revenue"
                style="height: {(m.revenue / maxRevenue * 100).toFixed(1)}%"
                title="NT$ {m.revenue.toLocaleString()}"
              ></div>
            </div>
            <span class="bar-label">{formatMonth(m.month)}</span>
            <span class="bar-value rev">
              {m.revenue > 0 ? `${(m.revenue / 1000).toFixed(1)}k` : "—"}
            </span>
          </div>
        {/each}
      </div>
    </section>
  {:else}
    <div class="empty">
      <p>還沒有委託資料</p>
      <p>完成第一筆委託後就會出現統計圖表</p>
    </div>
  {/if}

  <!-- 熱門委託類型 -->
  {#if topTypes.length > 0}
    <section class="section">
      <h2>委託類型排名</h2>
      <div class="type-list">
        {#each topTypes as type, i}
          <div class="type-row">
            <span class="type-rank">#{i + 1}</span>
            <span class="type-name">{type.name ?? "（未分類）"}</span>
            <div class="type-bar-wrap">
              <div
                class="type-bar"
                style="width: {(type.count / (topTypes[0]?.count ?? 1) * 100).toFixed(1)}%"
              ></div>
            </div>
            <span class="type-count">{type.count} 件</span>
            {#if type.revenue > 0}
              <span class="type-revenue">NT$ {type.revenue.toLocaleString()}</span>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .page { max-width: 800px; }
  h1 { font-size: 1.3rem; font-weight: 500; margin: 0 0 1.5rem; }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
  .stat-card {
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-lg);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .stat-card.highlight {
    border-color: var(--color-border-primary);
    background: var(--color-background-secondary);
  }
  .stat-label { font-size: 0.75rem; color: var(--color-text-secondary); }
  .stat-value { font-size: 1.5rem; font-weight: 500; line-height: 1.2; }

  .section {
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-lg);
    padding: 1.25rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .section-header { display: flex; justify-content: space-between; align-items: baseline; }
  h2 { font-size: 0.85rem; font-weight: 500; margin: 0; color: var(--color-text-secondary); }
  .year-total { font-size: 0.8rem; color: var(--color-text-secondary); }

  .status-bars { display: flex; flex-direction: column; gap: 0.6rem; }
  .status-row { display: flex; align-items: center; gap: 0.75rem; }
  .status-label { width: 52px; flex-shrink: 0; color: var(--color-text-secondary); font-size: 0.8rem; }
  .status-bar-wrap {
    flex: 1; height: 8px;
    background: var(--color-background-secondary);
    border-radius: 999px; overflow: hidden;
  }
  .status-bar-fill { height: 100%; border-radius: 999px; transition: width 0.3s; min-width: 2px; }
  .color-warning { background: #f59e0b; }
  .color-info { background: #3b82f6; }
  .color-success { background: #22c55e; }
  .color-muted { background: var(--color-border-secondary); }
  .status-count { width: 28px; text-align: right; font-size: 0.8rem; color: var(--color-text-secondary); }

  .bar-chart { display: flex; gap: 0.5rem; align-items: flex-end; height: 140px; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; height: 100%; }
  .bar-wrap {
    flex: 1; width: 100%;
    display: flex; flex-direction: column-reverse;
    border-radius: var(--border-radius-md);
    overflow: hidden;
    background: var(--color-background-secondary);
    min-height: 4px;
  }
  .bar { width: 100%; transition: height 0.3s; }
  .bar.completed { background: #22c55e; }
  .bar.accepted { background: #3b82f6; }
  .bar.revenue { background: #8b5cf6; }
  .bar-label { font-size: 0.72rem; color: var(--color-text-tertiary); }
  .bar-value { font-size: 0.72rem; font-weight: 500; color: var(--color-text-secondary); }
  .bar-value.rev { color: #8b5cf6; }
  .chart-legend { display: flex; gap: 1rem; font-size: 0.75rem; }
  .legend { color: var(--color-text-secondary); }
  .legend.completed { color: #22c55e; }
  .legend.accepted { color: #3b82f6; }

  .type-list { display: flex; flex-direction: column; gap: 0.6rem; }
  .type-row { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; }
  .type-rank { width: 24px; font-size: 0.75rem; color: var(--color-text-tertiary); flex-shrink: 0; }
  .type-name { width: 100px; flex-shrink: 0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .type-bar-wrap { flex: 1; height: 6px; background: var(--color-background-secondary); border-radius: 999px; overflow: hidden; }
  .type-bar { height: 100%; background: #8b5cf6; border-radius: 999px; transition: width 0.3s; min-width: 4px; }
  .type-count { width: 40px; text-align: right; font-size: 0.78rem; color: var(--color-text-secondary); flex-shrink: 0; }
  .type-revenue { font-size: 0.75rem; color: var(--color-text-tertiary); width: 90px; text-align: right; flex-shrink: 0; }

  .empty {
    text-align: center; padding: 3rem 0;
    color: var(--color-text-tertiary); font-size: 0.875rem;
    display: flex; flex-direction: column; gap: 0.35rem;
  }
</style>
