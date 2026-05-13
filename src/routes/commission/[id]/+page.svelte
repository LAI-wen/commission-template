<script lang="ts">
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  const type = $derived(data.type)
  const options = $derived(data.options)
  const creator = $derived(data.creator)
  const isOpen = $derived(creator?.is_open === 1)

  const addOptions = $derived(options.filter((o: any) => o.option_type === "add"))
  const multiplyOptions = $derived(options.filter((o: any) => o.option_type === "multiply"))

  let selected = $state(new Set<string>())
  let selectedMultiply = $state<string | null>(null)

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selected = next
  }

  const estimatedPrice = $derived((() => {
    let price = type.base_price
    for (const opt of addOptions) {
      if (selected.has((opt as any).id)) price += (opt as any).price_delta
    }
    const mult = multiplyOptions.find((o: any) => o.id === selectedMultiply)
    if (mult) price = Math.round(price * (mult as any).price_multiplier)
    return price
  })())

  const selectedOptionsJson = $derived(
    JSON.stringify(
      options
        .filter((o: any) => selected.has(o.id) || o.id === selectedMultiply)
        .map((o: any) => ({
          option_id: o.id,
          label: o.label,
          price_delta: o.price_delta,
          price_multiplier: o.price_multiplier,
        }))
    )
  )
</script>

<svelte:head>
  <title>{type.name} · {creator?.display_name}</title>
</svelte:head>

<main class="page">
  <div class="page-header">
    <nav class="breadcrumb">
      <a href="/commission">委託說明</a>
      <span>›</span>
      <span>{type.name}</span>
    </nav>
    <h1 class="type-title">{type.name}</h1>
    {#if type.description}
      <p class="type-desc">{type.description}</p>
    {/if}
  </div>

  <div class="content-grid">
    <!-- 左欄：選項 -->
    <div>
      {#if addOptions.length > 0}
        <div class="section-block">
          <div class="section-block-header">加購選項</div>
          <div class="section-block-body">
            <div class="option-group">
              <span class="option-label">選擇加購項目</span>
              {#each addOptions as opt}
                <label class="option-item">
                  <input
                    type="checkbox"
                    checked={selected.has((opt as any).id)}
                    onchange={() => toggle((opt as any).id)}
                  />
                  <span>{(opt as any).label}</span>
                  <span class="option-price">
                    +NT$ {(opt as any).price_delta.toLocaleString()}
                  </span>
                </label>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      {#if multiplyOptions.length > 0}
        <div class="section-block">
          <div class="section-block-header">角色數 / 倍率</div>
          <div class="section-block-body">
            <div class="option-group">
              <span class="option-label">選擇角色數</span>
              {#each multiplyOptions as opt}
                <label class="option-item">
                  <input
                    type="radio"
                    name="multiply"
                    value={(opt as any).id}
                    bind:group={selectedMultiply}
                  />
                  <span>{(opt as any).label}</span>
                  <span class="option-price">×{(opt as any).price_multiplier}</span>
                </label>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- 右欄：估價卡 -->
    <div class="price-card">
      <div class="price-card-header">估價</div>
      <div class="price-card-body">
        <span class="price-total">NT$ {estimatedPrice.toLocaleString()}</span>
        <div class="price-breakdown">
          <div class="breakdown-row">
            <span>基本價格</span>
            <span>NT$ {type.base_price.toLocaleString()}</span>
          </div>
          {#each addOptions as opt}
            {#if selected.has((opt as any).id)}
              <div class="breakdown-row">
                <span>{(opt as any).label}</span>
                <span>+NT$ {(opt as any).price_delta.toLocaleString()}</span>
              </div>
            {/if}
          {/each}
          {#if selectedMultiply}
            {#each multiplyOptions as opt}
              {#if (opt as any).id === selectedMultiply}
                <div class="breakdown-row">
                  <span>{(opt as any).label}</span>
                  <span>×{(opt as any).price_multiplier}</span>
                </div>
              {/if}
            {/each}
          {/if}
        </div>
        {#if isOpen}
          <a
            href="/apply?type={type.id}&price={estimatedPrice}&options={encodeURIComponent(selectedOptionsJson)}"
            class="apply-link"
          >
            以此項目申請委託
          </a>
        {:else}
          <div>目前暫停委託中</div>
        {/if}
      </div>
    </div>
  </div>
</main>

<style>
.page { max-width: 960px; margin: 0 auto; padding: 0 1rem 4rem; }

.page-header {
  padding: 2.5rem 0 2rem;
  border-bottom: var(--border);
}
.breadcrumb {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.breadcrumb a { color: var(--blue); text-decoration: none; font-weight: 700; }
.breadcrumb a:hover { text-decoration: underline; }
.type-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--ink);
}
.type-desc {
  margin-top: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2rem;
  margin-top: 2rem;
  align-items: start;
}

.section-block {
  border: var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.section-block-header {
  background: var(--blue);
  color: var(--white);
  padding: 0.6rem 1rem;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  border-bottom: var(--border);
}
.section-block-body { padding: 1.25rem; }

.option-group { margin-bottom: 1rem; }
.option-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
  display: block;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 0;
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--ink);
}
.option-item input { cursor: pointer; accent-color: var(--blue); }
.option-price {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--blue);
  font-weight: 700;
}

.price-card {
  border: var(--border);
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 1rem;
  overflow: hidden;
}
.price-card-header {
  background: var(--ink);
  color: var(--white);
  padding: 1rem 1.25rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
  border-bottom: var(--border);
}
.price-card-body { padding: 1.25rem; background: var(--white); }
.price-total {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--blue);
  margin: 1rem 0;
  display: block;
}
.price-breakdown { font-family: var(--font-mono); font-size: 12px; }
.breakdown-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid var(--color-border-tertiary);
  color: var(--ink);
}
.apply-link {
  display: block;
  width: 100%;
  padding: 0.85rem;
  background: var(--red);
  color: var(--white);
  border: var(--border);
  text-align: center;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  margin-top: 1rem;
  transition: transform 0.08s, box-shadow 0.08s;
}
.apply-link:hover { transform: translate(-1px, -1px); box-shadow: var(--shadow-md); }

@media (max-width: 768px) {
  .content-grid { grid-template-columns: 1fr; }
  .price-card { position: static; }
}
</style>
