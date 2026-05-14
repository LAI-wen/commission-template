<script lang="ts">
  interface Props {
    data: {
      links?: { url: string; label?: string }[]
      style?: "icon" | "pill"
    }
    accentColor?: string
  }

  let { data, accentColor = "#000" }: Props = $props()

  const PLATFORMS: Record<string, { icon: string; name: string; color: string }> = {
    "twitter.com": { icon: "𝕏", name: "Twitter / X", color: "#000" },
    "x.com": { icon: "𝕏", name: "Twitter / X", color: "#000" },
    "facebook.com": { icon: "Facebook", name: "Facebook", color: "#1877F2" },
    "instagram.com": { icon: "Instagram", name: "Instagram", color: "#E4405F" },
    "pixiv.net": { icon: "Pixiv", name: "Pixiv", color: "#0096FA" },
    "github.com": { icon: "GitHub", name: "GitHub", color: "#181717" },
    "youtube.com": { icon: "YouTube", name: "YouTube", color: "#FF0000" },
    "twitch.tv": { icon: "Twitch", name: "Twitch", color: "#9146FF" },
    "discord.com": { icon: "Discord", name: "Discord", color: "#5865F2" }
  }

  function getPlatform(url: string) {
    try {
      const domain = new URL(url).hostname.replace("www.", "")
      return PLATFORMS[domain] || { icon: "🌐", name: domain, color: accentColor }
    } catch {
      return { icon: "🌐", name: "Website", color: accentColor }
    }
  }

  const links = $derived(data.links ?? [])
  const displayStyle = $derived(data.style ?? "icon")
</script>

<div class="social-block" style="--accent: {accentColor}">
  <div class="links-container {displayStyle}">
    {#each links as link}
      {@const platform = getPlatform(link.url)}
      <a 
        href={link.url} 
        target="_blank" 
        rel="noopener" 
        class="link-item" 
        style="--p-color: {platform.color}"
        title={link.label || platform.name}
      >
        <span class="icon">{platform.icon}</span>
        {#if displayStyle === "pill"}
          <span class="label">{link.label || platform.name}</span>
        {/if}
      </a>
    {/each}
  </div>
</div>

<style>
  .social-block {
    padding: 1rem 0;
  }

  .links-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  .link-item {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  /* Icon Style */
  .icon .link-item {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f5f5f5;
    font-size: 1.2rem;
  }
  .icon .link-item:hover {
    background: var(--p-color);
    color: white;
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  /* Pill Style */
  .pill .link-item {
    padding: 8px 16px;
    border-radius: 99px;
    background: #f5f5f5;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .pill .link-item:hover {
    background: #eee;
    transform: translateY(-2px);
  }
  .pill .link-item .icon { font-size: 1.1rem; }

  .label {
    white-space: nowrap;
  }
</style>
