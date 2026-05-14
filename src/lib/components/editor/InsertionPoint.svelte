<script lang="ts">
  interface Props {
    onAdd: () => void
    visible?: boolean
  }

  let { onAdd, visible = false }: Props = $props()
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="insertion"
  class:visible
  onclick={(e) => { e.stopPropagation(); onAdd() }}
>
  <div class="line"></div>
  <button class="add-btn" tabindex="-1">+</button>
  <div class="line"></div>
</div>

<style>
  .insertion {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.18s;
    position: relative;
    z-index: 20;
  }

  /* hover 自己顯示 */
  .insertion:hover { opacity: 1 !important; }

  /* 父元素 hover 時淡顯 */
  :global(.block-list:hover) .insertion { opacity: 0.35; }

  /* visible prop 強制顯示 */
  .insertion.visible { opacity: 1; }

  .line {
    flex: 1;
    height: 1px;
    background: var(--blue);
    opacity: 0.3;
    transition: opacity 0.18s;
  }
  .insertion:hover .line { opacity: 1; }

  .add-btn {
    padding: 0 10px;
    height: 20px;
    background: var(--blue);
    color: var(--white);
    border: 1px solid var(--ink);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    line-height: 1;
    opacity: 0;
    transition: opacity 0.18s;
  }
  .insertion:hover .add-btn { opacity: 1; }
</style>
