<script lang="ts">
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const commission = $derived(data.commission)
  const revisions = $derived(data.revisions as any[])
  
  const statusLabel: Record<string, string> = {
    pending: "待確認",
    accepted: "已接受",
    rejected: "已拒絕",
    in_progress: "製作中",
    revision: "修改中",
    completed: "已完成",
    cancelled: "已取消",
  }

  function formatDate(ts: number) {
    return new Date(ts * 1000).toLocaleString("zh-TW")
  }

  const selectedOptions = $derived(JSON.parse(commission.selected_options || "[]"))

  let deliveryUrl = $state<string | null>(null)

  async function handleDeliver() {
    const fileInput = document.getElementById("delivery-file") as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) return alert("請選擇完稿檔案")

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`/api/delivery/${commission.id}`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) return alert("上傳失敗，請稍後再試")

    const { downloadUrl } = await res.json()
    deliveryUrl = downloadUrl
    alert("上傳成功！委託狀態已更新為「已交付」。")
  }
</script>

<svelte:head>
  <title>委託詳情 - {commission.client_name}</title>
</svelte:head>

<div class="page">
  <a href="/dashboard" class="back">← 返回列表</a>

  <header class="header">
    <div class="title-row">
      <h1>{commission.client_name} 的委託</h1>
      <span class="status status-{commission.status}">
        {statusLabel[commission.status] ?? commission.status}
      </span>
    </div>
    <p class="meta">ID: {commission.id} · 提交於 {formatDate(commission.created_at)}</p>
  </header>

  <div class="grid">
    <div class="main">
      <section class="section">
        <h2>需求說明</h2>
        <div class="detail-box">
          {commission.detail}
        </div>
      </section>

      <!-- 進度與草稿 -->
      <section class="section">
        <div class="section-header">
          <h2>進度與草稿</h2>
          <form method="POST" action="?/uploadRevision" enctype="multipart/form-data" class="upload-form">
            <input
              type="file"
              name="file"
              accept="image/*"
              required
              id="rev-file"
              style="display:none"
              onchange={(e) => e.currentTarget.form?.requestSubmit()}
            />
            <label for="rev-file" class="btn-upload">+ 上傳新版本</label>
          </form>
        </div>

        {#if revisions.length === 0}
          <p class="placeholder">尚未上傳任何進度</p>
        {:else}
          <div class="revisions-list">
            {#each revisions as rev}
              <div class="revision-card">
                <div class="rev-header">
                  <span class="version">Version {rev.version_number}</span>
                  <span class="time">{formatDate(rev.uploaded_at)}</span>
                </div>
                <div class="img-container">
                  <img src={rev.image_url} alt="Revision {rev.version_number}" class="rev-img" />
                  <!-- 顯示紅線點 -->
                  {#each rev.comments as comment}
                    {#if comment.x_percent !== null && comment.y_percent !== null}
                      <div
                        class="dot"
                        class:resolved={comment.is_resolved === 1}
                        style="left: {comment.x_percent}%; top: {comment.y_percent}%"
                        title={comment.content}
                      ></div>
                    {/if}
                  {/each}
                </div>
                
                <div class="comments">
                  {#each rev.comments as comment}
                    <div class="comment" class:artist={comment.author_role === 'artist'} class:resolved={comment.is_resolved === 1}>
                      <div class="comment-top">
                        <span class="author">{comment.author_role === 'artist' ? '我' : '委託人'}:</span>
                        {#if comment.author_role === 'client' && comment.is_resolved === 0}
                          <form method="POST" action="?/resolveComment" class="inline-form">
                            <input type="hidden" name="comment_id" value={comment.id} />
                            <button type="submit" class="btn-resolve">標記已處理</button>
                          </form>
                        {/if}
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  {/each}
                  
                  <form method="POST" action="?/addComment" class="comment-form">
                    <input type="hidden" name="version_id" value={rev.id} />
                    <input type="text" name="content" placeholder="新增留言..." required />
                    <button type="submit">送出</button>
                  </form>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>

    <aside class="sidebar">
      <section class="section controls">
        <h2>狀態管理</h2>
        <form method="POST" action="?/updateStatus" class="status-form">
          <select name="status" value={commission.status}>
            <option value="pending">待確認</option>
            <option value="accepted">接受 (未開始)</option>
            <option value="in_progress">製作中</option>
            <option value="revision">修改中</option>
            <option value="completed">已完成</option>
            <option value="rejected">拒絕</option>
            <option value="cancelled">取消</option>
          </select>

          <textarea
            name="note"
            placeholder="備註 (委託人可見)"
            value={commission.creator_note ?? ""}
          ></textarea>

          <button type="submit" class="btn-update">更新狀態</button>
        </form>
      </section>

      <section class="section">
        <h2>選購項目</h2>
        <ul class="options-list">
          {#each selectedOptions as opt}
            <li>
              <span class="opt-label">{opt.label}</span>
              <span class="opt-price">
                {#if opt.price_delta > 0}+NT$ {opt.price_delta.toLocaleString()}{/if}
                {#if opt.price_multiplier > 1}×{opt.price_multiplier}{/if}
              </span>
            </li>
          {/each}
        </ul>
        <div class="total">
          <span>預估總計</span>
          <strong>NT$ {commission.estimated_price.toLocaleString()}</strong>
        </div>
      </section>

      <section class="section contact">
        <h2>聯絡資訊</h2>
        <div class="contact-info">
          <p><strong>Email:</strong> {commission.client_email}</p>
          {#if commission.client_hub_id}
            <p><strong>Hub ID:</strong> {commission.client_hub_id}</p>
          {/if}
        </div>
      </section>
    </aside>
  </div>

  <!-- 完稿交付區 -->
  <div class="delivery-section">
    <div class="section-block">
      <div class="section-block-header">完稿交付 FINAL DELIVERY</div>
      <div class="section-block-body">
        {#if commission.status === 'delivered' && commission.delivery_expires}
          <p class="delivery-done">
            ✓ 已交付。下載連結有效至
            {new Date(commission.delivery_expires * 1000).toLocaleDateString("zh-TW")}
          </p>
        {:else}
          <p class="delivery-hint">上傳完稿檔案，系統將產生 7 天有效的下載連結。</p>
          <div class="delivery-form">
            <input
              type="file"
              id="delivery-file"
              accept="image/*,.zip,.psd,.clip"
              class="file-input"
            />
            <button
              type="button"
              class="btn-deliver"
              onclick={handleDeliver}
            >
              上傳完稿並標記已交付
            </button>
          </div>
          {#if deliveryUrl}
            <div class="delivery-link-box">
              <span class="mono">客戶下載連結：</span>
              <a href={deliveryUrl} target="_blank" class="delivery-link mono">{deliveryUrl}</a>
              <button onclick={() => navigator.clipboard.writeText(window.location.origin + deliveryUrl)} class="copy-btn">複製</button>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .back {
    display: inline-block;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    text-decoration: none;
    margin-bottom: 1.5rem;
  }
  .header { margin-bottom: 2rem; }
  .title-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
  h1 { font-size: 1.5rem; font-weight: 500; margin: 0; }
  .status {
    font-size: 0.8rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-weight: 500;
  }
  .status-pending { background: var(--color-background-warning); color: var(--color-text-warning); }
  .status-accepted, .status-in_progress { background: var(--color-background-info); color: var(--color-text-info); }
  .status-completed { background: var(--color-background-success); color: var(--color-text-success); }

  .meta { font-size: 0.85rem; color: var(--color-text-tertiary); margin: 0; }

  .grid { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; }

  .section {
    background: var(--color-background-primary);
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-lg);
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .section-header h2 { margin: 0; }
  h2 { font-size: 0.9rem; font-weight: 500; margin: 0 0 1rem; color: var(--color-text-secondary); }

  .detail-box {
    font-size: 0.95rem;
    line-height: 1.6;
    white-space: pre-wrap;
    color: var(--color-text-primary);
  }

  .btn-upload {
    font-size: 0.8rem;
    padding: 0.35rem 0.75rem;
    border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    color: var(--color-text-secondary);
  }

  .revisions-list { display: flex; flex-direction: column; gap: 1.5rem; }
  .revision-card {
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-md);
    overflow: hidden;
  }
  .rev-header {
    padding: 0.5rem 0.75rem;
    background: var(--color-background-secondary);
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
  }
  .version { font-weight: 500; }
  .time { color: var(--color-text-tertiary); }
  
  .img-container { position: relative; width: 100%; }
  .rev-img { width: 100%; display: block; border-bottom: 0.5px solid var(--color-border-tertiary); }
  
  .dot {
    position: absolute;
    width: 10px; height: 10px;
    background: var(--color-text-danger);
    border: 1.5px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 3px rgba(0,0,0,0.3);
  }
  .dot.resolved { background: var(--color-text-success); opacity: 0.6; }

  .comments { padding: 0.75rem; background: var(--color-background-primary); }
  .comment { margin-bottom: 0.75rem; font-size: 0.85rem; padding-bottom: 0.75rem; border-bottom: 0.5px solid var(--color-border-tertiary); }
  .comment:last-child { border-bottom: none; margin-bottom: 0; }
  .comment.resolved { opacity: 0.6; }
  .comment-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
  .comment .author { font-weight: 500; }
  .comment p { margin: 0; color: var(--color-text-secondary); }
  .comment.artist p { color: var(--color-text-primary); }

  .btn-resolve {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    background: none;
    border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  .comment-form { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
  .comment-form input {
    flex: 1;
    padding: 0.35rem 0.5rem;
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-sm);
    font-size: 0.85rem;
  }
  .comment-form button {
    padding: 0.35rem 0.75rem;
    background: var(--color-text-primary);
    color: var(--color-background-primary);
    border: none;
    border-radius: var(--border-radius-sm);
    font-size: 0.8rem;
    cursor: pointer;
  }

  .options-list { list-style: none; padding: 0; margin: 0 0 1rem; }
  .options-list li {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    padding: 0.4rem 0;
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }
  .opt-price { color: var(--color-text-secondary); }
  .total { display: flex; justify-content: space-between; align-items: baseline; }
  .total strong { font-size: 1.2rem; }

  .status-form { display: flex; flex-direction: column; gap: 0.75rem; }
  select, textarea {
    padding: 0.6rem;
    border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md);
    background: var(--color-background-primary);
    color: var(--color-text-primary);
    font-size: 0.9rem;
  }
  textarea { height: 80px; resize: vertical; }

  .btn-update {
    padding: 0.6rem;
    background: var(--color-text-primary);
    color: var(--color-background-primary);
    border: none;
    border-radius: var(--border-radius-md);
    font-weight: 500;
    cursor: pointer;
  }

  .contact-info p { font-size: 0.9rem; margin: 0.4rem 0; }
  .placeholder { font-size: 0.85rem; color: var(--color-text-tertiary); font-style: italic; text-align: center; padding: 2rem 0; }

  @media (max-width: 800px) {
    .grid { grid-template-columns: 1fr; }
    .sidebar { order: -1; }
  }

  .delivery-section { margin-top: 2rem; }
  .section-block { border: var(--border); box-shadow: var(--shadow-sm); overflow: hidden; }
  .section-block-header {
    background: var(--ink);
    color: var(--white);
    padding: 0.6rem 1rem;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    border-bottom: var(--border);
  }
  .section-block-body { padding: 1rem; }
  .delivery-hint { font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 1rem; }
  .delivery-done {
    font-family: var(--font-mono);
    font-size: 13px;
    color: #16a34a;
    font-weight: 700;
  }
  .delivery-form { display: flex; flex-direction: column; gap: 0.75rem; }
  .file-input {
    border: var(--border);
    padding: 0.5rem;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .btn-deliver {
    padding: 0.7rem 1.5rem;
    background: var(--ink);
    color: var(--white);
    border: var(--border);
    font-family: var(--font-body);
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform 0.08s;
    width: fit-content;
  }
  .btn-deliver:hover { transform: translate(-1px, -1px); box-shadow: var(--shadow-md); }
  .delivery-link-box {
    margin-top: 1rem;
    padding: 0.875rem;
    background: var(--ink);
    color: var(--white);
    border: var(--border);
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .delivery-link {
    color: var(--gold);
    word-break: break-all;
    flex: 1;
    text-decoration: none;
  }
  .copy-btn {
    padding: 3px 10px;
    background: none;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .copy-btn:hover { background: var(--gold); color: var(--ink); }
</style>
