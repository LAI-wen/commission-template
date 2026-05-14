<script lang="ts">
  import { t } from "$lib/editor-utils"

  interface Props {
    data: {
      content?: string | { zh: string; en: string }
      collapsed?: boolean
    }
    accentColor?: string
    lang?: "zh" | "en"
  }

  let { data, accentColor = "#000", lang = "zh" }: Props = $props()

  let isExpanded = $state(false)
  const shouldCollapse = $derived(data.collapsed && !isExpanded)
</script>

<div class="terms-block" class:collapsed={shouldCollapse} style="--accent: {accentColor}">
  <div class="content">
    <p>{t(data.content, lang) || "請在此輸入委託條款內容..."}</p>
  </div>
  
  {#if shouldCollapse}
    <div class="overlay"></div>
    <button class="expand-btn" onclick={() => isExpanded = true}>
      {lang === 'zh' ? '閱讀完整條款' : 'Read More'} ↓
    </button>
  {/if}
</div>

<style>
  .terms-block { position: relative; padding: 1rem 0; }
  .content { font-size: 0.9rem; line-height: 1.8; color: #666; white-space: pre-wrap; }
  .collapsed { max-height: 200px; overflow: hidden; }
  .overlay { position: absolute; bottom: 0; left: 0; right: 0; height: 100px; background: linear-gradient(to top, white, transparent); z-index: 1; }
  .expand-btn { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 2; background: white; border: 1px solid #eee; padding: 8px 20px; border-radius: 99px; font-size: 0.85rem; font-weight: 700; color: var(--accent); cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
</style>
