-- Site inbox notifications + optional client-message email reminder toggle
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

ALTER TABLE creators ADD COLUMN notify_client_message_email INTEGER NOT NULL DEFAULT 0;
