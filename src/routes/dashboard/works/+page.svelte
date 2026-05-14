<script lang="ts">
  import type { PageData, ActionData } from "./$types"
  import { enhance } from "$app/forms"
  import type { Work } from "$lib/db"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const folders = $derived(data.folders)
  let works = $derived(data.works)

  let uploadingPreview = $state(false)
  let uploadingOriginal = $state(false)
  let previewUrl = $state("")
  let originalUrl = $state("")
  let uploadError = $state("")

  let showAddForm = $state(false)
  let showFolderForm = $state(false)
  let editingId = $state<string | null>(null)

  $effect(() => {
    const f = form as any
    if (f?.added || f?.updated || f?.deleted || f?.toggled || f?.folderAdded || f?.folderDeleted) {
      showAddForm = false
      editingId = null
      previewUrl = ""
      originalUrl = ""
      showFolderForm = false
    }
  })

  async function uploadFile(file: File, type: "preview" | "original") {
    const fd = new FormData()
    fd.append("file", file)
    if (type === "preview") uploadingPreview = true
    else uploadingOriginal = true
    uploadError = ""

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) { uploadError = await res.text(); return }
      const { url } = await res.json() as { url: string }
      if (type === "preview") previewUrl = url
      else originalUrl = url
    } catch (e) {
      uploadError = "上傳失敗"
    } finally {
      if (type === "preview") uploadingPreview = false
      else uploadingOriginal = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>作品管理</h1>
    <div class="header-actions">
      <button class="btn-secondary" onclick={() => showFolderForm = !showFolderForm}>
        管理資料夾
      </button>
      <button class="btn-primary" onclick={() => { showAddForm = !showAddForm; previewUrl = ""; originalUrl = "" }}>
        + 上傳作品
      </button>
    </div>
  </div>

  {#if showFolderForm}
    <div class="panel">
      <h3>資料夾管理</h3>
      <div class="folder-list">
        {#each folders as folder}
          <div class="folder-item">
            <span class="folder-name">{folder.name}</span>
            <span class="folder-count">{folder.work_count} 件</span>
            <form method="POST" action="?/deleteFolder" use:enhance>
              <input type="hidden" name="id" value={folder.id} />
              <button
                type="submit"
                class="btn-danger-sm"
                onclick={(e) => { if (!confirm(`刪除「${folder.name}」？作品移到未分類。`)) e.preventDefault() }}
              >刪除</button>
            </form>
          </div>
        {/each}
        {#if folders.length === 0}
          <p class="muted">尚無資料夾</p>
        {/if}
      </div>
      <form method="POST" action="?/addFolder" use:enhance class="inline-form">
        <input name="name" type="text" placeholder="新資料夾名稱" required />
        <button type="submit" class="btn-save">新增</button>
      </form>
    </div>
  {/if}

  {#if showAddForm}
    <div class="panel">
      <h3>上傳新作品</h3>
      <form method="POST" action="?/addWork" use:enhance class="add-form">
        <input type="hidden" name="preview_url" value={previewUrl} />
        <input type="hidden" name="original_url" value={originalUrl} />

        <div class="field">
          <label>預覽圖 * <span class="hint-inline">（建議先加浮水印）</span></label>
          <div class="upload-row">
            <label class="upload-btn" class:loading={uploadingPreview}>
              <input
                type="file" accept="image/*" style="display:none"
                disabled={uploadingPreview}
                onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadFile(f, "preview") }}
              />
              {uploadingPreview ? "上傳中..." : "選擇圖片"}
            </label>
            {#if previewUrl}
              <span class="ok-text">✓ 已上傳</span>
              <img src={previewUrl} alt="" class="thumb" />
            {/if}
          </div>
        </div>

        <div class="field">
          <label>原始高解析度圖 <span class="hint-inline">（選填，不公開連結）</span></label>
          <div class="upload-row">
            <label class="upload-btn" class:loading={uploadingOriginal}>
              <input
                type="file" accept="image/*" style="display:none"
                disabled={uploadingOriginal}
                onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadFile(f, "original") }}
              />
              {uploadingOriginal ? "上傳中..." : "選擇圖片"}
            </label>
            {#if originalUrl}<span class="ok-text">✓ 已上傳</span>{/if}
          </div>
        </div>

        {#if uploadError}<span class="error">{uploadError}</span>{/if}

        <div class="field-row">
          <div class="field">
            <label>標題（選填）</label>
            <input name="title" type="text" placeholder="作品名稱" />
          </div>
          <div class="field">
            <label>資料夾</label>
            <select name="folder_id">
              <option value="">未分類</option>
              {#each folders as folder}
                <option value={folder.id}>{folder.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="field">
          <label>說明（選填）</label>
          <textarea name="description" rows="2" placeholder="作品說明、使用軟體等..."></textarea>
        </div>

        <div class="field">
          <label>標籤 <span class="hint-inline">（逗號分隔）</span></label>
          <input name="tags" type="text" placeholder="人物, 厚塗, 原創" />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-save" disabled={!previewUrl}>上傳</button>
          <button type="button" class="btn-cancel" onclick={() => { showAddForm = false; previewUrl = ""; originalUrl = "" }}>取消</button>
        </div>
      </form>
    </div>
  {/if}

  <div class="works-grid">
    {#each works as work}
      <div class="work-card" class:hidden={!work.is_visible}>
        <div class="work-img-wrap">
          <img src={work.preview_url} alt={work.title ?? ""} class="work-img" />
          <div class="work-actions">
            <form method="POST" action="?/toggleVisible" use:enhance>
              <input type="hidden" name="id" value={work.id} />
              <input type="hidden" name="is_visible" value={work.is_visible === 1 ? "0" : "1"} />
              <button type="submit" class="action-btn">
                {work.is_visible === 1 ? "隱藏" : "顯示"}
              </button>
            </form>
            <button class="action-btn" onclick={() => editingId = editingId === work.id ? null : work.id}>
              編輯
            </button>
            <form method="POST" action="?/deleteWork" use:enhance>
              <input type="hidden" name="id" value={work.id} />
              <button
                type="submit" class="action-btn danger"
                onclick={(e) => { if (!confirm("確定刪除？")) e.preventDefault() }}
              >刪除</button>
            </form>
          </div>
        </div>

        <div class="work-meta">
          <span class="work-title-text">{work.title ?? "（無標題）"}</span>
          {#if work.folder_id}
            <span class="muted">{folders.find(f => f.id === work.folder_id)?.name ?? ""}</span>
          {/if}
          {#if work.original_url}
            <span class="badge-original">有原始圖</span>
          {/if}
        </div>

        {#if editingId === work.id}
          <form method="POST" action="?/updateWork" use:enhance class="edit-form">
            <input type="hidden" name="id" value={work.id} />
            <div class="field">
              <label>標題</label>
              <input name="title" type="text" value={work.title ?? ""} />
            </div>
            <div class="field">
              <label>資料夾</label>
              <select name="folder_id" value={work.folder_id ?? ""}>
                <option value="">未分類</option>
                {#each folders as folder}
                  <option value={folder.id}>{folder.name}</option>
                {/each}
              </select>
            </div>
            <div class="field">
              <label>說明</label>
              <textarea name="description" rows="2">{work.description ?? ""}</textarea>
            </div>
            <div class="field">
              <label>標籤（逗號分隔）</label>
              <input name="tags" type="text" value={JSON.parse(work.tags).join(", ")} />
            </div>
            <label class="check-label">
              <input type="checkbox" name="is_visible" value="1" checked={work.is_visible === 1} />
              公開顯示
            </label>
            <div class="form-actions">
              <button type="submit" class="btn-save">儲存</button>
              <button type="button" class="btn-cancel" onclick={() => editingId = null}>取消</button>
            </div>
          </form>
        {/if}
      </div>
    {/each}

    {#if works.length === 0}
      <div class="empty">
        <p>還沒有任何作品</p>
        <button class="btn-primary" onclick={() => showAddForm = true}>上傳第一件作品</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .page { max-width: 960px; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
  h1 { font-size: 1.3rem; font-weight: 500; margin: 0; }
  h3 { font-size: 0.875rem; font-weight: 500; margin: 0 0 0.75rem; color: var(--color-text-secondary); }
  .header-actions { display: flex; gap: 0.5rem; }
  .btn-primary {
    padding: 0.45rem 1rem; background: var(--color-text-primary);
    color: var(--color-background-primary); border: none;
    border-radius: var(--border-radius-md); font-size: 0.875rem; font-weight: 500; cursor: pointer;
  }
  .btn-secondary {
    padding: 0.45rem 1rem; background: none;
    border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); font-size: 0.875rem;
    color: var(--color-text-secondary); cursor: pointer;
  }
  .panel {
    border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg);
    padding: 1rem; margin-bottom: 1rem;
  }
  .folder-list { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem; }
  .folder-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
  .folder-name { flex: 1; }
  .folder-count { font-size: 0.78rem; color: var(--color-text-tertiary); }
  .btn-danger-sm {
    font-size: 0.75rem; padding: 0.15rem 0.5rem;
    border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md);
    background: none; cursor: pointer; color: var(--color-text-danger);
  }
  .inline-form { display: flex; gap: 0.5rem; }
  .add-form { display: flex; flex-direction: column; gap: 0.875rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  label { font-size: 0.82rem; font-weight: 500; }
  .hint-inline { font-size: 0.75rem; color: var(--color-text-tertiary); font-weight: normal; }
  input:not([type=file]):not([type=checkbox]), select, textarea {
    padding: 0.5rem 0.65rem; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); font-size: 0.875rem;
    background: var(--color-background-primary); color: var(--color-text-primary);
  }
  textarea { resize: vertical; }
  .upload-row { display: flex; align-items: center; gap: 0.75rem; }
  .upload-btn {
    padding: 0.4rem 0.9rem; border: 0.5px dashed var(--color-border-secondary);
    border-radius: var(--border-radius-md); font-size: 0.85rem;
    cursor: pointer; color: var(--color-text-secondary);
  }
  .upload-btn:hover { border-style: solid; }
  .upload-btn.loading { opacity: 0.5; cursor: wait; }
  .ok-text { font-size: 0.8rem; color: var(--color-text-success); }
  .thumb { width: 40px; height: 40px; object-fit: cover; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-tertiary); }
  .error { font-size: 0.8rem; color: var(--color-text-danger); }
  .muted { font-size: 0.78rem; color: var(--color-text-tertiary); }
  .form-actions { display: flex; gap: 0.5rem; }
  .btn-save {
    padding: 0.45rem 1.1rem; background: var(--color-text-primary);
    color: var(--color-background-primary); border: none;
    border-radius: var(--border-radius-md); font-size: 0.875rem; font-weight: 500; cursor: pointer;
  }
  .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-cancel {
    padding: 0.45rem 0.9rem; border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md); background: none;
    font-size: 0.875rem; cursor: pointer; color: var(--color-text-secondary);
  }
  .works-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem; align-items: start;
  }
  .work-card {
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-lg); overflow: hidden;
  }
  .work-card.hidden { opacity: 0.45; }
  .work-img-wrap { position: relative; aspect-ratio: 1; }
  .work-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .work-actions {
    position: absolute; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    opacity: 0; transition: opacity 0.15s;
  }
  .work-img-wrap:hover .work-actions { opacity: 1; }
  .action-btn {
    padding: 0.3rem 0.65rem; background: rgba(255,255,255,0.9);
    border: none; border-radius: var(--border-radius-md);
    font-size: 0.75rem; cursor: pointer; font-weight: 500;
  }
  .action-btn.danger { color: var(--color-text-danger); }
  .work-meta { padding: 0.6rem 0.75rem; display: flex; flex-direction: column; gap: 0.2rem; }
  .work-title-text { font-size: 0.85rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .badge-original {
    font-size: 0.68rem; color: var(--color-text-success);
    padding: 0.1rem 0.4rem; border-radius: 999px;
    background: var(--color-background-success); align-self: flex-start;
  }
  .edit-form {
    padding: 0.75rem; border-top: 0.5px solid var(--color-border-tertiary);
    display: flex; flex-direction: column; gap: 0.6rem;
    background: var(--color-background-secondary);
  }
  .check-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; cursor: pointer; font-weight: normal; }
  .empty {
    grid-column: 1 / -1; text-align: center; padding: 4rem 0;
    color: var(--color-text-tertiary); font-size: 0.9rem;
    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  }
</style>
