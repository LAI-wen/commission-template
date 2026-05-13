import { nanoid } from "nanoid"

export type Commission = {
  id: string
  type_id: string | null
  client_name: string
  client_email: string
  client_hub_id: string | null
  detail: string | null
  selected_options: string
  estimated_price: number
  status: string
  creator_note: string | null
  is_paid: number
  created_at: number
  updated_at: number
  delivery_r2_key: string | null
  delivery_expires: number | null
}

export type CommissionType = {
  id: string
  name: string
  description: string | null
  base_price: number
  sort_order: number
  is_active: number
}

// ── 繪師資料 ──────────────────────────
export async function getCreator(db: D1Database) {
  return db
    .prepare("SELECT * FROM creators WHERE id = 'main'")
    .first<Record<string, unknown>>()
}

export async function updateCreatorStatus(
  db: D1Database,
  isOpen: boolean,
  note: string
) {
  return db
    .prepare(
      "UPDATE creators SET is_open = ?, open_note = ? WHERE id = 'main'"
    )
    .bind(isOpen ? 1 : 0, note)
    .run()
}

// ── 委託類型 ──────────────────────────
export async function getCommissionTypes(db: D1Database) {
  return db
    .prepare(
      "SELECT * FROM commission_types WHERE is_active = 1 ORDER BY sort_order"
    )
    .all<CommissionType>()
}

export async function getCommissionTypeWithOptions(
  db: D1Database,
  typeId: string
) {
  const type = await db
    .prepare("SELECT * FROM commission_types WHERE id = ?")
    .bind(typeId)
    .first<CommissionType>()

  const options = await db
    .prepare(
      "SELECT * FROM price_options WHERE type_id = ? ORDER BY sort_order"
    )
    .bind(typeId)
    .all()

  return { type, options: options.results }
}

export async function upsertCommissionType(
  db: D1Database,
  data: {
    id?: string
    name: string
    description: string
    base_price: number
    sort_order: number
  }
) {
  const id = data.id || nanoid()
  return db
    .prepare(`
      INSERT INTO commission_types (id, name, description, base_price, sort_order)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        base_price = excluded.base_price,
        sort_order = excluded.sort_order
    `)
    .bind(id, data.name, data.description, data.base_price, data.sort_order)
    .run()
}

export async function deleteCommissionType(db: D1Database, id: string) {
  // 軟刪除或直接刪除？這裡先用隱藏
  return db
    .prepare("UPDATE commission_types SET is_active = 0 WHERE id = ?")
    .bind(id)
    .run()
}

// ── 加價選項 ──────────────────────────
export async function upsertPriceOption(
  db: D1Database,
  data: {
    id?: string
    type_id: string
    label: string
    option_type: "add" | "multiply" | "select"
    price_delta?: number
    price_multiplier?: number
    sort_order: number
  }
) {
  const id = data.id || nanoid()
  return db
    .prepare(`
      INSERT INTO price_options (id, type_id, label, option_type, price_delta, price_multiplier, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        label = excluded.label,
        option_type = excluded.option_type,
        price_delta = excluded.price_delta,
        price_multiplier = excluded.price_multiplier,
        sort_order = excluded.sort_order
    `)
    .bind(
      id,
      data.type_id,
      data.label,
      data.option_type,
      data.price_delta ?? 0,
      data.price_multiplier ?? 1.0,
      data.sort_order
    )
    .run()
}

export async function deletePriceOption(db: D1Database, id: string) {
  return db.prepare("DELETE FROM price_options WHERE id = ?").bind(id).run()
}

// ── 委託單 ────────────────────────────
export async function getCommissions(db: D1Database, status?: string) {
  const query = status
    ? "SELECT * FROM commissions WHERE status = ? ORDER BY created_at DESC"
    : "SELECT * FROM commissions ORDER BY created_at DESC"

  const stmt = status
    ? db.prepare(query).bind(status)
    : db.prepare(query)

  return stmt.all<Commission>()
}

export async function getCommission(db: D1Database, id: string) {
  return db
    .prepare("SELECT * FROM commissions WHERE id = ?")
    .bind(id)
    .first<Commission>()
}

