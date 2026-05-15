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
  {#each links as link}
    {@const platform = getPlatform(link.url)}
    <a
      href={link.url}
      target="_blank"
      rel="noopener"
      class="link-item {displayStyle}"
      title={link.label || platform.name}
    >
      <span class="icon">{platform.icon}</span>
      {#if displayStyle === "pill"}
        <span class="label">{link.label || platform.name}</span>
      {/if}
    </a>
  {/each}
</div>

<style>
  .social-block {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 1rem 0;
  }

  .link-item {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: var(--ink);
    background: var(--white);
    border: var(--border);
    box-shadow: var(--shadow-sm);
    transition: transform 0.1s, box-shadow 0.1s;
  }

  .link-item:hover {
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-md);
  }

  /* Icon style */
  .link-item.icon {
    width: 44px;
    height: 44px;
    font-size: 1.2rem;
  }

  /* Pill style */
  .link-item.pill {
    padding: 8px 16px;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .link-item.pill .icon {
    font-size: 1.1rem;
  }

  .label {
    white-space: nowrap;
  }
</style>
