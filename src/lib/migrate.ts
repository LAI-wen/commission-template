const KV_KEY = "db:schema:v11"

// Final schema for fresh installs — all columns included upfront
const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS creators (
    id TEXT PRIMARY KEY DEFAULT 'main',
    display_name TEXT NOT NULL DEFAULT 'My Studio',
    bio TEXT,
    avatar_url TEXT,
    styles TEXT DEFAULT '[]',
    contact_email TEXT,
    contact_discord TEXT,
    contact_other TEXT,
    is_open INTEGER NOT NULL DEFAULT 0,
    open_note TEXT,
    queue_limit INTEGER DEFAULT 10,
    hub_token TEXT,
    email_mode TEXT NOT NULL DEFAULT 'none',
    resend_api_key TEXT,
    page_config TEXT,
    open_status TEXT NOT NULL DEFAULT 'open',
    next_open TEXT,
    process_config TEXT,
    notify_client_message_email INTEGER NOT NULL DEFAULT 0,
    site_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS commission_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    base_price INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS price_options (
    id TEXT PRIMARY KEY,
    type_id TEXT NOT NULL REFERENCES commission_types(id),
    label TEXT NOT NULL,
    option_type TEXT NOT NULL CHECK(option_type IN ('add','multiply','select')),
    price_delta INTEGER DEFAULT 0,
    price_multiplier REAL DEFAULT 1.0,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS commissions (
    id TEXT PRIMARY KEY,
    type_id TEXT REFERENCES commission_types(id),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_hub_id TEXT,
    detail TEXT,
    selected_options TEXT DEFAULT '[]',
    estimated_price INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending','accepted','rejected','in_progress','revision','completed','delivered','cancelled')),
    creator_note TEXT,
    is_paid INTEGER NOT NULL DEFAULT 0,
    delivery_r2_key TEXT,
    delivery_expires INTEGER,
    is_waiting INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    sub_stage TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS revision_versions (
    id TEXT PRIMARY KEY,
    commission_id TEXT NOT NULL REFERENCES commissions(id),
    version_number INTEGER NOT NULL DEFAULT 1,
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','superseded')),
    uploaded_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS revision_comments (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL REFERENCES revision_versions(id),
    author_role TEXT NOT NULL CHECK(author_role IN ('artist','client')),
    x_percent REAL,
    y_percent REAL,
    content TEXT NOT NULL,
    is_resolved INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS work_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS works (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    preview_url TEXT NOT NULL,
    original_url TEXT,
    folder_id TEXT REFERENCES work_folders(id) ON DELETE SET NULL,
    tags TEXT DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_visible INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS idx_works_folder ON works(folder_id)`,
  `CREATE INDEX IF NOT EXISTS idx_works_visible ON works(is_visible)`,
  `CREATE TABLE IF NOT EXISTS commission_discussions (
    commission_id TEXT PRIMARY KEY REFERENCES commissions(id),
    client_template TEXT NOT NULL DEFAULT '',
    artist_summary TEXT NOT NULL DEFAULT '',
    alignment_notes TEXT NOT NULL DEFAULT '',
    client_confirmed INTEGER NOT NULL DEFAULT 0,
    artist_confirmed INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS commission_messages (
    id TEXT PRIMARY KEY,
    commission_id TEXT NOT NULL REFERENCES commissions(id),
    author_role TEXT NOT NULL CHECK(author_role IN ('artist','client')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link_url TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
]

// Columns added in later migrations — safe to fail if already present
const ALTER_COLUMNS = [
  `ALTER TABLE commissions ADD COLUMN delivery_r2_key TEXT`,
  `ALTER TABLE commissions ADD COLUMN delivery_expires INTEGER`,
  `ALTER TABLE commissions ADD COLUMN is_waiting INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE commissions ADD COLUMN due_date TEXT`,
  `ALTER TABLE commissions ADD COLUMN sub_stage TEXT`,
  `ALTER TABLE creators ADD COLUMN email_mode TEXT NOT NULL DEFAULT 'none'`,
  `ALTER TABLE creators ADD COLUMN resend_api_key TEXT`,
  `ALTER TABLE creators ADD COLUMN page_config TEXT`,
  `ALTER TABLE creators ADD COLUMN open_status TEXT NOT NULL DEFAULT 'open'`,
  `ALTER TABLE creators ADD COLUMN next_open TEXT`,
  `ALTER TABLE creators ADD COLUMN process_config TEXT`,
  `ALTER TABLE creators ADD COLUMN notify_client_message_email INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE creators ADD COLUMN site_url TEXT`,
]

export async function ensureMigrated(env: Env): Promise<void> {
  // Skip migration in dev if KV is not available
  if (!env?.KV) return
  if (await env.KV.get(KV_KEY)) return

  // Create all tables (idempotent)
  await env.DB.batch(CREATE_TABLES.map(sql => env.DB.prepare(sql)))

  // Add columns to existing tables — ignore errors (column may already exist)
  for (const sql of ALTER_COLUMNS) {
    try { await env.DB.prepare(sql).run() } catch { /* already exists */ }
  }

  // Ensure a default creator row exists
  await env.DB.prepare(
    `INSERT OR IGNORE INTO creators (id, display_name) VALUES ('main', 'My Studio')`
  ).run()

  await env.KV.put(KV_KEY, "1")
}
