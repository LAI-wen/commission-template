<script lang="ts">
  import { onMount } from "svelte"

  interface Props {
    open: boolean
    onClose: () => void
    children?: import('svelte').Snippet
    tabs?: { id: string; label: string }[]
    activeTab?: string
    onTabChange?: (id: string) => void
  }

  let { 
    open = $bindable(), 
    onClose, 
    children, 
    tabs = [], 
    activeTab = $bindable(), 
    onTabChange 
  }: Props = $props()

  let isDragging = $state(false)
  let dragY = $state(0)
  let startY = 0
  let sheetHeight = $state(0)
  let contentRef: HTMLDivElement | undefined = $state()

  // 阻力計算：向上拉時增加阻力
  function getVisualY(y: number) {
    if (y < 0) return Math.atan(-y / 100) * 50 * -1
    return y
  }

  function handlePointerDown(e: PointerEvent) {
    // 只有點擊把手或頂部區域才觸發拖拽
    const target = e.target as HTMLElement
    if (!target.closest('.handle-bar') && !target.closest('.tabs')) return

    isDragging = true
    startY = e.clientY
    dragY = 0
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return
    dragY = e.clientY - startY
  }

  function handlePointerUp() {
    if (!isDragging) return
    isDragging = false
    
    // 如果向下滑動超過 100px 則關閉
    if (dragY > 100) {
      open = false
      onClose?.()
    }
    dragY = 0
  }

  $effect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if open}
  <div
    class="overlay"
    role="button"
    tabindex="0"
    aria-label="關閉底部設定面板"
    onclick={() => { open = false; onClose?.() }}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        open = false
        onClose?.()
      }
    }}
  ></div>
{/if}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="bottom-sheet"
  class:open
  bind:this={contentRef}
  style="transform: translateY({open ? getVisualY(dragY) : 100}%); transition: {isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'}"
>
  <div 
    class="handle-bar" 
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
  >
    <div class="pill"></div>
  </div>

  {#if tabs.length > 0}
    <div class="tabs">
      {#each tabs as tab}
        <button 
          class="tab-btn" 
          class:active={activeTab === tab.id}
          onclick={() => { activeTab = tab.id; onTabChange?.(tab.id) }}
        >
          {tab.label}
        </button>
      {/each}
    </div>
  {/if}

  <div class="content">
    {@render children?.()}
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0;
    background: color-mix(in srgb, var(--ink) 55%, transparent);
    backdrop-filter: blur(2px);
    z-index: 1000;
  }

  .bottom-sheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: var(--white);
    border-top: var(--border);
    z-index: 1001;
    height: 60vh;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
    font-family: var(--font-body);
  }

  .handle-bar {
    padding: 12px 0 8px;
    display: flex;
    justify-content: center;
    cursor: grab;
    touch-action: none;
  }
  .handle-bar:active { cursor: grabbing; }

  .pill {
    width: 36px; height: 4px;
    background: var(--ink);
    opacity: 0.15;
  }

  .tabs {
    display: flex;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border-tertiary, #e5e5e5);
    gap: 0;
  }

  .tab-btn {
    padding: 10px 18px;
    font-size: 11px;
    font-weight: 700;
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
    color: var(--ink);
    opacity: 0.45;
    background: none;
    border: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  .tab-btn.active {
    background: var(--blue);
    color: var(--white);
    opacity: 1;
    border-bottom-color: var(--blue);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 20px 40px;
    overscroll-behavior: contain;
    font-family: var(--font-body);
    color: var(--ink);
  }
</style>
