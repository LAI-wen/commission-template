<script lang="ts">
  import { page } from "$app/state"
  const name = page.url.searchParams.get("name") ?? "您"
</script>

<main class="container">
  <div class="card">
    <div class="icon">✓</div>
    <h1>申請已送出</h1>
    <p>{name}，感謝您的委託申請！</p>
    <p class="note">
      繪師確認後會寄 Email 通知您，
      請留意信箱（包含垃圾郵件匣）。
    </p>
    <a href="/status" class="btn">查詢委託進度</a>
    <a href="/" class="back">返回名片頁</a>
  </div>
</main>

<style>
.page {
  max-width: 600px;
  margin: 0 auto;
  padding: 4rem 1rem;
  text-align: center;
}
.checkmark {
  font-size: 5rem;
  display: block;
  margin-bottom: 1rem;
}
.success-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--blue);
  margin-bottom: 0.75rem;
}
.success-msg {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  margin-bottom: 2rem;
}
.order-id-box {
  background: var(--ink);
  color: var(--gold);
  border: var(--border);
  box-shadow: var(--shadow-md);
  padding: 1.25rem 2rem;
  margin: 2rem auto;
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  max-width: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.copy-btn {
  background: none;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: background 0.1s, color 0.1s;
}
.copy-btn:hover { background: var(--gold); color: var(--ink); }
.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 2rem;
  align-items: center;
}
.action-link {
  display: inline-block;
  padding: 0.65rem 1.75rem;
  border: var(--border);
  font-weight: 700;
  font-family: var(--font-body);
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: transform 0.08s, box-shadow 0.08s;
}
.action-link:hover { transform: translate(-1px, -1px); box-shadow: var(--shadow-md); }
.action-link.primary { background: var(--blue); color: var(--white); }
.action-link.secondary { background: var(--white); color: var(--ink); }
</style>
