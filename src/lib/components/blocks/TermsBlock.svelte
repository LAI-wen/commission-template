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

<div class="terms-block block-card" class:collapsed={shouldCollapse}>
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
  .block-card {
    padding: 1.25rem 1.5rem;
    border: var(--border);
    background: var(--white);
    box-shadow: var(--shadow-sm);
  }
  .terms-block { position: relative; }
  .content { font-size: 0.9rem; line-height: 1.8; color: var(--color-text-secondary); white-space: pre-wrap; }
  .collapsed { max-height: 200px; overflow: hidden; }
  .overlay { position: absolute; bottom: 0; left: 0; right: 0; height: 100px; background: linear-gradient(to top, var(--white), transparent); z-index: 1; }
  .expand-btn {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    background: var(--white);
    border: var(--border);
    border-radius: 0;
    padding: 8px 20px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .expand-btn:hover {
    transform: translateX(-50%) translate(-2px, -2px);
    box-shadow: var(--shadow-md);
  }
</style>