export async function createCommission(
  db: D1Database,
  data: {
    typeId: string | null
    clientName: string
    clientEmail: string
    clientHubId: string | null
    detail: string
    selectedOptions: string
    estimatedPrice: number
  }
) {
  const id = nanoid()
  await db
    .prepare(`
      INSERT INTO commissions
        (id, type_id, client_name, client_email, client_hub_id,
         detail, selected_options, estimated_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      data.typeId,
      data.clientName,
      data.clientEmail,
      data.clientHubId,
      data.detail,
      data.selectedOptions,
      data.estimatedPrice
    )
    .run()
  return id
}

export async function updateCommissionStatus(
  db: D1Database,
  id: string,
  status: string,
  note?: string,
  deliveryKey?: string,
  deliveryExpires?: number
) {
  return db
    .prepare(`
      UPDATE commissions
      SET status = ?, creator_note = ?, delivery_r2_key = ?, delivery_expires = ?, updated_at = unixepoch()
      WHERE id = ?
    `)
    .bind(status, note ?? null, deliveryKey ?? null, deliveryExpires ?? null, id)
    .run()
}

// ── 階段與草稿 ────────────────────────
export async function getRevisions(db: D1Database, commissionId: string) {
  return db
    .prepare(
      "SELECT * FROM revision_versions WHERE commission_id = ? ORDER BY version_number DESC"
    )
    .bind(commissionId)
    .all()
}

export async function createRevision(
  db: D1Database,
  commissionId: string,
  imageUrl: string
) {
  const id = nanoid()
  // 取得當前最大版號
  const lastVersion = await db
    .prepare(
      "SELECT MAX(version_number) as max_v FROM revision_versions WHERE commission_id = ?"
    )
    .bind(commissionId)
    .first<{ max_v: number | null }>()

  const nextVersion = (lastVersion?.max_v ?? 0) + 1

  await db
    .prepare(`
      INSERT INTO revision_versions (id, commission_id, version_number, image_url)
      VALUES (?, ?, ?, ?)
    `)
    .bind(id, commissionId, nextVersion, imageUrl)
    .run()

  return id
}

export async function getRevisionComments(db: D1Database, versionId: string) {
  return db
    .prepare(
      "SELECT * FROM revision_comments WHERE version_id = ? ORDER BY created_at ASC"
    )
    .bind(versionId)
    .all()
}

export async function addRevisionComment(
  db: D1Database,
  versionId: string,
  role: "artist" | "client",
  content: string,
  x?: number,
  y?: number
) {
  const id = nanoid()
  return db
    .prepare(`
      INSERT INTO revision_comments (id, version_id, author_role, content, x_percent, y_percent)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(id, versionId, role, content, x ?? null, y ?? null)
    .run()
}

export type Work = {
  id: string
  title: string | null
  description: string | null
  preview_url: string
  original_url: string | null
  folder_id: string | null
  tags: string
  sort_order: number
  is_visible: number
  created_at: number
}

export type WorkFolder = {
  id: string
  name: string
  sort_order: number
}

// ── 作品資料夾 ────────────────────────
export async function getFolders(db: D1Database) {
  return db.prepare(`
    SELECT wf.*, COUNT(w.id) as work_count
    FROM work_folders wf
    LEFT JOIN works w ON w.folder_id = wf.id AND w.is_visible = 1
    GROUP BY wf.id
    ORDER BY wf.sort_order
  `).all<WorkFolder & { work_count: number }>()
}

export async function createFolder(db: D1Database, name: string) {
  const id = nanoid()
  await db.prepare(`
    INSERT INTO work_folders (id, name, sort_order)
    VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM work_folders))
  `).bind(id, name).run()
  return id
}

export async function deleteFolder(db: D1Database, id: string) {
  await db.prepare(`UPDATE works SET folder_id = NULL WHERE folder_id = ?`).bind(id).run()
  await db.prepare(`DELETE FROM work_folders WHERE id = ?`).bind(id).run()
}

// ── 作品 ──────────────────────────────
export async function getWorks(
  db: D1Database,
  opts: { folderId?: string | null; visibleOnly?: boolean } = {}
) {
  let query = "SELECT * FROM works WHERE 1=1"
  const bindings: unknown[] = []

  if (opts.visibleOnly) query += " AND is_visible = 1"
  if (opts.folderId === null) {
    query += " AND folder_id IS NULL"
  } else if (opts.folderId) {
    query += " AND folder_id = ?"
    bindings.push(opts.folderId)
  }

  query += " ORDER BY sort_order ASC, created_at DESC"
  return db.prepare(query).bind(...bindings).all<Work>()
}

export async function createWork(
  db: D1Database,
  data: {
    previewUrl: string
    originalUrl: string | null
    title: string | null
    description: string | null
    folderId: string | null
    tags: string[]
  }
) {
  const id = nanoid()
  const maxOrder = await db.prepare(
    `SELECT COALESCE(MAX(sort_order), 0) as max_order FROM works`
  ).first<{ max_order: number }>()

  await db.prepare(`
    INSERT INTO works
      (id, preview_url, original_url, title, description, folder_id, tags, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.previewUrl, data.originalUrl, data.title,
    data.description, data.folderId, JSON.stringify(data.tags),
    (maxOrder?.max_order ?? 0) + 1
  ).run()

  return id
}

export async function updateWork(
  db: D1Database,
  id: string,
  data: Partial<{
    title: string | null
    description: string | null
    folderId: string | null
    tags: string[]
    isVisible: boolean
    sortOrder: number
  }>
) {
  const sets: string[] = []
  const bindings: unknown[] = []

  if (data.title !== undefined) { sets.push("title = ?"); bindings.push(data.title) }
  if (data.description !== undefined) { sets.push("description = ?"); bindings.push(data.description) }
  if (data.folderId !== undefined) { sets.push("folder_id = ?"); bindings.push(data.folderId) }
  if (data.tags !== undefined) { sets.push("tags = ?"); bindings.push(JSON.stringify(data.tags)) }
  if (data.isVisible !== undefined) { sets.push("is_visible = ?"); bindings.push(data.isVisible ? 1 : 0) }
  if (data.sortOrder !== undefined) { sets.push("sort_order = ?"); bindings.push(data.sortOrder) }

  if (sets.length === 0) return
  bindings.push(id)
  return db.prepare(`UPDATE works SET ${sets.join(", ")} WHERE id = ?`).bind(...bindings).run()
}

export async function deleteWork(db: D1Database, id: string) {
  const work = await db.prepare("SELECT * FROM works WHERE id = ?").bind(id).first<Work>()
  await db.prepare("DELETE FROM works WHERE id = ?").bind(id).run()
  return work
}

// ── 統計 ──────────────────────────────
export type MonthStat = {
  month: string
  total: number
  accepted: number
  rejected: number
  completed: number
  revenue: number
}

export async function getMonthlyStats(
  db: D1Database,
  months: number = 6
): Promise<MonthStat[]> {
  const rows = await db.prepare(`
    SELECT
      strftime('%Y-%m', datetime(created_at, 'unixepoch')) as month,
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('accepted','in_progress','revision','completed') THEN 1 ELSE 0 END) as accepted,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN is_paid = 1 THEN estimated_price ELSE 0 END) as revenue
    FROM commissions
    WHERE created_at >= unixepoch('now', '-${months} months')
    GROUP BY month
    ORDER BY month ASC
  `).all<MonthStat>()
  return rows.results
}

export async function getOverallStats(db: D1Database) {
  return db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('accepted','in_progress','revision','completed') THEN 1 ELSE 0 END) as accepted,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN is_paid = 1 THEN estimated_price ELSE 0 END) as total_revenue,
      ROUND(
        100.0 * SUM(CASE WHEN status IN ('accepted','in_progress','revision','completed') THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 1
      ) as accept_rate
    FROM commissions
  `).first<{
    total: number
    accepted: number
    completed: number
    rejected: number
    pending: number
    total_revenue: number
    accept_rate: number | null
  }>()
}

export async function getTopCommissionTypes(db: D1Database) {
  return db.prepare(`
    SELECT
      ct.name,
      COUNT(c.id) as count,
      SUM(CASE WHEN c.is_paid = 1 THEN c.estimated_price ELSE 0 END) as revenue
    FROM commissions c
    LEFT JOIN commission_types ct ON ct.id = c.type_id
    GROUP BY c.type_id
    ORDER BY count DESC
    LIMIT 5
  `).all<{ name: string; count: number; revenue: number }>()
}

export async function getCommissionsByEmail(db: D1Database, email: string) {
  return db
    .prepare(`
      SELECT c.*, ct.name as type_name
      FROM commissions c
      LEFT JOIN commission_types ct ON ct.id = c.type_id
      WHERE c.client_email = ?
      ORDER BY c.created_at DESC
      LIMIT 20
    `)
    .bind(email.toLowerCase().trim())
    .all<Commission & { type_name: string | null }>()
}
