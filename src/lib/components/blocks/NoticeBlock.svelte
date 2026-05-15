<script lang="ts">
  import { onMount } from "svelte"
  import { t } from "$lib/editor-utils"

  interface Props {
    id: string
    data: {
      text?: string | { zh: string; en: string }
      icon?: string
      bgColor?: string
      closable?: boolean
    }
    accentColor?: string
    lang?: "zh" | "en"
  }

  let { id, data, accentColor = "#000", lang = "zh" }: Props = $props()

  let visible = $state(true)
  const storageKey = $derived(`notice_closed_${id}`)

  onMount(() => {
    if (data.closable && localStorage.getItem(storageKey)) {
      visible = false
    }
  })

  function close() {
    visible = false
    if (data.closable) {
      localStorage.setItem(storageKey, "true")
    }
  }
</script>

{#if visible}
  <div class="notice-block" style="--accent: {accentColor}">
    <div class="content">
      {#if data.icon}<span class="icon">{data.icon}</span>{/if}
      <p class="text">{t(data.text, lang) || "公告內容..."}</p>
    </div>
    {#if data.closable}
      <button class="close-btn" onclick={close}>✕</button>
    {/if}
  </div>
{/if}

<style>
  .notice-block {
    position: relative;
    padding: 1.25rem 1.5rem;
    background: color-mix(in srgb, var(--accent) 10%, var(--white));
    border: var(--border);
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .icon {
    font-size: 1.2rem;
  }

  .text {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.5;
    color: var(--ink);
  }

  .close-btn {
    background: none;
    border: 1px solid var(--color-border-secondary);
    font-size: 12px;
    color: var(--color-text-secondary);
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.1s, color 0.1s;
  }

  .close-btn:hover {
    background: var(--ink);
    color: var(--white);
    border-color: var(--ink);
  }
</style>
