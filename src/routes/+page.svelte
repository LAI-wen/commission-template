<script lang="ts">
  import type { PageData } from "./$types"
  import CardPreview from "$lib/components/CardPreview.svelte"
  import { DEFAULT_GLOBAL } from "$lib/components/editor/globalDesign"
  import type { GlobalDesign } from "$lib/components/editor/globalDesign"

  let { data }: { data: PageData } = $props()

  function parseServerConfig(): { blocks: any[]; overrides: Record<string, any>; globalDesign?: GlobalDesign } | null {
    try {
      const raw = data.creator?.page_config
      if (!raw) return null
      const p = JSON.parse(raw as string)
      if (Array.isArray(p.blocks) && typeof p.overrides === "object") {
        return { blocks: p.blocks, overrides: p.overrides || {}, globalDesign: p.globalDesign }
      }
    } catch {}
    return null
  }

  const serverConfig = parseServerConfig()
  const editorBlocks   = serverConfig?.blocks ?? []
  const editorOverrides = serverConfig?.overrides ?? {}
  const editorGlobal   = { ...DEFAULT_GLOBAL, ...(serverConfig?.globalDesign ?? {}) } as GlobalDesign
  const hasConfig = !!serverConfig

  const pageBgStyle = $derived(
    [
      `background-color:${editorGlobal.bgColor}`,
      editorGlobal.bgImage ? `background-image:url('${editorGlobal.bgImage}')` : '',
      `background-size:${editorGlobal.bgSize}`,
      `background-repeat:${editorGlobal.bgRepeat}`,
      `background-attachment:${editorGlobal.bgAttachment}`,
      `background-position:center`,
      `filter:brightness(${editorGlobal.bgBrightness}%) blur(${editorGlobal.bgBlur}px) saturate(${editorGlobal.bgSaturation}%)`,
    ].filter(Boolean).join(';')
  )

  const cardWrapStyle = $derived(
    editorGlobal.layoutWidth === 'full'
      ? 'max-width:1200px;padding-left:2rem;padding-right:2rem;'
      : ''
  )

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
  {#if editorGlobal.fontUrl}
    <link rel="stylesheet" href={editorGlobal.fontUrl} />
  {/if}
</svelte:head>

<div class="page-root" style="font-family:{editorGlobal.fontFamily};">
  <div class="page-bg" aria-hidden="true" style={pageBgStyle}></div>
  {#if hasConfig && editorBlocks.length > 0}
    <div class="card-wrap" style={cardWrapStyle}>
      <CardPreview blocks={editorBlocks} overrides={editorOverrides} globalDesign={editorGlobal} types={data.types ?? []} queueData={data.queueData} />
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
  position: relative;
}

.page-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-size: cover;
  background-position: center;
  transition: filter .4s, background-color .4s;
}

.card-wrap {
  position: relative;
  z-index: 1;
  max-width: 520px;
  margin: 0 auto;
  padding: 2rem 1.25rem 5rem;
}

.empty-state {
  position: relative;
  z-index: 1;
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
