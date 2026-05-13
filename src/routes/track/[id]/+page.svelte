<script lang="ts">
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const commission = $derived(data.commission)
  const revisions = $derived(data.revisions as any[])

  const statusLabel: Record<string, string> = {
    pending: "等待繪師確認中",
    accepted: "繪師已接受",
    rejected: "繪師未受理",
    in_progress: "製作中",
    revision: "修改中",
    completed: "已完成",
    cancelled: "已取消",
  }

  function formatDate(ts: number) {
    return new Date(ts * 1000).toLocaleString("zh-TW")
  }

  // 紅線留言邏輯
  let pendingComment = $state<{ version_id: string; x: number; y: number } | null>(null)
  let commentContent = $state("")

  function onImageClick(e: MouseEvent, versionId: string) {
    const rect = (e.currentTarget as HTMLImageElement).getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    pendingComment = { version_id: versionId, x, y }
  }

  function cancelComment() {
    pendingComment = null
    commentContent = ""
  }
</script>

<svelte:head>
  <title>委託進度查詢 - {commission.client_name}</title>
</svelte:head>

<main class="page">
  <div class="track-header">
    <p class="track-id">委託編號 · {commission.id?.slice(0, 8)?.toUpperCase()}</p>
    <h1 class="track-title">委託進度查詢</h1>
  </div>

  <!-- Status strip: 5 steps, done=blue, current=red, future=white -->
  {@const statusOrder = ['pending', 'accepted', 'in_progress', 'revision', 'completed']}
  {@const statusNames: Record<string,string> = { pending: '待確認', accepted: '已接受', in_progress: '製作中', revision: '修改中', completed: '已完成' }}
  {@const currentIdx = statusOrder.indexOf(commission.status)}
  <div class="status-strip">
    {#each statusOrder as step, i}
      <div class="status-step"
        class:done={i < currentIdx}
        class:current={i === currentIdx}
      >{statusNames[step]}</div>
    {/each}
  </div>

  <!-- Info bar -->
  <div class="info-bar">
    <div class="info-cell">
      <span class="info-label">委託人</span>
      <span class="info-value">{commission.client_name}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">提交時間</span>
      <span class="info-value">{formatDate(commission.created_at)}</span>
    </div>
    <div class="info-cell">
      <span class="info-label">預估金額</span>
      <span class="info-value mono">NT$ {commission.estimated_price.toLocaleString()}</span>
    </div>
  </div>

  {#if commission.creator_note}
    <div class="creator-note">
      <span class="note-label">繪師留言</span>
      <p class="note-content">{commission.creator_note}</p>
    </div>
  {/if}

  <!-- Revisions -->
  {#if revisions.length === 0}
    <div class="empty-state">
      <p>繪師尚未上傳任何進度，請耐心等候。</p>
    </div>
  {:else}
    <p class="hint">點擊圖片可在該位置新增留言</p>
    {#each revisions as rev}
      <div class="revision-block">
        <div class="revision-header">
          <span class="version-tag">版本 {rev.version_number}</span>
          <span class="upload-time">{formatDate(rev.uploaded_at)}</span>
        </div>
        <div class="content-grid">
          <!-- Image with pins -->
          <div class="revision-img-wrap" onclick={(e) => onImageClick(e, rev.id)}>
            <img
              src={rev.image_url}
              alt="Revision {rev.version_number}"
              class="revision-img"
            />
            {#each rev.comments as comment}
              {#if comment.x_percent !== null && comment.y_percent !== null}
                <div
                  class="pin"
                  class:client={comment.author_role === 'client'}
                  class:artist={comment.author_role === 'artist'}
                  class:resolved={comment.is_resolved === 1}
                  style="left: {comment.x_percent}%; top: {comment.y_percent}%"
                  title={comment.content}
                ></div>
              {/if}
            {/each}
            {#if pendingComment && pendingComment.version_id === rev.id}
              <div class="pin client" style="left: {pendingComment.x}%; top: {pendingComment.y}%" title="待送出"></div>
              <div class="comment-popover" style="left: {pendingComment.x}%; top: {pendingComment.y}%">
                <form method="POST" action="?/addComment" onsubmit={() => { pendingComment = null }}>
                  <input type="hidden" name="version_id" value={rev.id} />
                  <input type="hidden" name="x" value={pendingComment.x} />
                  <input type="hidden" name="y" value={pendingComment.y} />
                  <textarea name="content" placeholder="在此處新增留言..." bind:value={commentContent} required rows="3"></textarea>
                  <div class="popover-actions">
                    <button type="submit" class="popover-submit">送出</button>
                    <button type="button" class="popover-cancel" onclick={cancelComment}>取消</button>
                  </div>
                </form>
              </div>
            {/if}
          </div>

          <!-- Comments panel -->
          <div class="comments-panel">
            <div class="comments-header">留言</div>
            <div class="comment-list">
              {#each rev.comments as comment}
                <div class="comment"
                  class:artist={comment.author_role === 'artist'}
                  class:resolved={comment.is_resolved === 1}
                >
                  <div class="comment-meta">
                    <span>{comment.author_role === 'artist' ? '繪師' : '我'}</span>
                    {#if comment.is_resolved === 1}<span class="resolved-tag">已處理</span>{/if}
                    <span class="comment-time">{formatDate(comment.created_at)}</span>
                  </div>
                  <p class="comment-content">{comment.content}</p>
                </div>
              {/each}
            </div>
            {#if !pendingComment || pendingComment.version_id !== rev.id}
              <div class="add-comment-form">
                <form method="POST" action="?/addComment">
                  <input type="hidden" name="version_id" value={rev.id} />
                  <textarea name="content" placeholder="新增留言..." rows="2"></textarea>
                  <button type="submit" class="send-btn">送出留言</button>
                </form>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  {/if}
</main>

<style>
.page { max-width: 900px; margin: 0 auto; padding: 2rem 1rem 4rem; }

.track-header {
  padding-bottom: 1.5rem;
  border-bottom: var(--border);
  margin-bottom: 2rem;
}
.track-id {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
}
.track-title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--blue);
}

.status-strip {
  display: flex;
  margin-bottom: 2rem;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.status-step {
  flex: 1;
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  border-right: var(--border);
  background: var(--white);
  color: var(--color-text-tertiary);
}
.status-step:last-child { border-right: none; }
.status-step.done { background: var(--blue); color: var(--white); }
.status-step.current { background: var(--red); color: var(--white); }

.info-bar {
  display: flex;
  gap: 0;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;
  overflow: hidden;
}
.info-cell {
  flex: 1;
  padding: 0.875rem 1rem;
  border-right: var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.info-cell:last-child { border-right: none; }
.info-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}
.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ink);
}
.info-value.mono {
  font-family: var(--font-mono);
  color: var(--blue);
}

.creator-note {
  border: var(--border);
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;
  overflow: hidden;
}
.note-label {
  display: block;
  background: var(--ink);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 0.4rem 1rem;
  letter-spacing: 0.08em;
}
.note-content {
  padding: 0.875rem 1rem;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--ink);
}

.hint {
  font-size: 0.8rem;
  font-family: var(--font-mono);
  color: var(--color-text-tertiary);
  margin-bottom: 1.5rem;
  letter-spacing: 0.03em;
}

.revision-block {
  margin-bottom: 2.5rem;
}
.revision-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: var(--ink);
  color: var(--white);
  border: var(--border);
  border-bottom: none;
}
.version-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.upload-time {
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: 0.7;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 0;
  border: var(--border);
  box-shadow: var(--shadow-md);
}
.revision-img-wrap {
  overflow: hidden;
  position: relative;
  cursor: crosshair;
  border-right: var(--border);
}
.revision-img { width: 100%; display: block; }

.pin {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--white);
  transform: translate(-50%, -50%);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.pin.client { background: var(--red); }
.pin.artist { background: var(--blue); }
.pin.resolved { background: #6b7280; opacity: 0.7; }

.comment-popover {
  position: absolute;
  z-index: 10;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-md);
  padding: 0.75rem;
  width: 240px;
  transform: translate(-50%, 20px);
}
.comment-popover textarea {
  width: 100%;
  padding: 6px 10px;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 13px;
  resize: none;
  margin-bottom: 8px;
  display: block;
}
.popover-actions { display: flex; gap: 0.5rem; }
.popover-submit {
  flex: 1;
  padding: 0.4rem;
  background: var(--blue);
  color: var(--white);
  border: var(--border);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.popover-cancel {
  padding: 0.4rem 0.75rem;
  background: var(--white);
  color: var(--ink);
  border: var(--border);
  font-family: var(--font-body);
  font-size: 0.8rem;
  cursor: pointer;
}

.comments-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.comments-header {
  background: var(--ink);
  color: var(--white);
  padding: 0.75rem 1rem;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  border-bottom: var(--border);
  letter-spacing: 0.08em;
}
.comment-list { max-height: 400px; overflow-y: auto; flex: 1; }
.comment {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border-tertiary);
  font-size: 0.875rem;
}
.comment:last-child { border-bottom: none; }
.comment.artist { background: #f0f2ff; }
.comment.resolved { opacity: 0.5; }
.comment-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.resolved-tag {
  background: var(--gold);
  color: var(--ink);
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 700;
}
.comment-time { margin-left: auto; }
.comment-content { margin: 0; line-height: 1.5; color: var(--ink); }

.add-comment-form { padding: 1rem; border-top: var(--border); }
.add-comment-form textarea {
  width: 100%;
  padding: 8px 12px;
  border: var(--border);
  font-family: var(--font-body);
  font-size: 13px;
  resize: none;
  margin-bottom: 8px;
  display: block;
}
.send-btn {
  padding: 0.5rem 1.25rem;
  background: var(--blue);
  color: var(--white);
  border: var(--border);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 0.08s;
}
.send-btn:hover { transform: translate(-1px, -1px); box-shadow: var(--shadow-md); }

.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  border: var(--border);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 768px) {
  .content-grid { grid-template-columns: 1fr; }
  .revision-img-wrap { border-right: none; border-bottom: var(--border); }
  .status-strip { flex-wrap: wrap; }
  .info-bar { flex-direction: column; }
  .info-cell { border-right: none; border-bottom: var(--border); }
  .info-cell:last-child { border-bottom: none; }
}
</style>
