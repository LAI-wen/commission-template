<script lang="ts">
  import type { Align } from "$lib/types/editor"
  import { t } from "$lib/editor-utils"

  interface Props {
    data: {
      content?: string | { zh: string; en: string }
      align?: Align
    }
    lang?: "zh" | "en"
  }

  let { data, lang = "zh" }: Props = $props()
</script>

<div class="block-card" style="text-align: {data.align ?? 'left'}">
  <p class="text-content">{t(data.content, lang) || "在這裡輸入文字..."}</p>
</div>

<style>
  .block-card {
    padding: 1.25rem 1.5rem;
    border: var(--border);
    background: var(--white);
    box-shadow: var(--shadow-sm);
  }

  .text-content {
    font-size: 0.95rem;
    line-height: 1.8;
    white-space: pre-wrap;
    color: var(--ink);
    opacity: 0.8;
    margin: 0;
  }
</style>
