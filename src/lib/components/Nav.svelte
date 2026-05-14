<script lang="ts">
  import { page } from "$app/state"

  let { isArtist = false }: { isArtist?: boolean } = $props()

  const links = [
    { href: "/",          label: "首頁" },
    { href: "/works",     label: "作品集" },
    { href: "/commission",label: "委託資訊" },
    { href: "/status",    label: "查詢進度" },
  ]

  function isActive(href: string) {
    if (href === "/") return page.url.pathname === "/"
    return page.url.pathname.startsWith(href)
  }

  let menuOpen = $state(false)
</script>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo">STUDIO</a>

    <div class="nav-links" class:open={menuOpen}>
      {#each links as link}
        <a
          href={link.href}
          class="nav-link"
          class:active={isActive(link.href)}
          onclick={() => menuOpen = false}
        >
          {link.label}
        </a>
      {/each}
      <a href="/commission" class="nav-cta" onclick={() => menuOpen = false}>申請委託</a>
      {#if isArtist}
        <a href="/dashboard" class="nav-artist active" onclick={() => menuOpen = false}>後台 →</a>
      {:else}
        <a href="/dashboard/login" class="nav-artist" onclick={() => menuOpen = false}>登入</a>
      {/if}
    </div>

    <button
      class="hamburger"
      aria-label="開啟選單"
      aria-expanded={menuOpen}
      onclick={() => menuOpen = !menuOpen}
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</nav>

{#if menuOpen}
  <div class="menu-backdrop" onclick={() => menuOpen = false} role="presentation"></div>
{/if}

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--white);
    border-bottom: var(--border);
    box-shadow: var(--shadow-sm);
  }

  .nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-logo {
    font-family: var(--font-display);
    font-size: 1.3rem;
    color: var(--blue);
    text-decoration: none;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .nav-link {
    padding: 0.45rem 0.875rem;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--color-text-secondary);
    text-decoration: none;
    border-right: 1px solid var(--color-border-tertiary);
    transition: color 0.1s, background 0.1s;
    white-space: nowrap;
    height: 52px;
    display: flex;
    align-items: center;
  }
  .nav-link:first-child { border-left: 1px solid var(--color-border-tertiary); }
  .nav-link:hover { color: var(--blue); background: var(--color-background-secondary); }
  .nav-link.active { color: var(--blue); font-weight: 700; background: var(--color-background-secondary); }

  .nav-cta {
    margin-left: 1rem;
    padding: 0.45rem 1.1rem;
    background: var(--blue);
    color: var(--white);
    border: var(--border);
    box-shadow: var(--shadow-sm);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-decoration: none;
    transition: transform 0.08s, box-shadow 0.08s;
    white-space: nowrap;
  }
  .nav-cta:hover {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }

  .nav-artist {
    margin-left: 0.5rem;
    padding: 0.35rem 0.875rem;
    background: none;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-secondary);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-decoration: none;
    transition: color 0.1s, border-color 0.1s;
    white-space: nowrap;
  }
  .nav-artist:hover { color: var(--blue); border-color: var(--blue); }
  .nav-artist.active { color: var(--blue); border-color: var(--blue); }

  .hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }
  .hamburger span {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--ink);
    transition: transform 0.15s;
  }

  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
    background: rgba(21, 22, 45, 0.3);
  }

  @media (max-width: 640px) {
    .hamburger { display: flex; }

    .nav-links {
      display: none;
      position: absolute;
      top: 52px;
      left: 0;
      right: 0;
      background: var(--white);
      border-bottom: var(--border);
      box-shadow: var(--shadow-md);
      flex-direction: column;
      align-items: stretch;
      z-index: 100;
      gap: 0;
    }
    .nav-links.open { display: flex; }

    .nav-link {
      height: auto;
      padding: 0.875rem 1.5rem;
      border-right: none;
      border-bottom: 1px solid var(--color-border-tertiary);
      font-size: 13px;
    }
    .nav-link:first-child { border-left: none; }

    .nav-cta {
      margin: 0.75rem 1.5rem;
      text-align: center;
      display: block;
    }
  }
</style>
