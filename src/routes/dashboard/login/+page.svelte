<script lang="ts">
  import type { ActionData } from "./$types"
  let { form }: { form: ActionData } = $props()
</script>

<svelte:head>
  <title>登入後台</title>
</svelte:head>

<main class="wrap">
  <div class="card">
    <div class="card-head">
      <span class="logo">STUDIO</span>
      <span class="sub">Dashboard</span>
    </div>

    <form method="POST" class="body">
      <label for="password" class="label">密碼</label>
      <input
        id="password"
        name="password"
        type="password"
        placeholder="輸入後台密碼"
        autocomplete="current-password"
        autofocus
        required
      />
      {#if form?.error}
        <p class="error">{form.error}</p>
      {/if}
      <button type="submit" class="btn">登入</button>
    </form>
  </div>
</main>

<style>
  .wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--cream);
    padding: 1rem;
  }

  .card {
    width: 100%;
    max-width: 360px;
    border: var(--border);
    box-shadow: var(--shadow-lg);
    background: var(--white);
  }

  .card-head {
    background: var(--ink);
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  .logo {
    font-family: var(--font-display);
    font-size: 1.6rem;
    color: var(--white);
    letter-spacing: 0.04em;
  }

  .sub {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: color-mix(in srgb, var(--white) 55%, transparent);
    text-transform: uppercase;
  }

  .body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .label {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
  }

  input[type="password"] {
    padding: 0.6rem 0.75rem;
    border: var(--border);
    font-family: var(--font-body);
    font-size: 0.95rem;
    background: var(--cream);
    color: var(--ink);
    width: 100%;
  }

  input[type="password"]:focus {
    outline: 2px solid var(--blue);
    outline-offset: 1px;
  }

  .error {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--red);
    margin: 0;
  }

  .btn {
    padding: 0.6rem 1.25rem;
    background: var(--ink);
    color: var(--white);
    border: var(--border);
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform 0.08s, box-shadow 0.08s;
    align-self: flex-start;
  }

  .btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }
</style>
