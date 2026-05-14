<script lang="ts">
  interface Link {
    label: string
    url: string
    icon?: string
  }

  interface Props {
    title?: string
    links?: Link[]
    accentColor?: string
  }

  let { title = "聯繫我", links = [], accentColor = "#276CE4" }: Props = $props()
</script>

<div class="block-card">
  <div class="block-header">
    <span class="block-label">{title}</span>
  </div>

  <div class="link-list">
    {#each links as link}
      <a href={link.url} target="_blank" rel="noopener" class="link-item">
        <span class="link-label">{link.label}</span>
        <span class="link-arrow">↗</span>
      </a>
    {/each}
    {#if links.length === 0}
      <p class="empty">尚未設定聯繫方式</p>
    {/if}
  </div>
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

  .link-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .link-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border: var(--border);
    background: var(--cream);
    text-decoration: none;
    color: var(--ink);
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.1s;
    box-shadow: var(--shadow-sm);
  }
  .link-item:hover {
    background: var(--blue);
    color: var(--white);
    border-color: var(--blue);
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-md);
  }

  .link-arrow {
    font-size: 0.9rem;
    opacity: 0.4;
    transition: opacity 0.1s;
  }
  .link-item:hover .link-arrow { opacity: 1; }

  .empty {
    font-size: 0.85rem;
    color: var(--ink);
    opacity: 0.3;
    font-style: italic;
    text-align: center;
    padding: 1rem 0;
  }
</style>
