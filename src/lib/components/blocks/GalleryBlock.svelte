<script lang="ts">
  import { t } from "$lib/editor-utils"

  interface Props {
    data: {
      title?: string | { zh: string; en: string }
      limit?: number
      columns?: number
    }
    works?: any[]
    accentColor?: string
    lang?: "zh" | "en"
  }

  let { data, works = [], accentColor = "#276CE4", lang = "zh" }: Props = $props()

  const limit        = $derived(data.limit ?? 6)
  const cols         = $derived(data.columns ?? 3)
  const visibleWorks = $derived(works.slice(0, limit))
  const hasMore      = $derived(works.length > limit)

  let selectedWork = $state<any>(null)

  function open(work: any) {
    selectedWork = work
    document.body.style.overflow = "hidden"
  }
  function close() {
    selectedWork = null
    document.body.style.overflow = ""
  }
</script>

<div class="block-card">
  {#if data.title}
    <div class="block-header">
      <span class="block-label">{t(data.title, lang)}</span>
    </div>
  {/if}

  {#if works.length > 0}
    <div class="grid" style="--cols: {cols}">
      {#each visibleWorks as work}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div class="work-item" onclick={() => open(work)}>
          <img src={work.preview_url} alt={work.title ?? "作品"} loading="lazy" />
          <div class="overlay">
            <span class="overlay-icon">🔍</span>
          </div>
        </div>
      {/each}
    </div>
    {#if hasMore}
      <a href="/works" class="view-all">
        {lang === "zh" ? `查看全部 ${works.length} 件作品 →` : `View all ${works.length} works →`}
      </a>
    {/if}
  {:else}
    <div class="empty">
      <span class="empty-icon">🎨</span>
      <p>{lang === "zh" ? "尚無上傳的作品" : "No works uploaded yet"}</p>
    </div>
  {/if}
</div>

<!-- Lightbox -->
{#if selectedWork}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="lightbox" onclick={close}>
    <button class="lightbox-close" onclick={close}>✕</button>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="lightbox-inner" onclick={e => e.stopPropagation()}>
      <img src={selectedWork.preview_url} alt={selectedWork.title ?? "作品"} />
      {#if selectedWork.title || selectedWork.description}
        <div class="lightbox-info">
          {#if selectedWork.title}<h3>{selectedWork.title}</h3>{/if}
          {#if selectedWork.description}<p>{selectedWork.description}</p>{/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .block-card {
    padding: 1.25rem 1.5rem;
    border: var(--border);
    background: var(--white);
    box-shadow: var(--shadow-sm);
  }

  .block-header { margin-bottom: 0.875rem; }

  .block-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.4;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 6px;
  }

  .work-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    cursor: pointer;
    background: var(--cream);
    border: var(--border);
  }
  .work-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
    display: block;
  }
  .work-item:hover img { transform: scale(1.06); }

  .overlay {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, var(--ink) 40%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .work-item:hover .overlay { opacity: 1; }
  .overlay-icon { font-size: 1.5rem; }

  .view-all {
    display: block;
    margin-top: 12px;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--blue);
    text-decoration: none;
    padding: 8px;
    border: 1px solid var(--blue);
    transition: all 0.1s;
  }
  .view-all:hover {
    background: var(--blue);
    color: var(--white);
  }

  .empty {
    padding: 2.5rem;
    text-align: center;
    border: 2px dashed color-mix(in srgb, var(--ink) 15%, transparent);
    color: var(--ink);
    opacity: 0.35;
  }
  .empty-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
  .empty p { font-size: 0.85rem; margin: 0; }

  /* Lightbox */
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: color-mix(in srgb, var(--ink) 88%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .lightbox-close {
    position: absolute;
    top: 20px;
    right: 20px;
    background: var(--white);
    border: var(--border);
    width: 36px;
    height: 36px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink);
    font-weight: 700;
    transition: all 0.1s;
  }
  .lightbox-close:hover {
    background: var(--ink);
    color: var(--white);
  }

  .lightbox-inner {
    max-width: 900px;
    max-height: 90vh;
    background: var(--white);
    border: var(--border);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }
  .lightbox-inner img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    display: block;
  }

  .lightbox-info {
    padding: 16px 20px;
    border-top: var(--border);
  }
  .lightbox-info h3 {
    font-family: var(--font-display);
    font-size: 1.1rem;
    margin: 0 0 6px;
    color: var(--ink);
  }
  .lightbox-info p {
    font-size: 0.85rem;
    color: var(--ink);
    opacity: 0.6;
    margin: 0;
    line-height: 1.6;
  }

  @media (max-width: 500px) {
    .grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
</style>
