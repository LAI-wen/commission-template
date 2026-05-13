<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import Nav from '$lib/components/Nav.svelte';
  import { page } from '$app/state';

  let { children } = $props();

  const isPublic = $derived(!page.url.pathname.startsWith('/dashboard'))
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if isPublic}
  <Nav />
{/if}

{@render children()}

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(:root) {
    /* ACS Y2K Palette */
    --blue:  #1F3FB8;
    --red:   #E33D2C;
    --white: #FFFFFF;
    --ink:   #15162D;
    --gold:  #E8B741;
    --cream: #F4EBD9;

    /* Typography */
    --font-display: 'Bowlby One', sans-serif;
    --font-body:    'Space Grotesk', system-ui, sans-serif;
    --font-mono:    'JetBrains Mono', monospace;

    /* Shadows */
    --shadow-lg: 6px 6px 0 var(--ink);
    --shadow-md: 4px 4px 0 var(--ink);
    --shadow-sm: 2px 2px 0 var(--ink);

    /* Borders */
    --border: 2px solid var(--ink);

    /* Legacy compat — many existing blocks still use these; they now map to ACS colours */
    --color-text-primary:       var(--ink);
    --color-text-secondary:     #4a4b6a;
    --color-text-tertiary:      #7a7b9a;
    --color-text-success:       #15803d;
    --color-text-danger:        var(--red);
    --color-text-warning:       #92400e;
    --color-text-info:          var(--blue);
    --color-background-primary: var(--white);
    --color-background-secondary: #f0f2ff;
    --color-background-success: #dcfce7;
    --color-background-danger:  #fee2e2;
    --color-background-warning: #fef3c7;
    --color-background-info:    #dbeafe;
    --color-border-primary:     var(--ink);
    --color-border-secondary:   #9ba4d4;
    --color-border-tertiary:    #c8cce8;
    --border-radius-md: 4px;
    --border-radius-lg: 6px;

    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
    color: var(--ink);
    background: var(--white);
  }

  /* ── Global utility classes ── */

  :global(.btn-primary) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.4rem;
    background: var(--blue);
    color: var(--white);
    border: var(--border);
    box-shadow: var(--shadow-sm);
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.08s, box-shadow 0.08s;
  }
  :global(.btn-primary:hover) {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }
  :global(.btn-primary:active) {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  :global(.btn-secondary) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.4rem;
    background: var(--white);
    color: var(--ink);
    border: var(--border);
    box-shadow: var(--shadow-sm);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.08s, box-shadow 0.08s;
  }
  :global(.btn-secondary:hover) {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }
  :global(.btn-secondary:active) {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  :global(.btn-danger) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.2rem;
    background: var(--red);
    color: var(--white);
    border: var(--border);
    box-shadow: var(--shadow-sm);
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.08s, box-shadow 0.08s;
  }
  :global(.btn-danger:hover) {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }
  :global(.btn-danger:active) {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  :global(.card-acs) {
    background: var(--white);
    border: var(--border);
    box-shadow: var(--shadow-md);
  }

  :global(.section-title) {
    font-family: var(--font-display);
    font-size: 2rem;
    color: var(--ink);
    letter-spacing: 0.02em;
  }

  :global(.tag-pill) {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    background: var(--blue);
    color: var(--white);
    border: 1px solid var(--ink);
    font-size: 0.75rem;
    font-weight: 700;
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
  }

  :global(.checker-row) {
    height: 20px;
    background-image:
      repeating-linear-gradient(
        90deg,
        var(--blue) 0px,
        var(--blue) 20px,
        var(--white) 20px,
        var(--white) 40px
      );
    border-top: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
  }

  :global(.mono) {
    font-family: var(--font-mono);
    font-size: 0.85em;
    letter-spacing: 0.04em;
  }

  :global(.block-header) {
    background: var(--blue);
    color: var(--white);
    padding: 8px 14px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    border-bottom: 2px solid var(--ink);
  }

  :global(.block-body) {
    padding: 16px;
  }
</style>
