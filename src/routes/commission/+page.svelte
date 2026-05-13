<script lang="ts">
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  const creator = $derived(data.creator)
  const types = $derived(data.types)
  const isOpen = $derived(creator?.is_open === 1)
</script>

<svelte:head>
  <title>委託說明 · {creator?.display_name}</title>
</svelte:head>

<div class="status-banner">
  <span class="status-dot" class:closed={!data.creator?.is_open}></span>
  {data.creator?.is_open ? '現在開放委託 · NOW ACCEPTING' : '暫停接案 · COMMISSIONS CLOSED'}
</div>
<div class="checker-row"></div>

<main class="page">
  <a href="/" class="back">← 返回名片</a>
  <h1>委託說明</h1>

  <section class="section">
    <h2>委託流程</h2>
    <ol class="flow">
      <li>填寫申請表單，送出後等待確認</li>
      <li>繪師確認需求後回覆報價與時程</li>
      <li>確認後請款，付款完成開始作業</li>
      <li>草稿確認，修改後交付完稿</li>
    </ol>
  </section>

  <section class="section">
    <h2>委託項目</h2>
    <div class="type-list">
      {#each types as type}
        <a href="/commission/{type.id}" class="type-row">
          <div>
            <span class="name">{type.name}</span>
            {#if type.description}
              <span class="desc">{type.description}</span>
            {/if}
          </div>
          <span class="price">NT$ {type.base_price.toLocaleString()} 起 →</span>
        </a>
      {/each}
    </div>
  </section>

  <section class="section">
    <h2>注意事項</h2>
    <ul class="notes">
      <li>交稿時程依委託量調整，約 2–6 週</li>
      <li>草稿階段提供 2 次修改機會</li>
      <li>完稿後不接受大幅度修改</li>
      <li>個人用途授權，商業用途請另行詢問</li>
    </ul>
  </section>

  {#if isOpen}
    <a href="/apply" class="btn-apply">申請委託</a>
  {/if}
</main>

<style>
.page { max-width: 900px; margin: 0 auto; padding: 0 1rem 4rem; }

.status-banner {
  background: var(--blue);
  color: var(--white);
  padding: 0.6rem 1.2rem;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-bottom: var(--border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  border: 1px solid var(--white);
  flex-shrink: 0;
}
.status-dot.closed { background: var(--red); }

.hero-section {
  padding: 3.5rem 0 2.5rem;
  border-bottom: var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}
.hero-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--blue);
  line-height: 1.1;
}

.steps-strip {
  display: flex;
  margin: 2rem 0;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.step {
  flex: 1;
  padding: 1rem;
  background: var(--white);
  border-right: var(--border);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.step:last-child { border-right: none; }
.step-num {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--blue);
  line-height: 1;
  flex-shrink: 0;
}
.step-text { font-size: 0.85rem; font-weight: 600; color: var(--ink); }

.commission-list { display: flex; flex-direction: column; }
.commission-row {
  display: grid;
  grid-template-columns: 2rem 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1.25rem 1rem;
  border-bottom: var(--border);
  background: var(--white);
  transition: background 0.1s;
}
.commission-row:hover { background: var(--color-background-secondary); }
.commission-row:first-child { border-top: var(--border); }
.row-num {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--blue);
  text-align: center;
}
.row-info h3 {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--ink);
}
.row-info p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0;
}
.row-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.row-price {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink);
}
.detail-btn {
  padding: 0.35rem 0.9rem;
  background: var(--white);
  color: var(--blue);
  border: 1.5px solid var(--blue);
  font-size: 0.8rem;
  font-weight: 700;
  font-family: var(--font-mono);
  cursor: pointer;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: transform 0.08s, box-shadow 0.08s;
}
.detail-btn:hover { transform: translate(-1px, -1px); box-shadow: var(--shadow-md); }

.cta-bar {
  margin-top: 3rem;
  background: var(--red);
  color: var(--white);
  padding: 2rem;
  text-align: center;
  border: var(--border);
  box-shadow: var(--shadow-lg);
}
.cta-bar h2 { font-family: var(--font-display); font-size: 1.8rem; margin: 0 0 1rem; }
.cta-apply {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: var(--white);
  color: var(--ink);
  border: 2px solid var(--ink);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: transform 0.08s, box-shadow 0.08s;
}
.cta-apply:hover { transform: translate(-2px, -2px); box-shadow: var(--shadow-md); }
.cta-note {
  margin-top: 1rem;
  font-size: 0.85rem;
  opacity: 0.8;
}
.cta-note a {
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  opacity: 0.7;
}
.cta-note a:hover { opacity: 1; }

@media (max-width: 640px) {
  .steps-strip { flex-direction: column; }
  .step { border-right: none; border-bottom: var(--border); }
  .step:last-child { border-bottom: none; }
  .commission-row { grid-template-columns: 2rem 1fr; }
  .row-meta { display: none; }
}
</style>
