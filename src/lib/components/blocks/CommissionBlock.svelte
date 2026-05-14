<script lang="ts">
  import { t } from "$lib/editor-utils"

  interface Props {
    data: {
      title?: string | { zh: string; en: string }
      limit?: number
    }
    types?: any[]
    isOpen?: boolean
    accentColor?: string
    lang?: "zh" | "en"
  }

  let { data, types = [], isOpen = false, accentColor = "#276CE4", lang = "zh" }: Props = $props()

  const limit        = $derived(data.limit ?? 3)
  const visibleTypes = $derived(types.slice(0, limit))
  const hasMore      = $derived(types.length > limit)
</script>

<div class="block-card">
  {#if data.title}
    <div class="block-header">
      <span class="block-label">{t(data.title, lang)}</span>
      {#if !isOpen}
        <span class="closed-tag">
          {lang === "zh" ? "暫停委託" : "Closed"}
        </span>
      {/if}
    </div>
  {/if}

  {#if types.length > 0}
    <div class="type-list">
      {#each visibleTypes as type}
        <a href="/commission/{type.id}" class="type-row">
          <div class="type-info">
            <span class="type-name">{type.name}</span>
            <span class="type-price">
              NT$ {type.base_price?.toLocaleString() ?? 0}
              {lang === "zh" ? " 起" : " up"}
            </span>
          </div>
          <span class="type-arrow">→</span>
        </a>
      {/each}
    </div>

    <div class="footer-row">
      {#if hasMore}
        <a href="/commission" class="view-all">
          {lang === "zh" ? `查看全部 ${types.length} 個項目` : `All ${types.length} items`}
        </a>
      {/if}
      {#if isOpen}
        <a href="/apply" class="apply-btn">
          {lang === "zh" ? "立即申請" : "Apply Now"}
        </a>
      {/if}
    </div>
  {:else}
    <div class="empty">
      <span class="empty-icon">✦</span>
      <p>{lang === "zh" ? "目前暫無委託項目" : "No commissions available"}</p>
    </div>
  {/if}
</div>

<style>
  .block-card {
    padding: 1.25rem 1.5rem;
    border: var(--border);
    background: var(--white);
    box-shadow: var(--shadow-sm);
  }

  .block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.875rem;
    gap: 8px;
  }

  .block-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.4;
  }

  .closed-tag {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 2px 8px;
    border: 1px solid var(--red);
    color: var(--red);
    opacity: 0.7;
  }

  .type-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .type-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border: var(--border);
    border-top: none;
    background: var(--white);
    text-decoration: none;
    color: var(--ink);
    transition: all 0.1s;
  }
  .type-row:first-child { border-top: var(--border); }
  .type-row:hover {
    background: var(--blue);
    color: var(--white);
    border-color: var(--blue);
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-sm);
    z-index: 1;
    position: relative;
  }

  .type-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .type-name {
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .type-price {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    opacity: 0.5;
    transition: opacity 0.1s;
  }
  .type-row:hover .type-price { opacity: 0.8; }

  .type-arrow {
    font-size: 1rem;
    opacity: 0.3;
    transition: opacity 0.1s, transform 0.1s;
  }
  .type-row:hover .type-arrow {
    opacity: 1;
    transform: translate(3px, -3px);
  }

  .footer-row {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .view-all {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--ink);
    opacity: 0.45;
    text-decoration: none;
    padding: 6px 12px;
    border: var(--border);
    transition: all 0.1s;
    flex: 1;
    text-align: center;
  }
  .view-all:hover {
    opacity: 1;
    background: var(--cream);
    box-shadow: var(--shadow-sm);
  }

  .apply-btn {
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--white);
    background: var(--blue);
    border: 2px solid var(--ink);
    padding: 8px 20px;
    text-decoration: none;
    transition: all 0.1s;
    box-shadow: var(--shadow-sm);
  }
  .apply-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-md);
  }

  .empty {
    padding: 2rem;
    text-align: center;
    border: 2px dashed color-mix(in srgb, var(--ink) 12%, transparent);
    color: var(--ink);
    opacity: 0.35;
  }
  .empty-icon { font-size: 1.5rem; display: block; margin-bottom: 6px; }
  .empty p { font-size: 0.85rem; margin: 0; }
</style>
