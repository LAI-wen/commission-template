<script lang="ts">
  interface Props {
    onAdd: () => void
    visible?: boolean
  }

  let { onAdd, visible = false }: Props = $props()
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="insertion-point" class:visible onclick={(e) => { e.stopPropagation(); onAdd() }}>
  <div class="line"></div>
  <button class="add-btn">+</button>
  <div class="line"></div>
</div>

<style>
  /* Outer row */
  .insertion-point {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 4px 0;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    position: relative;
    z-index: 20;
  }

  .insertion-point:hover,
  .insertion-point.visible {
    opacity: 1;
  }

  /* Horizontal dashed line */
  .line {
    flex: 1;
    border-top: 2px dashed var(--blue);
    opacity: 0.3;
    transition: opacity 0.2s;
  }

  .insertion-point:hover .line {
    opacity: 1;
  }

  /* Add button — ACS flat style */
  .add-btn {
    padding: 2px 10px;
    background: var(--blue);
    color: var(--white);
    border: 1px solid var(--ink);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .insertion-point:hover .add-btn {
    opacity: 1;
  }
</style>
