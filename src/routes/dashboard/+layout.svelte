<script lang="ts">
  import { page } from "$app/state"

  const navItems = [
    { href: "/dashboard", label: "收件匣", icon: "📥" },
    { href: "/dashboard/queue", label: "排單", icon: "📋" },
    { href: "/dashboard/works", label: "作品", icon: "🖼️" },
    { href: "/dashboard/stats", label: "統計", icon: "📊" },
    { href: "/dashboard/settings", label: "設定", icon: "⚙️" },
  ]

  let { children } = $props()
  const current = $derived(page.url.pathname)
</script>

<div class="dash-root">
  <aside class="sidebar">
    <div class="sidebar-logo">
      <a href="/" class="logo-mark">
        STUDIO
        <span>後台管理</span>
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
          <span class="nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </a>
      {/each}
    </div>

    <div class="nav-group sidebar-bottom">
      <p class="nav-label">ACCOUNT</p>
      <a href="/" class="nav-link">
        <span class="nav-icon" aria-hidden="true">🏠</span>
        <span>回到名片頁</span>
      </a>
      <form method="POST" action="/api/auth/logout">
        <button type="submit" class="nav-link nav-logout">
          <span class="nav-icon" aria-hidden="true">🚪</span>
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
}

.sidebar {
  width: 220px;
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
}

.sidebar-logo {
  padding: 1.25rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.logo-mark {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--white);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.logo-mark span {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--gold);
  letter-spacing: 0.08em;
}

.nav-group {
  padding: 1rem 0;
}
.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.nav-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.3);
  padding: 0 1.25rem;
  margin-bottom: 0.5rem;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.1s, color 0.1s;
  width: 100%;
}
.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--white);
}
.nav-link.active {
  background: var(--blue);
  color: var(--white);
  border-right: 3px solid var(--gold);
}
.nav-icon {
  width: 18px;
  text-align: center;
  font-size: 14px;
  flex-shrink: 0;
}
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
}
.dash-topbar {
  background: var(--white);
  border-bottom: var(--border);
  padding: 0.75rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
}
.dash-page-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--ink);
}
.dash-content {
  padding: 2rem;
}

@media (max-width: 900px) {
  .sidebar { width: 60px; }
  .nav-label, .nav-link span, .logo-mark span { display: none; }
  .nav-link { justify-content: center; padding: 0.75rem; }
}
</style>
