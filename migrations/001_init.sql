-- 繪師基本資料
CREATE TABLE IF NOT EXISTS creators (
  id TEXT PRIMARY KEY DEFAULT 'main',
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  styles TEXT,
  contact_email TEXT,
  contact_discord TEXT,
  contact_other TEXT,
  is_open INTEGER NOT NULL DEFAULT 0,
  open_note TEXT,
  queue_limit INTEGER DEFAULT 10,
  hub_token TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 委託類型
CREATE TABLE IF NOT EXISTS commission_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 加價選項
CREATE TABLE IF NOT EXISTS price_options (
  id TEXT PRIMARY KEY,
  type_id TEXT NOT NULL REFERENCES commission_types(id),
  label TEXT NOT NULL,
  option_type TEXT NOT NULL CHECK(option_type IN ('add','multiply','select')),
  price_delta INTEGER DEFAULT 0,
  price_multiplier REAL DEFAULT 1.0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 委託單
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  type_id TEXT REFERENCES commission_types(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_hub_id TEXT,
  detail TEXT,
  selected_options TEXT DEFAULT '[]',
  estimated_price INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','accepted','rejected','in_progress','revision','completed','cancelled')),
  creator_note TEXT,
  is_paid INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 草稿版本
CREATE TABLE IF NOT EXISTS revision_versions (
  id TEXT PRIMARY KEY,
  commission_id TEXT NOT NULL REFERENCES commissions(id),
  version_number INTEGER NOT NULL DEFAULT 1,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active','superseded')),
  uploaded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 紅線留言
CREATE TABLE IF NOT EXISTS revision_comments (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES revision_versions(id),
  author_role TEXT NOT NULL CHECK(author_role IN ('artist','client')),
  x_percent REAL,
  y_percent REAL,
  content TEXT NOT NULL,
  is_resolved INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
