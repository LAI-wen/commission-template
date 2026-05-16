<script lang="ts">
  import { page } from "$app/state"
  import { browser } from "$app/environment"
  
  let icons = $state<Record<string, any>>({
    Inbox: undefined,
    ClipboardList: undefined,
    Image: undefined,
    SlidersHorizontal: undefined,
    BarChart3: undefined,
    Settings: undefined,
    Home: undefined,
    LogOut: undefined,
    Archive: undefined,
  })

  if (browser) {
    import("lucide-svelte/icons/inbox").then(m => icons.Inbox = m.default)
    import("lucide-svelte/icons/clipboard-list").then(m => icons.ClipboardList = m.default)
    import("lucide-svelte/icons/image").then(m => icons.Image = m.default)
    import("lucide-svelte/icons/sliders-horizontal").then(m => icons.SlidersHorizontal = m.default)
    import("lucide-svelte/icons/chart-column").then(m => icons.BarChart3 = m.default)
    import("lucide-svelte/icons/settings").then(m => icons.Settings = m.default)
    import("lucide-svelte/icons/house").then(m => icons.Home = m.default)
    import("lucide-svelte/icons/log-out").then(m => icons.LogOut = m.default)
    import("lucide-svelte/icons/archive").then(m => icons.Archive = m.default)
  }

  const navItems = [
    { href: "/dashboard",          label: "收件匣", iconKey: "Inbox" },
    { href: "/dashboard/editor",   label: "編輯",   iconKey: "Image" },
    { href: "/dashboard/queue",    label: "排單",   iconKey: "ClipboardList" },
    { href: "/dashboard/works",    label: "作品",   iconKey: "Image" },
    { href: "/dashboard/manage",   label: "管理",   iconKey: "SlidersHorizontal" },
    { href: "/dashboard/stats",    label: "統計",   iconKey: "BarChart3" },
    { href: "/dashboard/backup",   label: "備份",   iconKey: "Archive" },
    { href: "/dashboard/settings", label: "設定",   iconKey: "Settings" },
  ]

  let { children } = $props()
  const current = $derived(page.url.pathname)
</script>

<div class="dash-root">
  <aside class="sidebar">
    <div class="sidebar-logo">
      <a href="/" class="logo-mark">
        <span class="logo-text">STUDIO</span>
        <span class="logo-sub">後台管理</span>
      </a>
    </div>

    <div class="nav-group">
      <p class="nav-label">NAVIGATION</p>
      {#each navItems as item}
        <a
          href={item.href}
          class="nav-link"
          class:active={current === item.href}
        >
          <span class="nav-icon" aria-hidden="true">
            {#if browser && icons[item.iconKey]}
              {@const Icon = icons[item.iconKey]}
              <Icon size={16} strokeWidth={2} />
            {/if}
          </span>
          <span>{item.label}</span>
        </a>
      {/each}
    </div>

    <div class="nav-group sidebar-bottom">
      <p class="nav-label">ACCOUNT</p>
      <a href="/" class="nav-link">
        <span class="nav-icon" aria-hidden="true">
          {#if browser && icons.Home}
            {@const HomeIcon = icons.Home}
            <HomeIcon size={16} strokeWidth={2} />
          {/if}
        </span>
        <span>回到名片頁</span>
      </a>
      <form method="POST" action="/api/auth/logout">
        <button type="submit" class="nav-link nav-logout">
          <span class="nav-icon" aria-hidden="true">
            {#if browser && icons.LogOut}
              {@const LogOutIcon = icons.LogOut}
              <LogOutIcon size={16} strokeWidth={2} />
            {/if}
          </span>
          <span>登出</span>
        </button>
      </form>
    </div>
  </aside>

  <div class="dash-main">
    <div class="dash-topbar">
      <span class="dash-page-title">
        {navItems.find(n => n.href === current)?.label ?? 'Dashboard'}
      </span>
    </div>
    <div class="dash-content">
      {@render children()}
    </div>
  </div>
</div>

<style>
.dash-root {
  display: flex;
  min-height: 100vh;
  background: var(--cream);
}

.sidebar {
  width: 224px;
  flex-shrink: 0;
  background: var(--ink);
  color: var(--white);
  display: flex;
  flex-direction: column;
  border-right: 3px solid var(--blue);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  z-index: 10;
}

.sidebar-logo {
  padding: 1.1rem 1.25rem 0.9rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.logo-mark {
  display: flex;
  flex-direction: column;
  text-decoration: none;
}
.logo-text {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--white);
  letter-spacing: 0.04em;
  line-height: 1;
}
.logo-sub {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--gold);
  letter-spacing: 0.15em;
  margin-top: 2px;
}

.nav-group {
  padding: 0.75rem 0;
}
.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.nav-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.25);
  padding: 0 1.25rem;
  margin-bottom: 0.25rem;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 1.25rem;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.1s, color 0.1s;
  width: 100%;
  border-left: 3px solid transparent;
}
.nav-link:hover {
  background: rgba(255,255,255,0.07);
  color: var(--white);
}
.nav-link.active {
  background: rgba(255,255,255,0.12);
  color: var(--white);
  border-left-color: var(--gold);
}
.nav-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.8;
}
.nav-link.active .nav-icon { opacity: 1; }
.nav-logout {
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
}

.dash-main {
  flex: 1;
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.dash-topbar {
  background: var(--white);
  border-bottom: var(--border);
  padding: 0.7rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
}
.dash-page-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--ink);
  letter-spacing: 0.03em;
}
.dash-content {
  padding: 2rem;
  flex: 1;
}

@media (max-width: 900px) {
  .sidebar { width: 56px; }
  .nav-label, .nav-link span:not(.nav-icon), .logo-sub { display: none; }
  .logo-text { font-size: 1rem; }
  .nav-link { justify-content: center; padding: 0.75rem; }
}

@media (max-width: 680px) {
  .dash-root { flex-direction: column; }
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 3px solid var(--blue);
  }
  .nav-group {
    display: flex;
    flex-wrap: wrap;
    padding: 0.5rem;
  }
  .nav-link {
    flex: 1 1 calc(50% - 0.5rem);
    border-left: none;
    border: 1px solid rgba(255,255,255,0.08);
    margin: 0.25rem;
    justify-content: flex-start;
  }
  .sidebar-bottom { margin-top: 0; }
  .dash-topbar, .dash-content { padding-left: 1rem; padding-right: 1rem; }
}
</style>
