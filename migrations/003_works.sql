CREATE TABLE IF NOT EXISTS work_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS works (
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
);

CREATE INDEX IF NOT EXISTS idx_works_folder ON works(folder_id);
CREATE INDEX IF NOT EXISTS idx_works_visible ON works(is_visible);
