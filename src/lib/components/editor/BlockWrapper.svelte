<script lang="ts">
  interface Props {
    id: string
    type: string
    selected?: boolean
    visible?: boolean
    editing?: boolean
    onSelect?: () => void
    onAction?: (action: 'toggle-visible' | 'delete' | 'edit') => void
    children?: import('svelte').Snippet
    // Drag & Drop props
    dragOver?: boolean
    onDragStart?: (e: DragEvent) => void
    onDragOver?: (e: DragEvent) => void
    onDrop?: (e: DragEvent) => void
    onDragEnd?: () => void
  }

  let {
    id,
    type,
    selected = false,
    visible = true,
    editing = false,
    onSelect,
    onAction,
    children,
    dragOver = false,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd
  }: Props = $props()

  let longPressTimer: ReturnType<typeof setTimeout> | null = null

  function handlePointerDown(e: PointerEvent) {
    if (!editing) return
    
    // Start long press timer for mobile
    longPressTimer = setTimeout(() => {
      if (window.navigator.vibrate) window.navigator.vibrate(50)
      onAction?.('edit')
    }, 400)
  }

  function handlePointerUp() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  function handleDoubleClick() {
    if (editing) {
      onAction?.('edit')
    }
  }

  function handleClick(e: MouseEvent) {
    if (editing) {
      e.stopPropagation()
      onSelect?.()
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="block-wrapper"
  class:editing
  class:selected
  class:visible
  class:drag-over={dragOver}
  draggable={editing}
  onclick={handleClick}
  ondblclick={handleDoubleClick}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointermove={handlePointerUp}
  onpointercancel={handlePointerUp}
  ondragstart={onDragStart}
  ondragover={onDragOver}
  ondrop={onDrop}
  ondragend={onDragEnd}
>
  {#if editing}
    <div class="block-tools">
      <div class="tool-handle" title="拖曳排序">⠿</div>
      <div class="tool-group">
        <button 
          class="tool-btn" 
          onclick={(e) => { e.stopPropagation(); onAction?.('toggle-visible') }}
          title={visible ? "隱藏" : "顯示"}
        >
          {visible ? "👁" : "🚫"}
        </button>
        {#if type !== "profile"}
          <button 
            class="tool-btn danger" 
            onclick={(e) => { e.stopPropagation(); onAction?.('delete') }}
            title="刪除"
          >
            ✕
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <div class="block-content" class:hidden={!visible && editing}>
    {@render children?.()}
  </div>
</div>

<style>
  /* Outer wrapper — no visible style, just layout */
  .block-wrapper {
    position: relative;
    height: 100%;
  }

  /* Inner card appearance when in editing mode */
  .block-wrapper.editing {
    cursor: pointer;
    background: var(--white);
    border: var(--border);
    box-shadow: var(--shadow-md);
    height: 100%;
    overflow: hidden;
    transition: transform 0.08s, box-shadow 0.08s;
    padding: 12px 12px 12px 40px;
    margin-bottom: 8px;
  }

  .block-wrapper.editing:hover {
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0 var(--ink);
  }

  /* Selected state */
  .block-wrapper.editing.selected {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px var(--blue), var(--shadow-md);
  }

  /* Drag-over state */
  .block-wrapper.drag-over {
    border-color: var(--gold) !important;
    box-shadow: 0 0 0 3px var(--gold), var(--shadow-md) !important;
  }

  /* Control bar overlay container */
  .block-tools {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 10;
  }

  /* Drag handle */
  .tool-handle {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink);
    opacity: 0.3;
    font-size: 18px;
    cursor: grab;
    pointer-events: auto;
    user-select: none;
  }
  .tool-handle:active { cursor: grabbing; }

  /* Control button group */
  .tool-group {
    position: absolute;
    top: -1px;
    right: -1px;
    display: flex;
    gap: 2px;
    background: var(--blue);
    border: 1px solid var(--ink);
    padding: 3px 6px;
    z-index: 10;
    opacity: 0;
    transform: translateY(4px);
    transition: all 0.15s;
    pointer-events: auto;
  }

  .block-wrapper.selected .tool-group,
  .block-wrapper.editing:hover .tool-group {
    opacity: 1;
    transform: translateY(0);
  }

  /* Control buttons */
  .tool-btn {
    background: none;
    border: none;
    color: var(--white);
    cursor: pointer;
    font-size: 12px;
    padding: 2px 4px;
    opacity: 0.8;
    transition: opacity 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tool-btn:hover { opacity: 1; }

  .tool-btn.danger:hover {
    color: var(--red);
  }

  .block-content {
    transition: opacity 0.2s;
  }
  .block-content.hidden {
    opacity: 0.35;
  }
</style>
