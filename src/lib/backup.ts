import { zipSync, unzipSync } from 'fflate'

export const BACKUP_SCHEMA_VERSION = 1

export type BackupManifest = {
  schema_version: number
  exported_at: string
  included_images: { works: boolean; types: boolean }
}

export type BackupData = {
  creator: Record<string, unknown> | null
  commission_types: unknown[]
  price_options: unknown[]
  commissions: unknown[]
  works: unknown[]
  work_folders: unknown[]
  revision_versions: unknown[]
  revision_comments: unknown[]
  commission_messages: unknown[]
  commission_discussions: unknown[]
  notifications: unknown[]
  anon_messages: unknown[]
  page_reactions: unknown[]
}

/** 從 URL 中取出 R2 key（去掉 /api/assets/ 前綴） */
export function extractR2Key(url: string): string | null {
  const match = url.match(/\/api\/assets\/([^?#]+)/)
  return match ? match[1] : null
}

/** 從副檔名猜測 content-type */
export function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', gif: 'image/gif',
    svg: 'image/svg+xml', avif: 'image/avif',
  }
  return map[ext] ?? 'application/octet-stream'
}

/** 查詢所有 D1 資料（不含 resend_api_key / hub_token） */
export async function collectD1Data(db: D1Database): Promise<BackupData> {
  const [
    creator,
    commission_types, price_options, commissions,
    works, work_folders,
    revision_versions, revision_comments,
    commission_messages, commission_discussions,
    notifications, anon_messages, page_reactions,
  ] = await Promise.all([
    db.prepare(`
      SELECT id, display_name, bio, avatar_url, styles,
             contact_email, contact_discord, contact_other,
             is_open, open_note, queue_limit, created_at,
             page_config, open_status, next_open, process_config,
             site_url, email_mode, resend_from, notify_client_message_email
      FROM creators WHERE id = 'main'
    `).first<Record<string, unknown>>(),
    db.prepare("SELECT * FROM commission_types").all(),
    db.prepare("SELECT * FROM price_options").all(),
    db.prepare("SELECT * FROM commissions").all(),
    db.prepare("SELECT * FROM works").all(),
    db.prepare("SELECT * FROM work_folders").all(),
    db.prepare("SELECT * FROM revision_versions").all(),
    db.prepare("SELECT * FROM revision_comments").all(),
    db.prepare("SELECT * FROM commission_messages").all(),
    db.prepare("SELECT * FROM commission_discussions").all(),
    db.prepare("SELECT * FROM notifications").all(),
    db.prepare("SELECT * FROM anon_messages").all(),
    db.prepare("SELECT * FROM page_reactions").all(),
  ])
  return {
    creator: creator ?? null,
    commission_types:      commission_types.results,
    price_options:         price_options.results,
    commissions:           commissions.results,
    works:                 works.results,
    work_folders:          work_folders.results,
    revision_versions:     revision_versions.results,
    revision_comments:     revision_comments.results,
    commission_messages:   commission_messages.results,
    commission_discussions: commission_discussions.results,
    notifications:         notifications.results,
    anon_messages:         anon_messages.results,
    page_reactions:        page_reactions.results,
  }
}

/** 打包成 ZIP Uint8Array */
export function packZip(
  data: BackupData,
  manifest: BackupManifest,
  images: Record<string, Uint8Array>
): Uint8Array {
  const enc = new TextEncoder()
  const j = (v: unknown) => enc.encode(JSON.stringify(v, null, 2))
  return zipSync({
    'manifest.json':                   j(manifest),
    'data/creator.json':               j(data.creator),
    'data/commission_types.json':      j(data.commission_types),
    'data/price_options.json':         j(data.price_options),
    'data/commissions.json':           j(data.commissions),
    'data/works.json':                 j(data.works),
    'data/work_folders.json':          j(data.work_folders),
    'data/revision_versions.json':     j(data.revision_versions),
    'data/revision_comments.json':     j(data.revision_comments),
    'data/commission_messages.json':   j(data.commission_messages),
    'data/commission_discussions.json': j(data.commission_discussions),
    'data/notifications.json':         j(data.notifications),
    'data/anon_messages.json':         j(data.anon_messages),
    'data/page_reactions.json':        j(data.page_reactions),
    ...images,
  })
}

export type ParsedZip = {
  manifest: BackupManifest
  data: BackupData
  images: Record<string, Uint8Array>
}

/** 解析 ZIP buffer，回傳結構化資料 */
export function parseZipBuffer(buffer: Uint8Array): ParsedZip {
  const dec = new TextDecoder()
  const files = unzipSync(buffer)

  const manifestRaw = files['manifest.json']
  if (!manifestRaw) throw new Error('manifest.json not found in ZIP')
  const manifest = JSON.parse(dec.decode(manifestRaw)) as BackupManifest
  if (manifest.schema_version !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`不支援的備份版本：${manifest.schema_version}`)
  }

  const p = (name: string): unknown[] => {
    const raw = files[`data/${name}.json`]
    if (!raw) {
      console.warn(`[backup] data/${name}.json not found in ZIP (schema_version=${manifest.schema_version})`)
      return []
    }
    return JSON.parse(dec.decode(raw))
  }
  const creatorRaw = files['data/creator.json']
  const creator = creatorRaw ? JSON.parse(dec.decode(creatorRaw)) : null

  const data: BackupData = {
    creator,
    commission_types:      p('commission_types'),
    price_options:         p('price_options'),
    commissions:           p('commissions'),
    works:                 p('works'),
    work_folders:          p('work_folders'),
    revision_versions:     p('revision_versions'),
    revision_comments:     p('revision_comments'),
    commission_messages:   p('commission_messages'),
    commission_discussions: p('commission_discussions'),
    notifications:         p('notifications'),
    anon_messages:         p('anon_messages'),
    page_reactions:        p('page_reactions'),
  }

  const images: Record<string, Uint8Array> = {}
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith('images/')) images[path] = content
  }

  return { manifest, data, images }
}

