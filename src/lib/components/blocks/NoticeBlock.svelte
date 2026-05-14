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

  const bg = $derived(data.bgColor || "rgba(0,0,0,0.05)")
</script>

{#if visible}
  <div class="notice-block" style="--bg: {bg}; --accent: {accentColor}">
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
  .notice-block { position: relative; padding: 16px 20px; background: var(--bg); border-radius: 16px; margin: 1rem 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .content { display: flex; align-items: center; gap: 12px; flex: 1; }
  .icon { font-size: 1.2rem; }
  .text { margin: 0; font-size: 0.95rem; font-weight: 500; line-height: 1.5; }
  .close-btn { background: none; border: none; font-size: 14px; color: #888; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
  .close-btn:hover { color: #111; }
</style>
