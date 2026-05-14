<script lang="ts">
  import type { Align, ButtonStyle } from "$lib/types/editor"
  import { t } from "$lib/editor-utils"

  interface Props {
    data: {
      label?: string | { zh: string; en: string }
      url?: string
      style?: ButtonStyle
      align?: Align
      fullWidth?: boolean
    }
    lang?: "zh" | "en"
  }

  let { data, lang = "zh" }: Props = $props()

  const isExternal = $derived(data.url?.startsWith("http"))
  const justify = $derived(
    data.align === "center" ? "center"
    : data.align === "right" ? "flex-end"
    : "flex-start"
  )
</script>

<div class="block-card" style="justify-content: {justify}">
  <a
    href={data.url ?? "#"}
    class="btn {data.style ?? 'solid'}"
    class:full={data.fullWidth}
    target={isExternal ? "_blank" : undefined}
    rel={isExternal ? "noopener" : undefined}
  >
    {t(data.label, lang) || "按鈕"}
    {#if isExternal}<span class="ext">↗</span>{/if}
  </a>
</div>

<style>
  .block-card {
    padding: 0.75rem 1.5rem;
    display: flex;
    border: none;
    background: transparent;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 28px;
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    border: 2px solid var(--ink);
    transition: all 0.1s;
    box-shadow: var(--shadow-sm);
  }

  .btn.solid {
    background: var(--ink);
    color: var(--white);
  }
  .btn.solid:hover {
    background: var(--blue);
    border-color: var(--blue);
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-md);
  }

  .btn.outline {
    background: var(--white);
    color: var(--ink);
  }
  .btn.outline:hover {
    background: var(--ink);
    color: var(--white);
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-md);
  }

  .btn.full { width: 100%; justify-content: center; }

  .ext {
    font-size: 0.75rem;
    opacity: 0.7;
  }
</style>
