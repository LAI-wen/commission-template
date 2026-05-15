<script lang="ts">
  interface Props {
    data: {
      emojis?: string[]
    }
    accentColor?: string
  }

  let { data }: Props = $props()

  const emojis = $derived(data.emojis ?? ["❤️", "🌟", "🎨", "🍵"])
  let reactionCounts = $state<Record<string, number>>({})

  function react(emoji: string) {
    reactionCounts[emoji] = (reactionCounts[emoji] ?? 0) + 1
  }
</script>

<div class="reactions-block">
  <div class="emoji-bar">
    {#each emojis as emoji}
      <button class="emoji-btn" onclick={() => react(emoji)}>
        <span class="icon">{emoji}</span>
        <span class="count">{reactionCounts[emoji] ?? 0}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .reactions-block {
    padding: 1rem 0;
    display: flex;
    justify-content: center;
  }

  .emoji-bar {
    display: flex;
    gap: 12px;
    padding: 0.5rem;
    background: var(--cream);
    border: var(--border);
    border-radius: 0;
  }

  .emoji-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--white);
    border: var(--border);
    border-radius: 0;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
    box-shadow: var(--shadow-sm);
    user-select: none;
  }

  .emoji-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }

  .emoji-btn:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  .icon { font-size: 1.2rem; }
  .count { font-size: 0.85rem; font-weight: 700; color: var(--color-text-tertiary); }
</style>
