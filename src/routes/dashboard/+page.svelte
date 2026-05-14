<script lang="ts">
  import type { PageData } from "./$types"
  import CommissionCard from "$lib/components/CommissionCard.svelte"
  import { enhance } from "$app/forms"

  let { data }: { data: PageData } = $props()

  const pending = $derived(data.pending)
  const active = $derived(data.active)
  const notifications = $derived((data as any).notifications ?? [])
  const unreadCount = $derived((data as any).unreadCount ?? 0)
</script>

<h2 class="inbox-title">收件匣</h2>

<section class="notice-panel">
  <div class="notice-head">
    <p class="section-label">站內通知 {#if unreadCount > 0}（{unreadCount}）{/if}</p>
    {#if unreadCount > 0}
      <form method="POST" action="?/markAllNotificationsRead" use:enhance>
        <button class="tiny-btn" type="submit">全部設為已讀</button>
      </form>
    {/if}
  </div>
  {#if notifications.length === 0}
    <p class="empty-state">目前沒有站內通知</p>
  {:else}
    <div class="notify-list">
      {#each notifications as item}
        <article class="notify-item" class:read={item.is_read === 1}>
          <div class="notify-top">
            <div>
              <div class="notify-title">{item.title}</div>
              <div class="notify-body">{item.body}</div>
            </div>
            <span class="notify-dot" class:unread={item.is_read === 0}></span>
          </div>
          <div class="notify-actions">
            {#if item.link_url}
              <a class="notify-link" href={item.link_url}>開啟</a>
            {/if}
            {#if item.is_read === 0}
              <form method="POST" action="?/markNotificationRead" use:enhance>
                <input type="hidden" name="id" value={item.id} />
                <button class="notify-read" type="submit">標記已讀</button>
              </form>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

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
.notice-panel {
  margin-bottom: 2rem;
  padding: 1rem;
  border: var(--border);
  background: var(--white);
}
.notice-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
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
.tiny-btn {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  border: var(--border);
  background: var(--white);
  cursor: pointer;
}
.notify-list {
  display: grid;
  gap: 0.75rem;
}
.notify-item {
  padding: 0.85rem;
  border: 1px solid var(--color-border-tertiary);
  background: rgba(255,255,255,0.95);
}
.notify-item.read { opacity: 0.72; }
.notify-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}
.notify-title {
  font-family: var(--font-display);
  font-size: 0.98rem;
  margin-bottom: 0.2rem;
}
.notify-body {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
}
.notify-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.65rem;
}
.notify-link,
.notify-read {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-border-secondary);
  background: var(--white);
  color: var(--ink);
}
.notify-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--color-border-secondary);
  flex-shrink: 0;
}
.notify-dot.unread { background: var(--red); border-color: var(--red); }
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

@media (max-width: 720px) {
  .commission-grid { grid-template-columns: 1fr; }
  .notify-top { flex-direction: column; }
  .inbox-title { font-size: 1.25rem; }
}
</style>
