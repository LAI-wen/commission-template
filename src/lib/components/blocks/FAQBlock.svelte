<script lang="ts">
  import { t } from "$lib/editor-utils"

  interface FAQItem {
    question: string | { zh: string; en: string }
    answer: string | { zh: string; en: string }
  }

  interface Props {
    data: {
      items?: FAQItem[]
    }
    accentColor?: string
    lang?: "zh" | "en"
  }

  let { data, accentColor = "#000", lang = "zh" }: Props = $props()

  const items = $derived(data.items ?? [
    { question: "這是一個常見問題嗎？", answer: "是的，這是在這裡輸入的答案。" }
  ])

  let openIndex = $state<number | null>(null)

  function toggle(i: number) {
    openIndex = openIndex === i ? null : i
  }
</script>

<div class="faq-block" style="--accent: {accentColor}">
  <div class="items">
    {#each items as item, i}
      <div class="faq-item" class:open={openIndex === i}>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="question" onclick={() => toggle(i)}>
          <span class="q-text">{t(item.question, lang)}</span>
          <span class="arrow">↓</span>
        </div>
        {#if openIndex === i}
          <div class="answer">
            <p>{t(item.answer, lang)}</p>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .faq-block {
    padding: 1rem 0;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .faq-item {
    border: var(--border);
    background: var(--white);
    overflow: hidden;
    transition: box-shadow 0.1s;
  }

  .faq-item.open {
    box-shadow: var(--shadow-sm);
  }

  .question {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    transition: background 0.1s;
  }

  .question:hover {
    background: var(--cream);
  }

  .q-text {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--ink);
  }

  .arrow {
    font-size: 14px;
    color: var(--color-text-tertiary);
    transition: transform 0.3s;
  }

  .open .arrow {
    transform: rotate(180deg);
  }

  .answer {
    padding: 0 20px 20px;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  .answer p {
    margin: 0;
  }
</style>
