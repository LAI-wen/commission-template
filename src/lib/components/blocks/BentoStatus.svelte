<script lang="ts">
  interface Props {
    title?: string
    status?: "OPEN" | "CLOSED"
    statusMessage?: string
    queueCount?: number
    accentColor?: string
  }

  let {
    title = "接案狀態",
    status = "OPEN",
    statusMessage = "",
    queueCount = 0,
    accentColor = "#276CE4"
  }: Props = $props()

  const isOpen = $derived(status === "OPEN")
</script>

<div class="block-card">
  <div class="block-header">
    <span class="block-label">{title}</span>
    <span class="status-badge" class:open={isOpen}>
      <span class="dot"></span>
      {isOpen ? "開放委託" : "暫停委託"}
    </span>
  </div>

  {#if statusMessage}
    <p class="status-note">「{statusMessage}」</p>
  {/if}

  <div class="queue-row">
    <span class="queue-label">排單</span>
    <div class="queue-bar-wrap">
      <div class="queue-bar">
        <div
          class="queue-fill"
          style="width: {Math.min((queueCount / 10) * 100, 100)}%"
        ></div>
      </div>
      <span class="queue-count">{queueCount} / 10</span>
    </div>
  </div>
</div>

<style>
  .block-card {
    padding: 1.25rem 1.5rem;
    border: var(--border);
    background: var(--white);
    box-shadow: var(--shadow-sm);
  }

  .block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.875rem;
    gap: 8px;
    flex-wrap: wrap;
  }

  .block-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.4;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    border: 1px solid var(--ink);
    color: var(--ink);
    opacity: 0.45;
  }
  .status-badge.open {
    color: var(--blue);
    border-color: var(--blue);
    background: color-mix(in srgb, var(--blue) 6%, transparent);
    opacity: 1;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
  .status-badge.open .dot {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.7; transform: scale(0.9); }
    50%       { opacity: 1;   transform: scale(1.1); }
  }

  .status-note {
    font-size: 0.85rem;
    font-style: italic;
    color: var(--ink);
    opacity: 0.5;
    margin: 0 0 1rem;
    line-height: 1.5;
  }

  .queue-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 0.875rem;
    border-top: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
  }

  .queue-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--ink);
    opacity: 0.35;
    flex-shrink: 0;
  }

  .queue-bar-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .queue-bar {
    flex: 1;
    height: 4px;
    background: color-mix(in srgb, var(--ink) 10%, transparent);
  }

  .queue-fill {
    height: 100%;
    background: var(--blue);
    transition: width 0.5s ease;
  }

  .queue-count {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--ink);
    opacity: 0.5;
    white-space: nowrap;
  }
</style>
