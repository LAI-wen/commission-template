-- Anonymous box messages from public visitors
CREATE TABLE IF NOT EXISTS anon_messages (
  id TEXT PRIMARY KEY,
  block_id TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
