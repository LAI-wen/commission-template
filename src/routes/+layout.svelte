<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import Nav from '$lib/components/Nav.svelte';
  import { page } from '$app/state';
  import type { LayoutData } from './$types';

  let { children, data }: { children: any; data: LayoutData } = $props();

  const isPublic = $derived(!page.url.pathname.startsWith('/dashboard'))
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if isPublic}
  <Nav isArtist={data.isArtist} />
{/if}

{@render children()}

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(:root) {
    /* Y2K Palette — defaults (overridden by theme system via localStorage) */
    --blue:       #276CE4;
    --blue-deep:  #1747BB;
    --red:        #E33D2C;
    --white:      #FFFFFF;
    --ink:        #1747BB;   /* = blue-deep; replaced #15162D for Y2K look */
    --gold:       #E8B741;
    --cream:      #FBF9F5;
    --lavender:   #D0C5F4;

    /* Typography */
    --font-display:    'Bowlby One', sans-serif;
    --font-zh-display: 'Dela Gothic One', 'Noto Sans TC', sans-serif;
    --font-body:       'Space Grotesk', 'Noto Sans TC', system-ui, sans-serif;
    --font-mono:       'JetBrains Mono', monospace;

    /* Shadows — use ink (= blue-deep) for Y2K hard-shadow look */
    --shadow-lg: 6px 6px 0 var(--ink);
    --shadow-md: 4px 4px 0 var(--ink);
    --shadow-sm: 2px 2px 0 var(--ink);

    /* Borders */
    --border: 2px solid var(--ink);

    /* Legacy compat */
    --color-text-primary:       var(--ink);
    --color-text-secondary:     color-mix(in srgb, var(--ink) 65%, transparent);
    --color-text-tertiary:      color-mix(in srgb, var(--ink) 45%, transparent);
    --color-text-success:       #15803d;
    --color-text-danger:        var(--red);
    --color-text-warning:       #92400e;
    --color-text-info:          var(--blue);
    --color-background-primary: var(--white);
    --color-background-secondary: color-mix(in srgb, var(--blue) 8%, var(--white));
    --color-background-success: #dcfce7;
    --color-background-danger:  #fee2e2;
    --color-background-warning: #fef3c7;
    --color-background-info:    color-mix(in srgb, var(--blue) 12%, var(--white));
    --color-border-primary:     var(--ink);
    --color-border-secondary:   color-mix(in srgb, var(--ink) 35%, transparent);
    --color-border-tertiary:    color-mix(in srgb, var(--ink) 18%, transparent);
    --border-radius-sm: 2px;
    --border-radius-md: 4px;
    --border-radius-lg: 6px;

    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
    color: var(--ink);
    background: var(--cream);
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
