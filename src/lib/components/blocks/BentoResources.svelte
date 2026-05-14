<script lang="ts">
  interface Resource {
    name: string
    type: string
    url: string
    isPro?: boolean
  }

  interface Props {
    title?: string
    resources?: Resource[]
    accentColor?: string
  }

  let { title = "相關資源", resources = [], accentColor = "#C89B7B" }: Props = $props()
</script>

<div class="resources-card">
  <div class="header">
    <div class="icon-box" style="--accent: {accentColor}">
      <span class="icon">📦</span>
    </div>
    <h3 class="title">{title}</h3>
  </div>

  <div class="list">
    {#each resources as res}
      <a href={res.url} class="res-item">
        <div class="res-icon">📄</div>
        <div class="res-info">
          <h4 class="name">
            {res.name}
            {#if res.isPro}
              <span class="pro-badge">Pro</span>
            {/if}
          </h4>
          <p class="type">{res.type}</p>
        </div>
        <span class="arrow">↗</span>
      </a>
    {/each}
  </div>
</div>

<style>
  .resources-card {
    background: white;
    border-radius: 24px;
    padding: 32px;
    border: 1px solid #E9E9E7;
    height: 100%;
  }

  .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .icon-box {
    width: 32px; height: 32px; border-radius: 8px;
    background: color-mix(in srgb, var(--accent) 10%, white);
    display: flex; align-items: center; justify-content: center; color: var(--accent);
  }
  .title { font-weight: 700; font-size: 18px; margin: 0; }

  .list { display: flex; flex-direction: column; gap: 12px; }

  .res-item {
    display: flex; align-items: center; gap: 12px; padding: 12px;
    border: 1px solid #F1F1EF; border-radius: 12px;
    text-decoration: none; color: inherit; transition: all 0.2s;
  }
  .res-item:hover { border-color: rgba(200, 155, 123, 0.3); background: rgba(200, 155, 123, 0.05); }

  .res-icon {
    width: 40px; height: 40px; background: #F1F1EF; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(55, 53, 47, 0.4); transition: all 0.2s;
  }
  .res-item:hover .res-icon { background: white; color: #C89B7B; }

  .res-info { flex: 1; }
  .name { font-size: 14px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px; }
  .pro-badge {
    font-size: 8px; background: #FEF3C7; color: #D97706;
    padding: 2px 6px; border-radius: 4px; font-weight: 900; text-transform: uppercase;
  }
  .type { font-size: 10px; color: rgba(55, 53, 47, 0.4); font-family: monospace; letter-spacing: 0.05em; margin: 4px 0 0; }
  
  .arrow { font-size: 14px; color: rgba(55, 53, 47, 0.1); transition: color 0.2s; }
  .res-item:hover .arrow { color: #C89B7B; }
</style>
