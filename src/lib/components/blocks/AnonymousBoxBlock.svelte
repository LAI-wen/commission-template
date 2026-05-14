<script lang="ts">
  import { t } from "$lib/editor-utils"

  interface Props {
    data: {
      url?: string
      label?: string | { zh: string; en: string }
      title?: string | { zh: string; en: string }
      placeholder?: string | { zh: string; en: string }
    }
    accentColor?: string
    lang?: "zh" | "en"
  }

  let { data, accentColor = "#276CE4", lang = "zh" }: Props = $props()

  const title = $derived(
    t(data.title, lang) ||
    t(data.label, lang) ||
    (lang === "zh" ? "匿名提問" : "Ask Me")
  )
  const placeholder = $derived(
    t(data.placeholder, lang) ||
    (lang === "zh" ? "輸入你的問題..." : "Type your question...")
  )
</script>

<div class="block-card">
  <!-- 裝飾背景 icon -->
  <div class="deco-icon" aria-hidden="true">💬</div>

  <div class="block-header">
    <span class="block-label">{title}</span>
  </div>

  {#if data.url}
    <!-- 外部連結版（如 marshmallow） -->
    <a href={data.url} target="_blank" rel="noopener" class="ext-link">
      <span class="ext-icon">🍬</span>
      <span>{lang === "zh" ? "前往提問頁面" : "Go to question page"}</span>
      <span class="ext-arrow">↗</span>
    </a>
  {:else}
    <!-- 內建版（直接在此頁面送出） -->
    <div class="input-area">
      <div class="fake-input">{placeholder}</div>
      <button class="send-btn" disabled>
        {lang === "zh" ? "送出" : "Send"}
      </button>
    </div>
    <p class="hint">
      {lang === "zh" ? "訪客可以匿名向你提問" : "Visitors can ask you anonymously"}
    </p>
  {/if}
</div>

<style>
  .block-card {
    padding: 1.25rem 1.5rem;
    border: var(--border);
    background: var(--white);
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
  }

  .deco-icon {
    position: absolute;
    top: -10px;
    right: -10px;
    font-size: 72px;
    opacity: 0.04;
    transform: rotate(10deg);
    pointer-events: none;
    user-select: none;
  }

  .block-header { margin-bottom: 0.875rem; }

  .block-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.4;
  }

  /* 外部連結版 */
  .ext-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--cream);
    border: var(--border);
    text-decoration: none;
    color: var(--ink);
    font-weight: 700;
    font-size: 0.9rem;
    transition: all 0.1s;
    box-shadow: var(--shadow-sm);
  }
  .ext-link:hover {
    background: var(--blue);
    color: var(--white);
    border-color: var(--blue);
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-md);
  }
  .ext-icon { font-size: 1.1rem; }
  .ext-arrow { margin-left: auto; opacity: 0.5; transition: opacity 0.1s; }
  .ext-link:hover .ext-arrow { opacity: 1; }

  /* 內建版 */
  .input-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .fake-input {
    padding: 10px 14px;
    border: var(--border);
    background: var(--cream);
    font-size: 0.9rem;
    color: var(--ink);
    opacity: 0.35;
    min-height: 60px;
  }

  .send-btn {
    align-self: flex-end;
    padding: 7px 20px;
    background: var(--ink);
    color: var(--white);
    border: 2px solid var(--ink);
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: not-allowed;
    opacity: 0.5;
  }

  .hint {
    margin: 8px 0 0;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--ink);
    opacity: 0.3;
  }
</style>
