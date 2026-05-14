<script lang="ts">
  import type { Align } from "$lib/types/editor"
  import { t } from "$lib/editor-utils"

  interface Props {
    data: {
      title?: string | { zh: string; en: string }
      subtitle?: string | { zh: string; en: string }
      level?: "h2" | "h3"
      align?: Align
    }
    lang?: "zh" | "en"
  }

  let { data, lang = "zh" }: Props = $props()
</script>

<div class="section-block" style="text-align: {data.align ?? 'left'}">
  {#if data.level === "h3"}
    <h3 class="title h3">{t(data.title, lang) || "小標題"}</h3>
  {:else}
    <h2 class="title h2">{t(data.title, lang) || "標題"}</h2>
  {/if}
  {#if data.subtitle}
    <p class="subtitle">{t(data.subtitle, lang)}</p>
  {/if}
</div>

<style>
  .section-block { padding: 1.5rem 0 0.5rem; }
  .title { font-weight: 800; letter-spacing: -0.02em; margin: 0; color: inherit; }
  .h2 { font-size: 1.75rem; }
  .h3 { font-size: 1.25rem; }
  .subtitle { margin: 0.4rem 0 0; font-size: 0.9rem; opacity: 0.5; font-weight: 500; }
</style>
