<script lang="ts">
  import { enhance } from '$app/forms'
  import { tick } from 'svelte'

  let { data } = $props()

  type Step    = { zh: string; en: string; desc: string }
  type Payment = { method: string; detail: string }
  type ProcessConfig = {
    title: string; subtitle: string; artistName: string; handle: string
    steps: Step[]; payment: Payment[]; notes: string
  }

  let sub = $state<'profile' | 'types' | 'process' | 'status' | 'email'>('profile')

  // ── Profile ──────────────────────────────────────────────────
  const creator = $derived(data.creator)
  let displayName = $state(String(creator?.display_name ?? ''))
  let bio = $state(String(creator?.bio ?? ''))
  let stylesString = $derived.by(() => {
    try {
      const tags = JSON.parse(String(creator?.styles || "[]"))
      return Array.isArray(tags) ? tags.join(", ") : ""
    } catch { return "" }
  })
  let contactEmail = $state(String(creator?.contact_email ?? ''))
  let contactDiscord = $state(String(creator?.contact_discord ?? ''))
  let profileSaved = $state(false)

  // ── Types ────────────────────────────────────────────────────
  const types = $derived(data.types ?? [])

  // ── Process ──────────────────────────────────────────────────
  let proc = $state<ProcessConfig>(structuredClone(data.processConfig) as ProcessConfig)
  let processJson  = $state('')
  let processFormEl: HTMLFormElement
  let processSaved = $state(false)

  async function saveProcess() {
    processJson = JSON.stringify(proc)
    await tick()
    processFormEl.requestSubmit()
    processSaved = true
    setTimeout(() => { processSaved = false }, 2000)
  }

  function addStep() {
    proc.steps.push({ zh: '新階段', en: 'New step', desc: '說明…' })
  }
  function removeStep(i: number) { proc.steps.splice(i, 1) }
  function moveStep(i: number, dir: number) {
    const j = i + dir
    if (j < 0 || j >= proc.steps.length) return
    ;[proc.steps[i], proc.steps[j]] = [proc.steps[j], proc.steps[i]]
  }
  function addPayment() {
    proc.payment.push({ method: '新方式', detail: '' })
  }
  function removePayment(i: number) { proc.payment.splice(i, 1) }

  // ── Status ───────────────────────────────────────────────────
  let statusState = $state<string>((data.creator?.open_status as string) ?? 'open')
  let nextOpen    = $state<string>((data.creator?.next_open   as string) ?? '')
  let openNote    = $state<string>((data.creator?.open_note   as string) ?? '')
  let queueLimit  = $state<number>(Number(data.creator?.queue_limit) || 10)

  const STATUS_OPTIONS = [
    { k: 'open',    zh: '開放委託',   en: 'Open',    color: '#4F7A4A',
      desc: '正常接單，前台顯示「我要委託」按鈕。' },
    { k: 'closed',  zh: '暫停接單',   en: 'Closed',  color: '#9A9085',
      desc: '前台顯示「目前不接單」，但保留價目表瀏覽。' },
    { k: 'paused',  zh: '排隊中暫停', en: 'Paused',  color: '#C58A2A',
      desc: '前台可看價目表，下單按鈕改為「加入候補」。' },
    { k: 'preview', zh: '預告開放',   en: 'Preview', color: '#2E4761',
      desc: '前台顯示倒數計時與下次開放日期。' },
  ]
  const currentStatus = $derived(STATUS_OPTIONS.find(s => s.k === statusState) ?? STATUS_OPTIONS[0])

  // ── Email Templates ──────────────────────────────────────────
  let emailAccept = $state<string>((data.emailTemplates?.accept as string) ?? '')
  let emailReject = $state<string>((data.emailTemplates?.reject as string) ?? '')
  let emailSaved  = $state(false)

  async function saveEmailTemplates() {
    emailSaved = true
    setTimeout(() => { emailSaved = false }, 2000)
  }
</script>

