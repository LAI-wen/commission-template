-- Pre-production discussion room for queued commissions
CREATE TABLE IF NOT EXISTS commission_discussions (
  commission_id TEXT PRIMARY KEY REFERENCES commissions(id),
  client_template TEXT NOT NULL DEFAULT '',
  artist_summary TEXT NOT NULL DEFAULT '',
  alignment_notes TEXT NOT NULL DEFAULT '',
  client_confirmed INTEGER NOT NULL DEFAULT 0,
  artist_confirmed INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS commission_messages (
  id TEXT PRIMARY KEY,
  commission_id TEXT NOT NULL REFERENCES commissions(id),
  author_role TEXT NOT NULL CHECK(author_role IN ('artist', 'client')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
