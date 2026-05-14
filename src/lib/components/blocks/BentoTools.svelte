<script lang="ts">
  interface Tool {
    name: string
    category: string
    description: string
    icon: string
  }

  interface Props {
    title?: string
    tools?: Tool[]
    accentColor?: string
  }

  let { title = "創作工具", tools = [], accentColor = "#C89B7B" }: Props = $props()
</script>

<div class="tools-card">
  <div class="header">
    <div class="title-group">
      <div class="icon-box" style="--accent: {accentColor}">
        <span class="icon">💻</span>
      </div>
      <h3 class="title">{title}</h3>
    </div>
    <span class="subtitle">Daily Workhorse</span>
  </div>

  <div class="grid">
    {#each tools as tool}
      <div class="tool-item">
        <div class="tool-header">
          <div class="tool-icon">🛠</div>
          <div class="tool-info">
            <p class="category">{tool.category}</p>
            <h4 class="name">{tool.name}</h4>
          </div>
        </div>
        <p class="desc">{tool.description}</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .tools-card {
    background: white;
    border-radius: 24px;
    padding: 32px;
    border: 1px solid #E9E9E7;
    height: 100%;
  }

  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
  .title-group { display: flex; align-items: center; gap: 12px; }
  .icon-box {
    width: 32px; height: 32px; border-radius: 8px;
    background: color-mix(in srgb, var(--accent) 10%, white);
    display: flex; align-items: center; justify-content: center; color: var(--accent);
  }
  .title { font-weight: 700; font-size: 18px; margin: 0; }
  .subtitle { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(55, 53, 47, 0.2); }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }

  .tool-item {
    padding: 20px;
    background: #F1F1EF80;
    border-radius: 16px;
    border: 1px solid #E9E9E7;
    transition: all 0.2s;
  }
  .tool-item:hover { border-color: rgba(200, 155, 123, 0.3); background: white; }

  .tool-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .tool-icon {
    width: 40px; height: 40px; background: white; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(55, 53, 47, 0.4); box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .tool-item:hover .tool-icon { color: #C89B7B; }

  .category { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(55, 53, 47, 0.2); margin: 0; }
  .name { font-weight: 700; font-size: 14px; margin: 0; }
  .desc { font-size: 12px; color: rgba(55, 53, 47, 0.5); line-height: 1.6; margin: 0; }
</style>
