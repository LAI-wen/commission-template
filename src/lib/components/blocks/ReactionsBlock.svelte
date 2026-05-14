<script lang="ts">
  interface Props {
    data: {
      emojis?: string[]
    }
    accentColor?: string
  }

  let { data, accentColor = "#000" }: Props = $props()

  const emojis = $derived(data.emojis ?? ["❤️", "🌟", "🎨", "🍵"])
  let bubbleList = $state<{ id: number; emoji: string; x: number }[]>([])
  let reactionCounts = $state<Record<string, number>>({})

  let nextId = 0

  function react(emoji: string) {
    // Increment count (local only for now, can be synced to DB later)
    reactionCounts[emoji] = (reactionCounts[emoji] ?? 0) + 1
    
    // Trigger animation
    const id = nextId++
    const x = Math.random() * 60 - 30 // Random offset
    bubbleList = [...bubbleList, { id, emoji, x }]
    
    // Remove bubble after animation
    setTimeout(() => {
      bubbleList = bubbleList.filter(b => b.id !== id)
    }, 1000)
  }
</script>

<div class="reactions-block" style="--accent: {accentColor}">
  <div class="emoji-bar">
    {#each emojis as emoji}
      <button class="emoji-btn" onclick={() => react(emoji)}>
        <span class="icon">{emoji}</span>
        <span class="count">{reactionCounts[emoji] ?? 0}</span>
        
        <!-- Bubble Area -->
        <div class="bubbles">
          {#each bubbleList.filter(b => b.emoji === emoji) as b (b.id)}
            <div class="bubble" style="--x: {b.x}px">{b.emoji}</div>
          {/each}
        </div>
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
    padding: 8px 16px;
    background: #f5f5f5;
    border-radius: 99px;
  }

  .emoji-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: white;
    border: 1px solid #eee;
    border-radius: 99px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }

  .emoji-btn:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
  }

  .emoji-btn:active {
    transform: scale(0.95);
  }

  .icon { font-size: 1.2rem; }
  .count { font-size: 0.85rem; font-weight: 700; color: #888; }

  .bubbles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }

  .bubble {
    position: absolute;
    bottom: 100%;
    left: 50%;
    font-size: 1.5rem;
    animation: float-up 1s ease-out forwards;
  }

  @keyframes float-up {
    0% {
      transform: translate(-50%, 0) scale(0.5);
      opacity: 0;
    }
    20% {
      opacity: 1;
      transform: translate(calc(-50% + var(--x) * 0.2), -20px) scale(1.2);
    }
    100% {
      transform: translate(calc(-50% + var(--x)), -100px) scale(1);
      opacity: 0;
    }
  }
</style>
