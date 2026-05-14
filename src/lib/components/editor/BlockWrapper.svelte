<script lang="ts">
  interface Props {
    id: string
    type: string
    selected?: boolean
    visible?: boolean
    editing?: boolean
    onSelect?: () => void
    onAction?: (action: "toggle-visible" | "delete" | "edit") => void
    children?: import("svelte").Snippet
    dragOver?: boolean
    onDragStart?: (e: DragEvent) => void
    onDragOver?: (e: DragEvent) => void
    onDrop?: (e: DragEvent) => void
    onDragEnd?: () => void
  }

  let {
    id, type,
    selected = false,
    visible = true,
    editing = false,
    onSelect, onAction, children,
    dragOver = false,
    onDragStart, onDragOver, onDrop, onDragEnd,
  }: Props = $props()

  let longPressTimer: ReturnType<typeof setTimeout> | null = null

  function handlePointerDown(e: PointerEvent) {
    if (!editing) return
    longPressTimer = setTimeout(() => {
      if (window.navigator.vibrate) window.navigator.vibrate(50)
      onAction?.("edit")
    }, 400)
  }

  function handlePointerUp() {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  }

  function handleDoubleClick() {
    if (editing) onAction?.("edit")
  }

  function handleClick(e: MouseEvent) {
    if (editing) { e.stopPropagation(); onSelect?.() }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div
  class="block-wrap"
  class:editing
  class:selected
  class:invisible={!visible && editing}
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
  <!-- 拖拉把手 + 工具列（僅編輯模式） -->
  {#if editing}
    <div class="tools-wrap">
      <!-- ⠿ 把手 -->
      <div class="drag-handle" title="拖曳排序">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9"  cy="5"  r="1" fill="currentColor"/>
          <circle cx="9"  cy="12" r="1" fill="currentColor"/>
          <circle cx="9"  cy="19" r="1" fill="currentColor"/>
          <circle cx="15" cy="5"  r="1" fill="currentColor"/>
          <circle cx="15" cy="12" r="1" fill="currentColor"/>
          <circle cx="15" cy="19" r="1" fill="currentColor"/>
        </svg>
      </div>

      <!-- 操作按鈕群 -->
      <div class="tool-group">
        <button
          class="tool-btn"
          onclick={(e) => { e.stopPropagation(); onAction?.("toggle-visible") }}
          title={visible ? "隱藏" : "顯示"}
        >
          {visible ? "👁" : "🚫"}
        </button>
        {#if type !== "profile"}
          <button
            class="tool-btn tool-btn--danger"
            onclick={(e) => { e.stopPropagation(); onAction?.("delete") }}
            title="刪除"
          >✕</button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- 內容 -->
  <div class="block-content" class:faded={!visible && editing}>
    {@render children?.()}
  </div>
</div>

<style>
  /* ── 基礎 ── */
  .block-wrap {
    position: relative;
    margin-bottom: 2px;
  }

  /* ── 編輯模式 ── */
  .block-wrap.editing {
    cursor: pointer;
    padding-left: 36px;   /* 為 drag handle 騰出空間 */
    padding-top: 2px;
    padding-bottom: 2px;
    transition: outline 0.12s;
  }

  /* ── 選中狀態 ── */
  .block-wrap.editing.selected {
    outline: 2px solid var(--blue);
    outline-offset: 2px;
  }

  /* ── 拖拉 over ── */
  .block-wrap.drag-over {
    outline: 2px solid var(--gold) !important;
    outline-offset: 2px;
  }

  /* ── 隱藏中 ── */
  .invisible { opacity: 0.4; }
  .block-content.faded { opacity: 0.35; }

  /* ── 工具列容器 ── */
  .tools-wrap {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 20;
  }

  /* ── 拖拉把手 ── */
  .drag-handle {
    position: absolute;
    left: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 26px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink);
    opacity: 0.2;
    cursor: grab;
    pointer-events: auto;
    user-select: none;
    transition: opacity 0.15s;
  }
  .block-wrap:hover .drag-handle,
  .block-wrap.selected .drag-handle {
    opacity: 0.55;
  }
  .drag-handle:active { cursor: grabbing; opacity: 0.9; }

  /* ── 操作按鈕群 ── */
  .tool-group {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    background: var(--blue);
    border: 1px solid var(--ink);
    padding: 2px 4px;
    gap: 2px;
    pointer-events: auto;
    /* 預設隱藏，hover / selected 才顯示 */
    opacity: 0;
    transform: translateY(-2px);
    transition: opacity 0.15s, transform 0.15s;
  }
  .block-wrap:hover .tool-group,
  .block-wrap.selected .tool-group {
    opacity: 1;
    transform: translateY(0);
  }

  .tool-btn {
    background: none;
    border: none;
    color: var(--white);
    cursor: pointer;
    font-size: 11px;
    padding: 2px 5px;
    opacity: 0.85;
    transition: opacity 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .tool-btn:hover { opacity: 1; }
  .tool-btn--danger:hover { color: var(--red); }
</style>
