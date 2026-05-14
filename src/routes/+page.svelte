<script lang="ts">
  import type { PageData } from "./$types"
  import CardPreview from "$lib/components/CardPreview.svelte"

  let { data }: { data: PageData } = $props()

  function parseServerConfig(): { blocks: any[]; overrides: Record<string, any> } | null {
    try {
      const raw = data.creator?.page_config
      if (!raw) return null
      const p = JSON.parse(raw as string)
      if (Array.isArray(p.blocks) && typeof p.overrides === "object") {
        return { blocks: p.blocks, overrides: p.overrides || {} }
      }
    } catch {}
    return null
  }

  const serverConfig = parseServerConfig()
  let editorBlocks = $state<any[]>(serverConfig?.blocks ?? [])
  let editorOverrides = $state<Record<string, any>>(serverConfig?.overrides ?? {})
  let hasConfig = $state(!!serverConfig)

  $effect(() => {
    try {
      const lb = localStorage.getItem("card_blocks")
      const lo = localStorage.getItem("card_overrides")
      if (lb) {
        const blocks = JSON.parse(lb)
        if (Array.isArray(blocks) && blocks.length > 0) {
          editorBlocks = blocks
          editorOverrides = lo ? JSON.parse(lo) : {}
          hasConfig = true
        }
      }
    } catch {}
  })

  const displayName = $derived(() => {
    const n = data.creator?.display_name
    if (!n) return ""
    if (typeof n === "string") return n
    if (typeof n === "object") return (n as any).zh ?? (n as any).en ?? ""
    return ""
  })
</script>

<svelte:head>
  <title>{displayName()}</title>
</svelte:head>

<div class="page-root">
  {#if hasConfig && editorBlocks.length > 0}
    <div class="card-wrap">
      <CardPreview blocks={editorBlocks} overrides={editorOverrides} />
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">✦</div>
      <p class="empty-text">頁面尚未設定</p>
      {#if data.isArtist}
        <a href="/dashboard/editor" class="setup-btn">前往設定頁面</a>
      {/if}
    </div>
  {/if}

  {#if data.isArtist}
    <a href="/dashboard/editor" class="edit-fab" title="編輯頁面">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
    </a>
  {/if}
</div>

<style>
.page-root {
  min-height: 100vh;
  background: var(--cream);
  position: relative;
}

.card-wrap {
  max-width: 520px;
  margin: 0 auto;
  padding: 2rem 1.25rem 5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--blue);
  opacity: 0.4;
}

.empty-text {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink);
  opacity: 0.4;
  margin: 0;
}

.setup-btn {
  padding: 0.5rem 1.25rem;
  background: var(--blue);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-decoration: none;
  border: 2px solid var(--blue);
  transition: all 0.1s;
}
.setup-btn:hover {
  background: var(--white);
  color: var(--blue);
}

.edit-fab {
  position: fixed;
  bottom: 24px;
  right: 20px;
  z-index: 100;
  width: 48px;
  height: 48px;
  background: var(--ink);
  color: var(--white);
  border: 2px solid var(--blue);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: transform 0.1s, box-shadow 0.1s;
}
.edit-fab:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--blue);
}
</style>
