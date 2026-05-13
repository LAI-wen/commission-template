<script lang="ts">
  import type { PageData } from "./$types"
  import CommissionCard from "$lib/components/CommissionCard.svelte"

  let { data }: { data: PageData } = $props()

  const pending = $derived(data.pending)
  const active = $derived(data.active)
</script>

<h2 class="inbox-title">收件匣</h2>

<section>
  <p class="section-label">
    待確認
    {#if pending.length > 0}（{pending.length}）{/if}
  </p>
  {#if pending.length === 0}
    <p class="empty-state">目前沒有待確認的委託</p>
  {:else}
    <div class="commission-grid">
      {#each pending as commission}
        <CommissionCard {commission} showActions />
      {/each}
    </div>
  {/if}
</section>

<section>
  <p class="section-label">進行中（{active.length}）</p>
  {#if active.length === 0}
    <p class="empty-state">目前沒有進行中的委託</p>
  {:else}
    <div class="commission-grid">
      {#each active as commission}
        <CommissionCard {commission} />
      {/each}
    </div>
  {/if}
</section>

<style>
.inbox-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--blue);
  margin: 0 0 1.25rem;
}
.section-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--color-text-tertiary);
  border-bottom: var(--border);
  padding-bottom: 0.4rem;
  margin-bottom: 1rem;
}
.commission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}
.empty-state {
  padding: 3rem;
  text-align: center;
  border: 1px dashed var(--color-border-secondary);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  margin-bottom: 2.5rem;
}
</style>
