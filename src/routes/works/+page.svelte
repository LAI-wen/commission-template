<script lang="ts">
  import type { PageData } from "./$types"
  import type { Work } from "$lib/db"

  let { data }: { data: PageData } = $props()

  const creator = $derived(data.creator)
  const folders = $derived(data.folders)
  const works = $derived(data.works)
  const activeFolder = $derived(data.activeFolder)

  let lightboxWork = $state<Work | null>(null)
</script>

<svelte:head>
  <title>作品集 · {creator?.display_name}</title>
</svelte:head>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') lightboxWork = null }} />

<main class="page">
  <div class="page-header">
    <a href="/" class="back">← 返回名片</a>
    <h1 class="page-title">作品集</h1>
  </div>

  {#if folders.length > 0}
    <div class="folder-tabs">
      <a href="/works" class="folder-tab" class:active={!activeFolder}>
        全部
      </a>
      {#each folders as folder}
        <a
          href="/works?folder={folder.id}"
          class="folder-tab"
          class:active={activeFolder === folder.id}
        >
          {folder.name}
          <span class="count">{folder.work_count}</span>
        </a>
      {/each}
    </div>
  {/if}

  {#if works.length === 0}
    <div class="empty"><p>此分類目前沒有作品</p></div>
  {:else}
    <div class="works-grid">
      {#each works as work}
        <button
          class="work-item"
          onclick={() => lightboxWork = work}
          aria-label={work.title ?? "作品"}
        >
          <img src={work.preview_url} alt={work.title ?? ""} loading="lazy" class="work-img" />
          {#if work.title}
            <div class="work-overlay">
              <span class="work-title">{work.title}</span>
            </div>
          {/if}
          {#if work.original_url}
            <span class="orig-badge">原圖</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</main>

{#if lightboxWork}
  <div class="lightbox-overlay" onclick={() => lightboxWork = null} role="dialog" aria-modal="true">
    <div class="lightbox" onclick={(e) => e.stopPropagation()}>
      <button class="lightbox-close" onclick={() => lightboxWork = null}>✕</button>
      <img src={lightboxWork.preview_url} alt={lightboxWork.title ?? ""} class="lightbox-img" />
      <div class="lightbox-info">
        {#if lightboxWork.title}
          <p class="lightbox-title">{lightboxWork.title}</p>
        {/if}
        {#if lightboxWork.description}
          <p class="lightbox-desc">{lightboxWork.description}</p>
        {/if}
        {#if lightboxWork.tags && lightboxWork.tags !== '[]'}
          <div class="lightbox-tags">
            {#each JSON.parse(lightboxWork.tags) as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
.page { max-width: 1100px; margin: 0 auto; padding: 0 1rem 4rem; }
.page-header {
  padding: 2.5rem 0 1.5rem;
  border-bottom: var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.back {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  text-decoration: none;
}
.back:hover { color: var(--blue); }
.page-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--blue);
}

.folder-tabs {
  display: flex;
  gap: 0;
  margin: 1.5rem 0;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  width: fit-content;
}
.folder-tab {
  padding: 0.5rem 1rem;
  background: var(--white);
  border-right: var(--border);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  color: var(--ink);
  border-top: none;
  border-bottom: none;
  border-left: none;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.1s;
}
.folder-tab:last-child { border-right: none; }
.folder-tab.active { background: var(--blue); color: var(--white); }
.folder-tab:hover:not(.active) { background: #f0f2ff; }
.count {
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: 0.6;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0;
}
.work-item {
  border: var(--border);
  margin: -1px 0 0 -1px;
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  background: var(--color-background-secondary);
  padding: 0;
}
.work-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  display: block;
}
.work-item:hover .work-img { transform: scale(1.05); }
.work-overlay {
  position: absolute;
  inset: 0;
  background: var(--ink);
  color: var(--white);
  opacity: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1rem;
  transition: opacity 0.2s;
}
.work-item:hover .work-overlay { opacity: 0.9; }
.work-title {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 700;
}
.orig-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--gold);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border: 1px solid var(--ink);
}

.empty {
  text-align: center;
  padding: 4rem 0;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(21,22,45,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox {
  display: grid;
  grid-template-columns: 1fr 320px;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-lg);
  max-width: 1000px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
}
.lightbox-img { width: 100%; height: 100%; object-fit: contain; background: var(--ink); display: block; }
.lightbox-info {
  padding: 1.5rem;
  border-left: var(--border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.lightbox-title { font-family: var(--font-display); font-size: 1.4rem; color: var(--ink); margin: 0; }
.lightbox-desc { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }
.lightbox-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.tag {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 8px;
  background: var(--white);
  border: 1px solid var(--ink);
  color: var(--ink);
}
.work-item:focus-visible {
  outline: 3px solid var(--blue);
  outline-offset: 2px;
  z-index: 1;
}
.lightbox-close:focus-visible {
  outline: 3px solid var(--blue);
  outline-offset: 2px;
}
.lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--white);
  color: var(--ink);
  border: var(--border);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  box-shadow: var(--shadow-sm);
  z-index: 1;
}

@media (max-width: 640px) {
  .lightbox { grid-template-columns: 1fr; }
  .lightbox-info { border-left: none; border-top: var(--border); }
}
</style>
