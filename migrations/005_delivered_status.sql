-- migrations/005_delivered_status.sql
-- Rebuild commissions table to add 'delivered' to status CHECK constraint
-- D1 does not support ALTER COLUMN, so we must recreate the table

CREATE TABLE IF NOT EXISTS commissions_new (
  id TEXT PRIMARY KEY,
  type_id TEXT REFERENCES commission_types(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_hub_id TEXT,
  detail TEXT,
  selected_options TEXT DEFAULT '[]',
  estimated_price INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN (
      'pending','accepted','rejected',
      'in_progress','revision','completed',
      'delivered','cancelled'
    )),
  creator_note TEXT,
  is_paid INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO commissions_new SELECT * FROM commissions;
DROP TABLE commissions;
ALTER TABLE commissions_new RENAME TO commissions;
