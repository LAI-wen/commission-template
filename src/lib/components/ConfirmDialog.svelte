<script lang="ts">
  let {
    open      = false,
    title     = '確認操作',
    body      = '',
    confirmLabel = '確認',
    cancelLabel  = '取消',
    danger    = false,
    onconfirm,
    oncancel,
  }: {
    open?:         boolean
    title?:        string
    body?:         string
    confirmLabel?: string
    cancelLabel?:  string
    danger?:       boolean
    onconfirm?:    () => void
    oncancel?:     () => void
  } = $props()

  function confirm() { onconfirm?.() }
  function cancel()  { oncancel?.() }

  function onkeydown(e: KeyboardEvent) {
    if (!open) return
    if (e.key === 'Escape')  cancel()
    if (e.key === 'Enter')   confirm()
  }
</script>

<svelte:window onkeydown={onkeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={e => e.target === e.currentTarget && cancel()}>
    <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
      <div class="dlg-head" class:danger>
        <span id="dlg-title" class="dlg-title">{title}</span>
      </div>
      {#if body}
        <div class="dlg-body">{body}</div>
      {/if}
      <div class="dlg-foot">
        <button class="btn-cancel" onclick={cancel}>{cancelLabel}</button>
        <button class="btn-confirm" class:danger onclick={confirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>
{/if}

<style>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(21,22,45,0.45);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fade-in 0.1s ease;
}
@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }

.dialog {
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 380px;
  animation: slide-up 0.12s ease;
}
@keyframes slide-up { from { transform: translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }

.dlg-head {
  padding: 0.875rem 1.125rem 0.75rem;
  background: var(--ink);
  border-bottom: var(--border);
}
.dlg-head.danger { background: var(--red); }
.dlg-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #fff;
  text-transform: uppercase;
}

.dlg-body {
  padding: 1rem 1.125rem;
  font-size: 0.9rem;
  color: var(--ink);
  line-height: 1.55;
}

.dlg-foot {
  padding: 0.75rem 1.125rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  background: color-mix(in srgb, var(--cream) 60%, var(--white));
  border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.btn-cancel {
  padding: 0.5rem 1rem;
  background: var(--white);
  border: var(--border);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--ink);
  transition: transform 0.08s, box-shadow 0.08s;
}
.btn-cancel:hover { transform: translate(-1px,-1px); box-shadow: var(--shadow-sm); }

.btn-confirm {
  padding: 0.5rem 1.25rem;
  background: var(--blue);
  color: #fff;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.08s, box-shadow 0.08s;
}
.btn-confirm.danger { background: var(--red); }
.btn-confirm:hover { transform: translate(-1px,-1px); box-shadow: var(--shadow-md); }
</style>
