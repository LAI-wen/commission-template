<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { t } from "$lib/editor-utils"

  interface Props {
    data: {
      targetDate?: string
      label?: string | { zh: string; en: string }
      finishText?: string | { zh: string; en: string }
      style?: "minimal" | "flip"
    }
    accentColor?: string
    lang?: "zh" | "en"
  }

  let { data, accentColor = "#276CE4", lang = "zh" }: Props = $props()

  let timeLeft   = $state({ d: 0, h: 0, m: 0, s: 0 })
  let isFinished = $state(false)
  let timer: any

  function update() {
    if (!data.targetDate) return
    const diff = new Date(data.targetDate).getTime() - Date.now()
    if (diff <= 0) { isFinished = true; clearInterval(timer); return }
    timeLeft = {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }

  onMount(() => { update(); timer = setInterval(update, 1000) })
  onDestroy(() => clearInterval(timer))

  const labelText = $derived(
    t(data.label, lang) ||
    (lang === "zh" ? "距離目標" : "Countdown")
  )
  const finishText = $derived(
    t(data.finishText, lang) ||
    (lang === "zh" ? "時間已到！" : "Time's up!")
  )
</script>

<div class="block-card">
  <div class="block-header">
    <span class="block-label">{labelText}</span>
  </div>

  {#if isFinished}
    <p class="finish-text">{finishText}</p>
  {:else}
    <div class="timer">
      <div class="unit">
        <span class="num">{timeLeft.d}</span>
        <span class="unit-label">{lang === "zh" ? "天" : "D"}</span>
      </div>
      <span class="sep">:</span>
      <div class="unit">
        <span class="num">{String(timeLeft.h).padStart(2, "0")}</span>
        <span class="unit-label">{lang === "zh" ? "時" : "H"}</span>
      </div>
      <span class="sep">:</span>
      <div class="unit">
        <span class="num">{String(timeLeft.m).padStart(2, "0")}</span>
        <span class="unit-label">{lang === "zh" ? "分" : "M"}</span>
      </div>
      <span class="sep">:</span>
      <div class="unit">
        <span class="num">{String(timeLeft.s).padStart(2, "0")}</span>
        <span class="unit-label">{lang === "zh" ? "秒" : "S"}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .block-card {
    padding: 1.25rem 1.5rem;
    border: var(--border);
    background: var(--white);
    box-shadow: var(--shadow-sm);
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

  .timer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .num {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    line-height: 1;
  }

  .unit-label {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--ink);
    opacity: 0.3;
  }

  .sep {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--ink);
    opacity: 0.15;
    padding-bottom: 14px;
  }

  .finish-text {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 900;
    color: var(--blue);
    text-align: center;
    margin: 0;
  }
</style>
