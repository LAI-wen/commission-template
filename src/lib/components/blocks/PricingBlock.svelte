<script lang="ts">
  import { t } from "$lib/editor-utils"

  interface Plan {
    name: string | { zh: string; en: string }
    price: string | { zh: string; en: string }
    features: (string | { zh: string; en: string })[]
    recommended?: boolean
  }

  interface Props {
    data: {
      plans?: Plan[]
    }
    accentColor?: string
    lang?: "zh" | "en"
  }

  let { data, accentColor = "#000", lang = "zh" }: Props = $props()

  const plans = $derived(data.plans ?? [])
</script>

<div class="pricing-block" style="--accent: {accentColor}">
  <div class="plans-grid">
    {#each plans as plan}
      <div class="plan-card" class:recommended={plan.recommended}>
        {#if plan.recommended}
          <div class="badge">RECOMMENDED</div>
        {/if}
        <h3 class="name">{t(plan.name, lang)}</h3>
        <div class="price">{t(plan.price, lang)}</div>
        <ul class="features">
          {#each plan.features as feat}
            <li>{t(feat, lang)}</li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</div>

<style>
  .pricing-block { padding: 2rem 0; }
  .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
  .plan-card { position: relative; padding: 32px 24px; background: white; border: 1px solid #f0f0f0; border-radius: 24px; display: flex; flex-direction: column; align-items: center; transition: all 0.3s; }
  .plan-card.recommended { border-color: var(--accent); border-width: 2px; box-shadow: 0 10px 30px color-mix(in srgb, var(--accent) 15%, transparent); transform: scale(1.02); z-index: 1; }
  .badge { position: absolute; top: -12px; background: var(--accent); color: white; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 99px; letter-spacing: 0.05em; }
  .name { font-size: 1.1rem; font-weight: 700; margin: 0 0 8px; opacity: 0.6; }
  .price { font-size: 1.75rem; font-weight: 800; margin-bottom: 24px; color: var(--accent); }
  .features { list-style: none; padding: 0; margin: 0; width: 100%; display: flex; flex-direction: column; gap: 12px; }
  .features li { font-size: 0.95rem; text-align: center; padding-bottom: 12px; border-bottom: 1px solid #f9f9f9; color: #666; }
  .features li:last-child { border-bottom: none; }
  @media (max-width: 600px) { .plan-card.recommended { transform: none; } }
</style>