<div class="manage">
  <header class="manage-head">
    <div>
      <span class="eyebrow">Studio Settings</span>
      <h1>管理</h1>
    </div>
    <nav class="manage-subtabs">
      {#each [['profile','基本資料','Profile'],['types','委託項目','Commission Types'],['process','流程說明','Process & Rules'],['status','開放狀態','Open / Closed'],['email','郵件設定','Email Settings']] as [k,zh,en]}
        <button class="manage-subtab" class:active={sub === k} onclick={() => sub = k as 'profile' | 'types' | 'process' | 'status' | 'email'}>
          <span class="manage-subtab-zh">{zh}</span>
          <span class="manage-subtab-en">{en}</span>
        </button>
      {/each}
    </nav>
  </header>

  <div class="manage-body">

    <!-- ═══ PROFILE SHEET ═══════════════════════════════════════ -->
    {#if sub === 'profile'}
      <form method="POST" action="?/updateProfile" use:enhance={({ action, cancel }) => {
        return async ({ result }) => {
          if (result.type === 'success') {
            profileSaved = true
            setTimeout(() => { profileSaved = false }, 2000)
          }
        }
      }} class="profile-form">
        <div class="form-section">
          <h3>基本資料</h3>
          <div class="field">
            <label for="display_name">顯示名稱 *</label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              bind:value={displayName}
              required
            />
          </div>

          <div class="field">
            <label for="bio">簡介</label>
            <textarea id="bio" name="bio" rows="3" bind:value={bio}></textarea>
          </div>

          <div class="field">
            <label for="styles">風格標籤</label>
            <input
              id="styles"
              name="styles"
              type="text"
              bind:value={stylesString}
              placeholder='例：厚塗, 水彩風, 二次元'
            />
            <span class="hint">請使用逗號分隔標籤</span>
          </div>
        </div>

        <div class="form-section">
          <h3>聯絡方式</h3>
          <div class="field-row">
            <div class="field">
              <label for="contact_email">Email</label>
              <input
                id="contact_email"
                name="contact_email"
                type="email"
                bind:value={contactEmail}
              />
            </div>
            <div class="field">
              <label for="contact_discord">Discord</label>
              <input
                id="contact_discord"
                name="contact_discord"
                type="text"
                bind:value={contactDiscord}
              />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn primary">
            {profileSaved ? '✓ 已儲存' : '儲存資料'}
          </button>
        </div>
      </form>

    <!-- ═══ COMMISSION TYPES SHEET ═════════════════════════════ -->
    {:else if sub === 'types'}
      <div class="types-section">
        <div class="types-header">
          <h3>委託項目</h3>
          <a href="/dashboard/settings/type/new" class="btn primary small">+ 新增項目</a>
        </div>
        <div class="type-list">
          {#each types as type}
            <div class="type-row">
              <div class="type-info">
                <div class="type-name">{type.name}</div>
                <div class="type-desc">{type.description}</div>
              </div>
              <div class="type-price">NT$ {type.base_price.toLocaleString()}</div>
              <a href="/dashboard/settings/type/{type.id}" class="btn ghost small">編輯</a>
            </div>
          {/each}
        </div>
        {#if types.length === 0}
          <div class="empty-state">
            <p>尚未新增委託項目</p>
            <a href="/dashboard/settings/type/new" class="btn primary">新增第一個項目</a>
          </div>
        {/if}
      </div>

    <!-- ═══ PROCESS SHEET ═══════════════════════════════════════ -->
    {:else if sub === 'process'}
      <!-- hidden form for JSON submission -->
      <form method="POST" action="?/updateProcess" use:enhance bind:this={processFormEl} class="hidden-form">
        <input type="hidden" name="process_json" value={processJson} />
      </form>

      <div class="process-wrap">
        <!-- editor column -->
        <aside class="process-editor">

          <section class="process-section">
            <header class="process-section-head">
              <span class="eyebrow">Header</span>
              <h3>標題</h3>
            </header>
            <div class="field">
              <div class="field-label"><span class="label-zh">主標</span></div>
              <input class="input" bind:value={proc.title} />
            </div>
            <div class="field" style="margin-top:8px">
              <div class="field-label"><span class="label-zh">副標</span></div>
              <input class="input" bind:value={proc.subtitle} />
            </div>
          </section>

          <section class="process-section">
            <header class="process-section-head">
              <span class="eyebrow">Workflow</span>
              <h3>委託流程</h3>
              <button type="button" class="btn tiny" onclick={addStep}>＋ 新增階段</button>
            </header>
            {#each proc.steps as step, i}
              <div class="process-step-edit">
                <div class="process-step-edit-head">
                  <span class="process-step-num">{String(i+1).padStart(2,'0')}</span>
                  <input class="input" bind:value={step.zh} placeholder="中文標題" />
                  <input class="input mono" bind:value={step.en} placeholder="English" />
                  <div class="process-step-actions">
                    <button type="button" class="btn ghost tiny" onclick={() => moveStep(i,-1)} disabled={i===0}>↑</button>
                    <button type="button" class="btn ghost tiny" onclick={() => moveStep(i,1)} disabled={i===proc.steps.length-1}>↓</button>
                    <button type="button" class="btn ghost tiny danger" onclick={() => removeStep(i)}>×</button>
                  </div>
                </div>
                <textarea class="textarea" rows="2" bind:value={step.desc} placeholder="說明"></textarea>
              </div>
            {/each}
          </section>

          <section class="process-section">
            <header class="process-section-head">
              <span class="eyebrow">Payment</span>
              <h3>收款方式</h3>
            </header>
            {#each proc.payment as pay, i}
              <div class="pay-row" style="margin-bottom:6px">
                <input class="input" bind:value={pay.method} placeholder="方式" />
                <input class="input mono" bind:value={pay.detail} placeholder="詳情" />
                <button type="button" class="btn ghost tiny danger" onclick={() => removePayment(i)}>×</button>
              </div>
            {/each}
            <button type="button" class="btn tiny ghost" onclick={addPayment}>＋ 新增收款方式</button>
          </section>

          <section class="process-section">
            <header class="process-section-head">
              <span class="eyebrow">Notes</span>
              <h3>補充規則</h3>
            </header>
            <textarea class="textarea" rows="6" bind:value={proc.notes}
              placeholder="例：完稿後不再修改｜檔案保留 30 天｜禁止商業二改"></textarea>
          </section>

          <section class="process-section">
            <header class="process-section-head">
              <span class="eyebrow">Branding</span>
              <h3>署名</h3>
            </header>
            <div class="field">
              <div class="field-label"><span class="label-zh">繪師名稱</span></div>
              <input class="input" bind:value={proc.artistName} />
            </div>
            <div class="field" style="margin-top:8px">
              <div class="field-label"><span class="label-zh">Handle</span></div>
              <input class="input mono" bind:value={proc.handle} />
            </div>
          </section>

          <div style="padding:14px 0">
            <button type="button" class="btn primary block" onclick={saveProcess}>
              {processSaved ? '✓ 已儲存' : '儲存流程說明'}
            </button>
          </div>
        </aside>

        <!-- preview column -->
        <main class="process-preview">
          <div class="process-preview-bar">
            <span class="chip">A4 / 1080×1440</span>
            <span class="chip">{proc.steps.length} 階段</span>
            <div style="flex:1"></div>
          </div>
          <div class="process-preview-stage">
            <div class="proc-poster">
              <header class="proc-head">
                <div class="proc-eyebrow">COMMISSION PROCESS · 委託流程</div>
                <h1 class="proc-title">{proc.title}</h1>
                <div class="proc-sub">{proc.subtitle}</div>
                <div class="proc-rule"></div>
              </header>

              <section class="proc-block">
                <div class="proc-block-head">
                  <span class="proc-num">01</span>
                  <span class="proc-block-title">流程 Workflow</span>
                </div>
                <ol class="proc-steps">
                  {#each proc.steps as s, i}
                    <li class="proc-step">
                      <span class="proc-step-num">{String(i+1).padStart(2,'0')}</span>
                      <div>
                        <div class="proc-step-titles">
                          <span class="proc-step-zh">{s.zh}</span>
                          <span class="proc-step-en">{s.en}</span>
                        </div>
                        <div class="proc-step-desc">{s.desc}</div>
                      </div>
                    </li>
                  {/each}
                </ol>
              </section>

              <section class="proc-block">
                <div class="proc-block-head">
                  <span class="proc-num">02</span>
                  <span class="proc-block-title">收款方式 Payment</span>
                </div>
                <div class="proc-payment">
                  {#each proc.payment as p}
                    <div class="proc-payment-row">
                      <span class="proc-payment-method">{p.method}</span>
                      <span class="proc-payment-detail">{p.detail}</span>
                    </div>
                  {/each}
                </div>
              </section>

              <section class="proc-block">
                <div class="proc-block-head">
                  <span class="proc-num">03</span>
                  <span class="proc-block-title">補充規則 Rules</span>
                </div>
                <div class="proc-notes">{proc.notes}</div>
              </section>

              <footer class="proc-foot">
                <span>{proc.artistName}</span>
                <span>·</span>
                <span>{proc.handle}</span>
              </footer>
            </div>
          </div>
        </main>
      </div>

    <!-- ═══ STATUS MANAGER ══════════════════════════════════════ -->
    {:else if sub === 'status'}
      <div class="status-mgr">
        <div class="status-current">
          <span class="eyebrow">Current Status</span>
          <h2 style="color:{currentStatus.color}">● {currentStatus.zh}</h2>
          <p class="dim-note">{currentStatus.desc}</p>
        </div>

        <div class="status-options">
          {#each STATUS_OPTIONS as s}
            <button type="button"
              class="status-card"
              class:active={statusState === s.k}
              style="--card-c:{s.color}"
              onclick={() => statusState = s.k}
            >
              <div class="status-card-dot" style="background:{s.color}"></div>
              <div class="status-card-zh">{s.zh}</div>
              <div class="status-card-en">{s.en}</div>
              <div class="status-card-desc">{s.desc}</div>
            </button>
          {/each}
        </div>

        <form method="POST" action="?/updateStatus" use:enhance class="status-fields">
          <input type="hidden" name="open_status" value={statusState} />
          <div class="field">
            <div class="field-label">
              <span class="label-zh">下次開放日期</span>
              <span class="label-en">Next opening</span>
            </div>
            <input class="input" type="text" name="next_open" placeholder="2026-06-01" bind:value={nextOpen} />
          </div>
          <div class="field">
            <div class="field-label">
              <span class="label-zh">給委託人的訊息</span>
              <span class="label-en">Message shown to clients</span>
            </div>
            <textarea class="textarea" rows="3" name="open_note" bind:value={openNote}></textarea>
          </div>
          <div class="field">
            <div class="field-label">
              <span class="label-zh">候補名額上限</span>
              <span class="label-en">Waitlist cap</span>
            </div>
            <input class="input" type="number" name="queue_limit" bind:value={queueLimit} />
          </div>
          <button type="submit" class="btn primary">儲存狀態設定</button>
        </form>
      </div>

    <!-- ═══ EMAIL TEMPLATES ═══════════════════════════════════════ -->
    {:else if sub === 'email'}
      <div class="email-mgr">
        <div class="email-intro">
          <span class="eyebrow">Email Templates</span>
          <p class="dim-note">設定接受與拒絕委託時的預設郵件內容。點擊接受／拒絕按鈕時，此模板會自動帶入，可在寄出前編輯。</p>
          <p class="dim-note" style="margin-top:4px">
            可使用的變數：<code class="code-var">{'{clientName}'}</code>（自動替換為委託人姓名）
          </p>
        </div>

        <form method="POST" action="?/updateEmailTemplates" use:enhance onsubmit={() => saveEmailTemplates()}>
          <div class="email-template-block">
            <div class="email-template-head accept-head">
              <span class="email-template-label">✓ 接受委託</span>
              <span class="email-template-hint">Accept</span>
            </div>
            <textarea
              class="textarea email-textarea"
              name="email_accept"
              rows="10"
              bind:value={emailAccept}
              placeholder="親愛的 &#123;clientName&#125;，&#10;&#10;感謝您的委託申請！..."
            ></textarea>
          </div>

          <div class="email-template-block" style="margin-top:20px">
            <div class="email-template-head reject-head">
              <span class="email-template-label">✕ 拒絕委託</span>
              <span class="email-template-hint">Reject</span>
            </div>
            <textarea
              class="textarea email-textarea"
              name="email_reject"
              rows="10"
              bind:value={emailReject}
              placeholder="親愛的 &#123;clientName&#125;，&#10;&#10;感謝您的委託申請..."
            ></textarea>
          </div>

          <div style="margin-top:16px">
            <button type="submit" class="btn primary">
              {emailSaved ? '✓ 已儲存' : '儲存模板'}
            </button>
          </div>
        </form>
      </div>
    {/if}
  </div>
</div>

<style>
/* ── local CSS var aliases ─────────────────────────────────── */
.manage {
  --paper:   #ffffff;
  --paper-2: #f5f4ef;
  --ink-bg:  #f0ede6;
  --ink-2:   rgba(21,22,45,0.10);
  --ink-3:   rgba(21,22,45,0.45);
  --ink-4:   rgba(21,22,45,0.32);
  --accent:  var(--red);
  --hairline: rgba(21,22,45,0.12);
  --hairline-2: rgba(21,22,45,0.16);
  --sans:    var(--font-body);
  --mono:    var(--font-mono);
  --serif:   var(--font-body);
  --r-sm:    4px;

  padding: 24px 28px;
  max-width: 1280px;
  margin: 0 auto;
}

/* ── layout ─────────────────────────────────────────────────── */
.manage-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ink-2);
}
.manage-head h1 {
  font-family: var(--font-display);
  font-size: 32px;
  margin: 4px 0 0;
}
.manage-subtabs {
  display: flex;
  gap: 4px;
  background: var(--paper-2);
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--ink-2);
}
.manage-subtab {
  background: transparent;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}
.manage-subtab:hover { background: rgba(0,0,0,0.04); }
.manage-subtab.active { background: var(--ink); color: var(--paper); }
.manage-subtab-zh { font-size: 13px; font-weight: 600; }
.manage-subtab-en { font-size: 9px; opacity: 0.6; letter-spacing: 0.08em; text-transform: uppercase; }

/* ── generic UI primitives ──────────────────────────────────── */
.eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.dim-note { font-size: 13px; color: var(--ink-3); line-height: 1.5; max-width: 52ch; }
.label-zh { font-size: 13px; font-weight: 500; color: var(--ink); }
.label-en { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-4); }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.input, .textarea {
  width: 100%;
  background: var(--paper);
  border: 1px solid var(--hairline-2);
  padding: 9px 11px;
  font-size: 13px;
  font-family: var(--font-body);
  color: var(--ink);
  outline: none;
  transition: border-color 0.15s;
  border-radius: var(--r-sm);
  box-sizing: border-box;
}
.input:focus, .textarea:focus { border-color: var(--ink); }
.input.mono { font-family: var(--font-mono); }
.textarea { resize: vertical; min-height: 64px; line-height: 1.5; }
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border: 1px solid var(--hairline-2);
  background: var(--paper);
  color: var(--ink-3);
  transition: 0.15s;
  border-radius: var(--r-sm);
  white-space: nowrap;
  cursor: pointer;
}
.btn:hover { border-color: var(--ink); color: var(--ink); }
.btn:disabled { opacity: 0.35; cursor: default; pointer-events: none; }
.btn.primary { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.btn.primary:hover { background: var(--accent); border-color: var(--accent); }
.btn.ghost { background: transparent; border-color: transparent; }
.btn.ghost:hover { background: var(--paper-2); }
.btn.tiny { padding: 4px 8px; font-size: 9.5px; }
.btn.danger { color: var(--accent); }
.btn.danger:hover { background: #fee2e2; }
.btn.block { width: 100%; }
.chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  background: var(--paper-2);
  border: 1px solid var(--ink-2);
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--ink-3);
}

/* ── process sheet ──────────────────────────────────────────── */
.hidden-form { display: none; }
.process-wrap {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  min-height: 70vh;
}
.process-editor {
  background: var(--paper-2);
  border: 1px solid var(--ink-2);
  border-radius: 8px;
  padding: 16px;
  max-height: 78vh;
  overflow-y: auto;
}
.process-section {
  padding: 12px 0;
  border-bottom: 1px dashed var(--ink-2);
}
.process-section:last-child { border-bottom: none; }
.process-section-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.process-section-head h3 { font-size: 14px; margin: 0; }
.process-section-head .btn { margin-left: auto; }
.process-step-edit {
  background: var(--paper);
  border: 1px solid var(--ink-2);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
}
.process-step-edit-head {
  display: grid;
  grid-template-columns: auto 1fr 1fr auto;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}
.process-step-num {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-4);
  padding: 0 4px;
}
.process-step-actions { display: flex; gap: 2px; }
.pay-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 6px; align-items: center; }

/* ── process preview / poster ───────────────────────────────── */
.process-preview {
  background: var(--ink-bg);
  border: 1px solid var(--ink-2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.process-preview-bar {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--ink-2);
  align-items: center;
  background: var(--paper);
}
.process-preview-stage {
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: repeating-linear-gradient(45deg, var(--paper-2) 0 8px, var(--paper) 8px 16px);
}

.proc-poster {
  width: 1080px;
  min-height: 1440px;
  background: var(--paper);
  padding: 80px 72px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.12);
  transform-origin: top center;
  transform: scale(0.52);
  margin-bottom: -660px;
  color: var(--ink);
  flex-shrink: 0;
}
.proc-head { padding-bottom: 32px; }
.proc-eyebrow { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; color: var(--ink-4); }
.proc-title { font-family: var(--font-display); font-size: 64px; line-height: 1; margin: 12px 0 6px; }
.proc-sub { font-size: 18px; color: var(--ink-3); }
.proc-rule { height: 2px; background: var(--ink); margin-top: 24px; width: 80px; }
.proc-block { padding: 28px 0; border-top: 1px solid var(--ink-2); }
.proc-block-head { display: flex; gap: 14px; align-items: baseline; margin-bottom: 18px; }
.proc-num { font-family: var(--font-mono); font-size: 12px; color: var(--accent); letter-spacing: 0.18em; }
.proc-block-title { font-family: var(--font-display); font-size: 22px; }
.proc-steps { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.proc-step {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--ink-2);
}
.proc-step:last-child { border-bottom: none; }
.proc-step-num { font-family: var(--font-mono); font-size: 28px; color: var(--ink-4); line-height: 1; }
.proc-step-titles { display: flex; gap: 12px; align-items: baseline; margin-bottom: 6px; }
.proc-step-zh { font-size: 22px; font-weight: 600; }
.proc-step-en { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; color: var(--ink-4); text-transform: uppercase; }
.proc-step-desc { font-size: 15px; line-height: 1.55; color: var(--ink-3); }
.proc-payment { display: flex; flex-direction: column; gap: 10px; }
.proc-payment-row { display: flex; justify-content: space-between; padding: 10px 14px; background: var(--paper-2); border-left: 3px solid var(--accent); }
.proc-payment-method { font-size: 18px; font-weight: 600; }
.proc-payment-detail { font-family: var(--font-mono); font-size: 14px; color: var(--ink-3); }
.proc-notes { font-size: 14px; line-height: 1.7; color: var(--ink-3); white-space: pre-wrap; }
.proc-foot {
  padding-top: 28px;
  border-top: 1px solid var(--ink-2);
  display: flex;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-4);
  letter-spacing: 0.12em;
}

/* ── status manager ─────────────────────────────────────────── */
.status-mgr { display: flex; flex-direction: column; gap: 24px; max-width: 860px; }
.status-current {
  padding: 20px 24px;
  border-left: 3px solid var(--accent);
  background: var(--paper-2);
  border-radius: 0 8px 8px 0;
}
.status-current h2 { font-size: 28px; margin: 4px 0; }
.status-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.status-card {
  background: var(--paper);
  border: 2px solid var(--ink-2);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  text-align: left;
  transition: 120ms;
}
.status-card:hover { border-color: var(--ink-3); }
.status-card.active { border-color: var(--card-c); box-shadow: 0 0 0 2px var(--card-c); }
.status-card-dot { width: 10px; height: 10px; border-radius: 50%; margin-bottom: 8px; }
.status-card-zh { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
.status-card-en { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; color: var(--ink-4); text-transform: uppercase; margin-bottom: 8px; }
.status-card-desc { font-size: 12px; color: var(--ink-3); line-height: 1.5; }
.status-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: var(--paper-2);
  border: 1px solid var(--ink-2);
  border-radius: 8px;
}

/* ── email templates ─────────────────────────────────────────── */
.email-mgr { max-width: 720px; display: flex; flex-direction: column; gap: 20px; }
.email-intro { padding: 16px 20px; background: var(--paper-2); border: 1px solid var(--ink-2); border-radius: 8px; }
.code-var {
  font-family: var(--font-mono);
  font-size: 12px;
  background: rgba(31,63,184,0.08);
  color: var(--blue);
  padding: 1px 5px;
  border-radius: 3px;
}
.email-template-block { border: 1px solid var(--ink-2); border-radius: 8px; overflow: hidden; }
.email-template-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--ink-2);
}
.accept-head { background: rgba(31,63,184,0.06); }
.reject-head { background: rgba(227,61,44,0.06); }
.email-template-label { font-size: 13px; font-weight: 700; }
.email-template-hint { font-family: var(--font-mono); font-size: 10px; color: var(--ink-4); letter-spacing: 0.1em; }
.email-textarea { border: none; border-radius: 0; resize: vertical; min-height: 180px; }

@media (max-width: 1024px) {
  .process-wrap { grid-template-columns: 1fr; }
  .status-options { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .status-options { grid-template-columns: 1fr; }
}
</style>