/** 清空所有表並批次寫入備份資料。非 atomic——失敗時部分資料可能已寫入。 */
export async function restoreToD1(
  db: D1Database,
  data: BackupData
): Promise<Record<string, number>> {
  // 刪除順序：先刪有 FK 的子表，再刪父表
  await db.batch([
    db.prepare("DELETE FROM page_reactions"),
    db.prepare("DELETE FROM anon_messages"),
    db.prepare("DELETE FROM notifications"),
    db.prepare("DELETE FROM commission_discussions"),
    db.prepare("DELETE FROM commission_messages"),
    db.prepare("DELETE FROM revision_comments"),
    db.prepare("DELETE FROM revision_versions"),
    db.prepare("DELETE FROM commissions"),
    db.prepare("DELETE FROM works"),
    db.prepare("DELETE FROM work_folders"),
    db.prepare("DELETE FROM price_options"),
    db.prepare("DELETE FROM commission_types"),
    db.prepare("DELETE FROM creators"),
  ])

  const stats: Record<string, number> = {}

  // 輔助：分批 INSERT（D1 batch 上限 100，保守取 50）
  async function batchInsert(
    table: string,
    rows: unknown[],
    make: (r: any) => D1PreparedStatement
  ) {
    if (rows.length === 0) { stats[table] = 0; return }
    const CHUNK = 50
    for (let i = 0; i < rows.length; i += CHUNK) {
      await db.batch(rows.slice(i, i + CHUNK).map(make))
    }
    stats[table] = rows.length  // only reached if all chunks succeeded
  }

  // 插入順序：父表先於子表
  if (data.creator) {
    const c = data.creator as any
    await db.prepare(`
      INSERT INTO creators
        (id, display_name, bio, avatar_url, styles,
         contact_email, contact_discord, contact_other,
         is_open, open_note, queue_limit, created_at,
         page_config, open_status, next_open, process_config,
         site_url, email_mode, resend_from, notify_client_message_email)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      c.id, c.display_name, c.bio ?? null, c.avatar_url ?? null, c.styles ?? null,
      c.contact_email ?? null, c.contact_discord ?? null, c.contact_other ?? null,
      c.is_open ?? 0, c.open_note ?? null, c.queue_limit ?? 10,
      c.created_at, c.page_config ?? null, c.open_status ?? 'open',
      c.next_open ?? null, c.process_config ?? null,
      c.site_url ?? null, c.email_mode ?? 'none',
      c.resend_from ?? null, c.notify_client_message_email ?? 0,
    ).run()
    stats['creators'] = 1
  }

  await batchInsert('commission_types', data.commission_types, (r) =>
    db.prepare(`INSERT INTO commission_types (id, name, description, base_price, sort_order, is_active, preview_images) VALUES (?,?,?,?,?,?,?)`)
      .bind(r.id, r.name, r.description ?? null, r.base_price ?? 0, r.sort_order ?? 0, r.is_active ?? 1, r.preview_images ?? '[]')
  )

  await batchInsert('price_options', data.price_options, (r) =>
    db.prepare(`INSERT INTO price_options (id, type_id, label, option_type, price_delta, price_multiplier, sort_order) VALUES (?,?,?,?,?,?,?)`)
      .bind(r.id, r.type_id, r.label, r.option_type, r.price_delta ?? 0, r.price_multiplier ?? 1.0, r.sort_order ?? 0)
  )

  await batchInsert('work_folders', data.work_folders, (r) =>
    db.prepare(`INSERT INTO work_folders (id, name, sort_order) VALUES (?,?,?)`)
      .bind(r.id, r.name, r.sort_order ?? 0)
  )

  await batchInsert('works', data.works, (r) =>
    db.prepare(`INSERT INTO works (id, title, description, preview_url, original_url, folder_id, tags, sort_order, is_visible, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(r.id, r.title ?? null, r.description ?? null, r.preview_url, r.original_url ?? null, r.folder_id ?? null, r.tags ?? '[]', r.sort_order ?? 0, r.is_visible ?? 1, r.created_at)
  )

  await batchInsert('commissions', data.commissions, (r) =>
    db.prepare(`INSERT INTO commissions (id, type_id, client_name, client_email, client_hub_id, detail, selected_options, estimated_price, status, creator_note, is_paid, created_at, updated_at, delivery_r2_key, delivery_expires, is_waiting, due_date, sub_stage) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(r.id, r.type_id ?? null, r.client_name, r.client_email, r.client_hub_id ?? null, r.detail ?? null, r.selected_options ?? '[]', r.estimated_price ?? 0, r.status, r.creator_note ?? null, r.is_paid ?? 0, r.created_at, r.updated_at, r.delivery_r2_key ?? null, r.delivery_expires ?? null, r.is_waiting ?? 0, r.due_date ?? null, r.sub_stage ?? null)
  )

  await batchInsert('revision_versions', data.revision_versions, (r) =>
    db.prepare(`INSERT INTO revision_versions (id, commission_id, version_number, image_url, status, uploaded_at) VALUES (?,?,?,?,?,?)`)
      .bind(r.id, r.commission_id, r.version_number ?? 1, r.image_url, r.status ?? 'active', r.uploaded_at)
  )

  await batchInsert('revision_comments', data.revision_comments, (r) =>
    db.prepare(`INSERT INTO revision_comments (id, version_id, author_role, x_percent, y_percent, content, is_resolved, created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(r.id, r.version_id, r.author_role, r.x_percent ?? null, r.y_percent ?? null, r.content, r.is_resolved ?? 0, r.created_at)
  )

  await batchInsert('commission_messages', data.commission_messages, (r) =>
    db.prepare(`INSERT INTO commission_messages (id, commission_id, author_role, content, created_at) VALUES (?,?,?,?,?)`)
      .bind(r.id, r.commission_id, r.author_role, r.content, r.created_at)
  )

  await batchInsert('commission_discussions', data.commission_discussions, (r) =>
    db.prepare(`INSERT INTO commission_discussions (commission_id, client_template, artist_summary, alignment_notes, client_confirmed, artist_confirmed, updated_at) VALUES (?,?,?,?,?,?,?)`)
      .bind(r.commission_id, r.client_template ?? '', r.artist_summary ?? '', r.alignment_notes ?? '', r.client_confirmed ?? 0, r.artist_confirmed ?? 0, r.updated_at)
  )

  await batchInsert('notifications', data.notifications, (r) =>
    db.prepare(`INSERT INTO notifications (id, type, title, body, link_url, is_read, created_at) VALUES (?,?,?,?,?,?,?)`)
      .bind(r.id, r.type, r.title, r.body, r.link_url ?? null, r.is_read ?? 0, r.created_at)
  )

  await batchInsert('anon_messages', data.anon_messages, (r) =>
    db.prepare(`INSERT INTO anon_messages (id, block_id, content, is_read, created_at) VALUES (?,?,?,?,?)`)
      .bind(r.id, r.block_id ?? '', r.content, r.is_read ?? 0, r.created_at)
  )

  await batchInsert('page_reactions', data.page_reactions, (r) =>
    db.prepare(`INSERT INTO page_reactions (block_id, emoji_index, count) VALUES (?,?,?)`)
      .bind(r.block_id, r.emoji_index, r.count ?? 0)
  )

  return stats
}
