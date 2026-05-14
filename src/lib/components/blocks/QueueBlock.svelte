<script lang="ts">
  import { t } from "$lib/editor-utils"

  interface Props {
    data: {
      current?: number
      total?: number
      label?: string | { zh: string; en: string }
    }
    accentColor?: string
    lang?: "zh" | "en"
  }

  let { data, accentColor = "#000", lang = "zh" }: Props = $props()

  const current = $derived(data.current ?? 0)
  const total = $derived(data.total ?? 10)
  const percentage = $derived(Math.min(100, Math.max(0, (current / total) * 100)))
</script>

<div class="queue-block" style="--accent: {accentColor}">
  <div class="header">
    <span class="label">{t(data.label, lang) || "目前排單進度"}</span>
    <span class="status">{current} / {total}</span>
  </div>
  <div class="progress-track">
    <div class="progress-bar" style="width: {percentage}%"></div>
  </div>
</div>

<style>
  .queue-block { padding: 1.5rem 0; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .label { font-size: 0.9rem; font-weight: 600; color: #666; }
  .status { font-size: 1rem; font-weight: 800; color: var(--accent); }
  .progress-track { height: 12px; background: #f0f0f0; border-radius: 6px; overflow: hidden; }
  .progress-bar { height: 100%; background: var(--accent); border-radius: 6px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
</style>
