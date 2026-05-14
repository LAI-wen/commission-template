<script lang="ts">
  interface Props {
    title?: string
    content?: string
    tags?: string[]
    accentColor?: string
  }

  let { title = "個人簡介", content = "", tags = [], accentColor = "#276CE4" }: Props = $props()
</script>

<div class="block-card">
  <div class="block-header">
    <span class="block-label">{title}</span>
  </div>
  {#if content}
    <p class="bio-text">{content}</p>
  {:else}
    <p class="bio-text empty">尚未填寫個人簡介</p>
  {/if}
  {#if tags.length > 0}
    <div class="tags">
      {#each tags as tag}
        <span class="tag">{tag}</span>
      {/each}
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
    margin-bottom: 0.875rem;
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

  .bio-text {
    font-size: 0.95rem;
    line-height: 1.75;
    color: var(--ink);
    opacity: 0.8;
    white-space: pre-wrap;
    margin: 0 0 1rem;
  }
  .bio-text.empty { opacity: 0.3; font-style: italic; }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag {
    padding: 2px 10px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    background: var(--cream);
    border: 1px solid var(--ink);
    color: var(--ink);
    box-shadow: var(--shadow-sm);
  }
</style>
